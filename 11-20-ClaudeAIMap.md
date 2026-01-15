# CRM Implementation Map
**Version:** 1.0  
**Last Updated:** 2025-11-19  
**Purpose:** A step-by-step guide for AI agents to implement stability, validation, monitoring, and feature improvements across the CRM codebase.

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Phase 1: Standardize Validation](#phase-1-standardize-validation)
3. [Phase 1.5: Add Monitoring & Logging](#phase-15-add-monitoring--logging)
4. [Phase 2: Code Cleanup & Stability](#phase-2-code-cleanup--stability)
5. [Phase 3: Reports First](#phase-3-reports-first)
6. [Phase 4: Custom Backends](#phase-4-custom-backends)
7. [Appendix: Critical Infrastructure](#appendix-critical-infrastructure)

---

## System Overview

### Tech Stack
- **Frontend:** React + TypeScript + Vite
- **Backend:** Python + Flask + SQLAlchemy
- **Database:** PostgreSQL
- **Auth:** JWT tokens via `@requires_auth` decorator
- **Multi-tenancy:** `tenant_id` on all major entities

### Core Entities
- **Leads** (`leads` table)
- **Clients** (`clients` table)
- **Projects** (`projects` table)
- **Accounts** (`accounts` table)
- **Tasks** (`tasks` table)
- **Users** (`users` table)

### Current Architecture Patterns
- Frontend validation: ad-hoc JavaScript checks
- Backend validation: mix of manual checks and database constraints
- Auth: `@requires_auth` decorator (inconsistently applied)
- Multi-tenancy: `tenant_id` filtering (manually added to queries)

### Known Issues
1. **Validation scattered** across frontend, backend, and database
2. **N+1 queries** in list views and related entity loading
3. **Missing indexes** on frequently queried fields
4. **Inconsistent error handling** in API routes
5. **Auth decorator edge cases** around visibility rules
6. **No monitoring/logging** beyond console logs
7. **No backup strategy** for production data
8. **No rate limiting** on sensitive endpoints

---

## Phase 1: Standardize Validation

**Goal:** Establish a single source of truth for data validation on both frontend and backend.

### Step 1.1: Define Core Validation Schemas

#### Backend: Pydantic Models
**Location:** Create `backend/schemas/` directory

**Files to create:**
- `backend/schemas/__init__.py`
- `backend/schemas/lead_schema.py`
- `backend/schemas/client_schema.py`
- `backend/schemas/project_schema.py`
- `backend/schemas/account_schema.py`
- `backend/schemas/task_schema.py`
- `backend/schemas/user_schema.py`

**Example pattern for `lead_schema.py`:**
```python
from pydantic import BaseModel, Field, validator
from typing import Optional, Literal
from datetime import datetime

class LeadBase(BaseModel):
    company_name: str = Field(..., min_length=1, max_length=200)
    contact_name: Optional[str] = Field(None, max_length=200)
    email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    lead_status: Literal['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']
    notes: Optional[str] = None
    
    @validator('email')
    def validate_email(cls, v):
        if v and '@' not in v:
            raise ValueError('Invalid email format')
        return v
    
    @validator('phone')
    def validate_phone(cls, v):
        if v:
            # Strip non-numeric characters
            cleaned = ''.join(filter(str.isdigit, v))
            if len(cleaned) < 10:
                raise ValueError('Phone must have at least 10 digits')
        return v

class LeadCreate(LeadBase):
    pass

class LeadUpdate(BaseModel):
    company_name: Optional[str] = Field(None, min_length=1, max_length=200)
    contact_name: Optional[str] = Field(None, max_length=200)
    email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    lead_status: Optional[Literal['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']]
    notes: Optional[str] = None

class LeadResponse(LeadBase):
    id: int
    tenant_id: int
    created_by: int
    assigned_to: Optional[int]
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime]
    
    class Config:
        from_attributes = True
```

**Standard Status Categories (applies to all entities):**
- **new** - Just created, no action taken
- **contacted** - Initial outreach made
- **qualified** - Meets criteria, worth pursuing
- **proposal** - Formal proposal/quote sent
- **negotiation** - In active discussion
- **won** - Successfully closed/converted
- **lost** - Did not convert, archived

#### Frontend: Zod Schemas
**Location:** Create `frontend/src/schemas/` directory

**Files to create:**
- `frontend/src/schemas/leadSchema.ts`
- `frontend/src/schemas/clientSchema.ts`
- `frontend/src/schemas/projectSchema.ts`
- `frontend/src/schemas/accountSchema.ts`
- `frontend/src/schemas/taskSchema.ts`

**Example pattern for `leadSchema.ts`:**
```typescript
import { z } from 'zod';

export const leadStatusEnum = z.enum([
  'new',
  'contacted',
  'qualified',
  'proposal',
  'negotiation',
  'won',
  'lost'
]);

export const leadSchema = z.object({
  company_name: z.string().min(1, 'Company name is required').max(200),
  contact_name: z.string().max(200).optional(),
  email: z.string().email('Invalid email format').max(255).optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  lead_status: leadStatusEnum,
  notes: z.string().optional(),
});

export const leadUpdateSchema = leadSchema.partial();

export type Lead = z.infer<typeof leadSchema>;
export type LeadUpdate = z.infer<typeof leadUpdateSchema>;
```

### Step 1.2: Apply Validation in Backend Routes

**Pattern to follow in all route files:**

```python
from flask import Blueprint, request, jsonify
from backend.schemas.lead_schema import LeadCreate, LeadUpdate, LeadResponse
from pydantic import ValidationError

leads_bp = Blueprint('leads', __name__)

@leads_bp.route('/api/leads', methods=['POST'])
@requires_auth
def create_lead(current_user):
    try:
        # Parse and validate request body
        lead_data = LeadCreate(**request.get_json())
        
        # Add tenant context
        new_lead = Lead(
            **lead_data.model_dump(),
            tenant_id=current_user.tenant_id,
            created_by=current_user.id
        )
        
        db.session.add(new_lead)
        db.session.commit()
        
        return jsonify(LeadResponse.from_orm(new_lead).model_dump()), 201
        
    except ValidationError as e:
        return jsonify({'error': 'Validation failed', 'details': e.errors()}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
```

**Files to update:**
- `backend/routes/leads.py`
- `backend/routes/clients.py`
- `backend/routes/projects.py`
- `backend/routes/accounts.py`
- `backend/routes/tasks.py`

**For each route file:**
1. Import the corresponding Pydantic schema
2. Wrap all `POST`/`PUT`/`PATCH` handlers with schema validation
3. Replace manual validation checks with schema validation
4. Return structured error responses for validation failures

### Step 1.3: Apply Validation in Frontend Forms

**Pattern for form components:**

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { leadSchema, type Lead } from '@/schemas/leadSchema';

export function LeadForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Lead>({
    resolver: zodResolver(leadSchema),
  });

  const onSubmit = async (data: Lead) => {
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        // Handle validation errors from backend
        console.error('Backend validation failed:', errorData);
      }
    } catch (error) {
      console.error('Submit failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('company_name')} />
      {errors.company_name && <span>{errors.company_name.message}</span>}
      
      {/* ...other fields */}
    </form>
  );
}
```

**Files to update:**
- Any component with form inputs for Leads, Clients, Projects, Accounts, Tasks
- Common locations:
  - `frontend/src/components/forms/`
  - `frontend/src/pages/admin/`
  - Modal components with inline forms

**For each form component:**
1. Import the corresponding Zod schema
2. Add `zodResolver` to `useForm` hook
3. Display validation errors inline
4. Handle backend validation errors gracefully

### Step 1.4: Database Constraints Alignment

**Ensure database constraints match validation rules.**

**Create migration file:** `backend/migrations/001_align_constraints.sql`

```sql
-- Add CHECK constraints for status fields
ALTER TABLE leads 
ADD CONSTRAINT leads_status_check 
CHECK (lead_status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'));

ALTER TABLE clients 
ADD CONSTRAINT clients_status_check 
CHECK (client_status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'));

ALTER TABLE projects 
ADD CONSTRAINT projects_status_check 
CHECK (project_status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'));

-- Add NOT NULL constraints for required fields
ALTER TABLE leads ALTER COLUMN company_name SET NOT NULL;
ALTER TABLE clients ALTER COLUMN company_name SET NOT NULL;

-- Add length constraints
ALTER TABLE leads ADD CONSTRAINT leads_company_name_length CHECK (LENGTH(company_name) <= 200);
ALTER TABLE leads ADD CONSTRAINT leads_email_length CHECK (LENGTH(email) <= 255);
```

**Run migrations:**
```bash
cd backend
flask db upgrade
```

### Step 1.5: Validation Testing Checklist

**For AI agent: Run these tests to verify validation is working**

1. **Backend validation test:**
   - Send POST request with invalid data (e.g., empty company_name)
   - Verify 400 response with detailed error message
   - Send POST request with valid data
   - Verify 201 response

2. **Frontend validation test:**
   - Open form in browser
   - Try to submit with empty required fields
   - Verify inline error messages appear
   - Fill form correctly and submit
   - Verify success

3. **Database constraint test:**
   - Attempt to insert invalid status directly via SQL
   - Verify constraint violation error

---

## Phase 1.5: Add Monitoring & Logging

**Goal:** Instrument the application to track errors, performance, and usage patterns.

### Step 1.5.1: Install Monitoring Dependencies

**Backend:**
```bash
cd backend
pip install sentry-sdk[flask] python-json-logger
pip freeze > requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install @sentry/react @sentry/tracing
```

### Step 1.5.2: Configure Sentry (Backend)

**File:** `backend/config.py`

Add Sentry configuration:
```python
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

def init_sentry(app):
    sentry_sdk.init(
        dsn=app.config.get('SENTRY_DSN'),
        integrations=[
            FlaskIntegration(),
            SqlalchemyIntegration(),
        ],
        traces_sample_rate=0.1,  # 10% of requests
        environment=app.config.get('ENV', 'development'),
        release=app.config.get('RELEASE_VERSION', 'unknown'),
    )
```

**File:** `backend/app.py` or `backend/__init__.py`

```python
from backend.config import init_sentry

def create_app():
    app = Flask(__name__)
    # ...existing config
    
    if app.config.get('SENTRY_DSN'):
        init_sentry(app)
    
    return app
```

**Add to `.env`:**
```
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
RELEASE_VERSION=1.0.0
```

### Step 1.5.3: Configure Sentry (Frontend)

**File:** `frontend/src/main.tsx`

```typescript
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [new BrowserTracing()],
  tracesSampleRate: 0.1,
  environment: import.meta.env.MODE,
  release: import.meta.env.VITE_RELEASE_VERSION,
});

// Wrap your root component
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
    <App />
  </Sentry.ErrorBoundary>
);
```

**Add to `.env`:**
```
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
VITE_RELEASE_VERSION=1.0.0
```

### Step 1.5.4: Add Structured Logging

**File:** `backend/utils/logger.py`

```python
import logging
from pythonjsonlogger import jsonlogger

def setup_logger(name):
    logger = logging.getLogger(name)
    handler = logging.StreamHandler()
    
    formatter = jsonlogger.JsonFormatter(
        '%(asctime)s %(name)s %(levelname)s %(message)s'
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    
    return logger

# Usage in route files:
# from backend.utils.logger import setup_logger
# logger = setup_logger(__name__)
# logger.info('Lead created', extra={'lead_id': lead.id, 'tenant_id': lead.tenant_id})
```

**Update all route files to use structured logging:**

```python
from backend.utils.logger import setup_logger

logger = setup_logger(__name__)

@leads_bp.route('/api/leads', methods=['POST'])
@requires_auth
def create_lead(current_user):
    logger.info('Lead creation started', extra={
        'user_id': current_user.id,
        'tenant_id': current_user.tenant_id
    })
    
    try:
        # ...existing logic
        logger.info('Lead created successfully', extra={
            'lead_id': new_lead.id,
            'tenant_id': new_lead.tenant_id
        })
        return jsonify(...)
    except Exception as e:
        logger.error('Lead creation failed', extra={
            'error': str(e),
            'user_id': current_user.id
        })
        raise
```

### Step 1.5.5: Add Query Performance Monitoring

**File:** `backend/app.py`

```python
from sqlalchemy import event
from sqlalchemy.engine import Engine
import time

@event.listens_for(Engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    conn.info.setdefault('query_start_time', []).append(time.time())

@event.listens_for(Engine, "after_cursor_execute")
def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    total_time = time.time() - conn.info['query_start_time'].pop(-1)
    
    # Log slow queries (>100ms)
    if total_time > 0.1:
        logger.warning('Slow query detected', extra={
            'duration_ms': total_time * 1000,
            'query': statement[:200]  # First 200 chars
        })
```

### Step 1.5.6: Add API Request Timing Middleware

**File:** `backend/middleware/timing.py`

```python
from flask import request, g
import time
from backend.utils.logger import setup_logger

logger = setup_logger(__name__)

def init_timing_middleware(app):
    @app.before_request
    def before_request():
        g.start_time = time.time()
    
    @app.after_request
    def after_request(response):
        if hasattr(g, 'start_time'):
            elapsed = (time.time() - g.start_time) * 1000
            
            # Log slow requests (>500ms)
            if elapsed > 500:
                logger.warning('Slow request', extra={
                    'duration_ms': elapsed,
                    'method': request.method,
                    'path': request.path,
                    'status': response.status_code
                })
        
        return response
```

**Register in app:**
```python
from backend.middleware.timing import init_timing_middleware

def create_app():
    app = Flask(__name__)
    # ...
    init_timing_middleware(app)
    return app
```

### Step 1.5.7: Frontend Error Boundary

**File:** `frontend/src/components/ErrorBoundary.tsx`

```typescript
import React from 'react';
import * as Sentry from '@sentry/react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <button onClick={() => window.location.reload()}>Reload page</button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

### Step 1.5.8: Monitoring Checklist

**For AI agent: Verify monitoring is working**

1. **Trigger a backend error** (e.g., invalid route) and check Sentry dashboard
2. **Trigger a frontend error** (e.g., throw error in component) and check Sentry dashboard
3. **Check logs** for structured JSON output in console
4. **Run a slow query** (add `time.sleep(0.2)` in route) and verify slow query log appears
5. **Make multiple API requests** and verify timing middleware logs slow requests

---

## Phase 2: Code Cleanup & Stability

**Goal:** Fix N+1 queries, add missing indexes, improve error handling, and secure auth edge cases.

### Step 2.1: Fix N+1 Queries

**Common N+1 patterns to find and fix:**

#### Pattern 1: Loading Related Entities in List Views

**Problem code example:**
```python
@leads_bp.route('/api/leads', methods=['GET'])
@requires_auth
def get_leads(current_user):
    leads = Lead.query.filter_by(tenant_id=current_user.tenant_id).all()
    
    # N+1 here: each lead triggers a query for assigned user
    return jsonify([{
        'id': lead.id,
        'company_name': lead.company_name,
        'assigned_to_name': lead.assigned_user.name if lead.assigned_user else None
    } for lead in leads])
```

**Fixed code:**
```python
from sqlalchemy.orm import joinedload

@leads_bp.route('/api/leads', methods=['GET'])
@requires_auth
def get_leads(current_user):
    leads = Lead.query.options(
        joinedload(Lead.assigned_user)
    ).filter_by(tenant_id=current_user.tenant_id).all()
    
    return jsonify([{
        'id': lead.id,
        'company_name': lead.company_name,
        'assigned_to_name': lead.assigned_user.name if lead.assigned_user else None
    } for lead in leads])
```

#### Pattern 2: Loading Collections

**Problem code example:**
```python
@clients_bp.route('/api/clients/<int:client_id>', methods=['GET'])
@requires_auth
def get_client(current_user, client_id):
    client = Client.query.get(client_id)
    
    # N+1 here: projects loaded separately
    return jsonify({
        'id': client.id,
        'name': client.name,
        'projects': [{'id': p.id, 'name': p.name} for p in client.projects]
    })
```

**Fixed code:**
```python
@clients_bp.route('/api/clients/<int:client_id>', methods=['GET'])
@requires_auth
def get_client(current_user, client_id):
    client = Client.query.options(
        joinedload(Client.projects)
    ).get(client_id)
    
    return jsonify({
        'id': client.id,
        'name': client.name,
        'projects': [{'id': p.id, 'name': p.name} for p in client.projects]
    })
```

**Files to audit and fix:**
- `backend/routes/leads.py` - GET /api/leads, GET /api/leads/<id>
- `backend/routes/clients.py` - GET /api/clients, GET /api/clients/<id>
- `backend/routes/projects.py` - GET /api/projects, GET /api/projects/<id>
- `backend/routes/accounts.py` - GET /api/accounts, GET /api/accounts/<id>
- `backend/routes/tasks.py` - GET /api/tasks, GET /api/tasks/<id>

**How to identify N+1 queries:**
1. Enable SQLAlchemy logging: `app.config['SQLALCHEMY_ECHO'] = True`
2. Make a list view request
3. Count the number of SQL queries in logs
4. If you see 1 query + N queries (where N = number of results), you have N+1

### Step 2.2: Add Database Indexes

**Create migration file:** `backend/migrations/002_add_indexes.sql`

```sql
-- Indexes for foreign key lookups
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_created_by ON leads(created_by);
CREATE INDEX IF NOT EXISTS idx_leads_tenant_id ON leads(tenant_id);

CREATE INDEX IF NOT EXISTS idx_clients_assigned_to ON clients(assigned_to);
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON clients(created_by);
CREATE INDEX IF NOT EXISTS idx_clients_tenant_id ON clients(tenant_id);

CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_assigned_to ON projects(assigned_to);
CREATE INDEX IF NOT EXISTS idx_projects_tenant_id ON projects(tenant_id);

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_tenant_id ON tasks(tenant_id);

CREATE INDEX IF NOT EXISTS idx_accounts_tenant_id ON accounts(tenant_id);

-- Indexes for status filtering
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(lead_status);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(client_status);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(project_status);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(task_status);

-- Indexes for soft deletes
CREATE INDEX IF NOT EXISTS idx_leads_deleted_at ON leads(deleted_at);
CREATE INDEX IF NOT EXISTS idx_clients_deleted_at ON clients(deleted_at);
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON projects(deleted_at);
CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at ON tasks(deleted_at);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_leads_tenant_status ON leads(tenant_id, lead_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clients_tenant_status ON clients(tenant_id, client_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_tenant_status ON projects(tenant_id, project_status) WHERE deleted_at IS NULL;

-- Indexes for sorting (ORDER BY clauses)
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
```

**Run migration:**
```bash
cd backend
flask db upgrade
```

### Step 2.3: Improve Error Handling

**Standard error handling pattern for all routes:**

```python
from functools import wraps
from flask import jsonify
from sqlalchemy.exc import IntegrityError, DataError
from pydantic import ValidationError

def handle_errors(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except ValidationError as e:
            logger.warning('Validation error', extra={'errors': e.errors()})
            return jsonify({'error': 'Validation failed', 'details': e.errors()}), 400
        except IntegrityError as e:
            db.session.rollback()
            logger.error('Database integrity error', extra={'error': str(e)})
            return jsonify({'error': 'Database constraint violation'}), 409
        except DataError as e:
            db.session.rollback()
            logger.error('Database data error', extra={'error': str(e)})
            return jsonify({'error': 'Invalid data format'}), 400
        except PermissionError as e:
            logger.warning('Permission denied', extra={'error': str(e)})
            return jsonify({'error': 'Permission denied'}), 403
        except Exception as e:
            db.session.rollback()
            logger.error('Unexpected error', extra={'error': str(e)}, exc_info=True)
            return jsonify({'error': 'Internal server error'}), 500
    
    return decorated_function
```

**Apply to all routes:**

```python
@leads_bp.route('/api/leads', methods=['POST'])
@requires_auth
@handle_errors
def create_lead(current_user):
    # No try/except needed - decorator handles it
    lead_data = LeadCreate(**request.get_json())
    # ...
```

**Files to update:**
- All route files in `backend/routes/`

### Step 2.4: Secure Auth Consistency

**Audit `@requires_auth` decorator:**

**File:** `backend/decorators/auth.py` (or wherever it's defined)

**Current issues to fix:**
1. **Missing tenant isolation** - some routes don't check `tenant_id`
2. **Visibility rules edge cases** - shared resources not properly scoped
3. **No permission levels** - all authenticated users can do everything

**Enhanced auth decorator:**

```python
from functools import wraps
from flask import request, jsonify, g
import jwt
from backend.models import User

def requires_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        
        if not token:
            return jsonify({'error': 'No token provided'}), 401
        
        try:
            payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
            user = User.query.get(payload['user_id'])
            
            if not user:
                return jsonify({'error': 'Invalid user'}), 401
            
            # Store in Flask g object for request context
            g.current_user = user
            
            return f(current_user=user, *args, **kwargs)
            
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
    
    return decorated_function

def requires_tenant_access(model_class, id_param='id'):
    """
    Decorator to ensure user can only access resources in their tenant.
    Usage: @requires_tenant_access(Lead, 'lead_id')
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            resource_id = kwargs.get(id_param)
            resource = model_class.query.get(resource_id)
            
            if not resource:
                return jsonify({'error': 'Resource not found'}), 404
            
            if resource.tenant_id != g.current_user.tenant_id:
                return jsonify({'error': 'Access denied'}), 403
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator
```

**Apply tenant access checks:**

```python
@leads_bp.route('/api/leads/<int:lead_id>', methods=['GET'])
@requires_auth
@requires_tenant_access(Lead, 'lead_id')
def get_lead(current_user, lead_id):
    lead = Lead.query.get(lead_id)
    # lead.tenant_id is already verified by decorator
    return jsonify(LeadResponse.from_orm(lead).model_dump())
```

**Files to update:**
- All routes that access specific resources by ID
- Focus on GET, PUT, DELETE routes for Leads, Clients, Projects, Accounts, Tasks

### Step 2.5: Tenant Isolation Middleware

**File:** `backend/middleware/tenant_filter.py`

```python
from sqlalchemy import event
from sqlalchemy.orm import Session
from flask import g

def init_tenant_filter(app):
    """
    Automatically add tenant_id filter to all queries.
    WARNING: Only enable after thorough testing.
    """
    
    @event.listens_for(Session, 'after_attach')
    def receive_after_attach(session, instance):
        if hasattr(g, 'current_user') and hasattr(instance, 'tenant_id'):
            # Auto-populate tenant_id on new objects
            if not instance.tenant_id:
                instance.tenant_id = g.current_user.tenant_id
    
    # More aggressive option: query filter
    # Use with caution - can break admin/support tools
    # @event.listens_for(Session, 'before_flush')
    # def receive_before_flush(session, flush_context, instances):
    #     if hasattr(g, 'current_user'):
    #         for instance in session.new:
    #             if hasattr(instance, 'tenant_id') and not instance.tenant_id:
    #                 instance.tenant_id = g.current_user.tenant_id
```

**Note for AI agent:** This is advanced and should be done after basic tenant checks are working. Test extensively.

### Step 2.6: Stability Checklist

**For AI agent: Verify stability improvements**

1. **N+1 queries fixed:**
   - Enable `SQLALCHEMY_ECHO = True`
   - Make list view requests for Leads, Clients, Projects
   - Verify no more than 2-3 queries per request

2. **Indexes working:**
   - Run `EXPLAIN ANALYZE` on common queries
   - Verify indexes are being used (look for "Index Scan" in plan)

3. **Error handling consistent:**
   - Trigger various errors (validation, not found, permission denied)
   - Verify consistent JSON error responses
   - Verify errors logged to Sentry

4. **Auth secure:**
   - Try to access another tenant's resource
   - Verify 403 response
   - Try expired/invalid token
   - Verify 401 response

---

## Phase 3: Reports First

**Goal:** Build comprehensive, filterable, sortable reports for Leads, Clients, Projects, and Accounts.

### Step 3.1: Create Report Component Foundation

**File:** `frontend/src/components/ReportTable.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { Table, Th, Td, Button, Input, Select } from '@/components/ui';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: 'text' | 'select' | 'date';
  filterOptions?: { value: string; label: string }[];
}

interface ReportTableProps {
  title: string;
  columns: Column[];
  fetchData: (filters: any, sort: any, page: number) => Promise<{ data: any[]; total: number }>;
  rowActions?: (row: any) => React.ReactNode;
}

export function ReportTable({ title, columns, fetchData, rowActions }: ReportTableProps) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [sort, setSort] = useState<{ field: string; order: 'asc' | 'desc' }>({ field: 'created_at', order: 'desc' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 50;

  useEffect(() => {
    loadData();
  }, [filters, sort, page]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await fetchData(filters, sort, page);
      setData(result.data);
      setTotal(result.total);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    setSort(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1); // Reset to first page on filter change
  };

  const exportToCSV = () => {
    // TODO: Implement CSV export
    const csv = [
      columns.map(c => c.label).join(','),
      ...data.map(row => columns.map(c => row[c.key]).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(' ', '_')}_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="report-container">
      <div className="report-header">
        <h2>{title}</h2>
        <Button onClick={exportToCSV}>Export CSV</Button>
      </div>

      {/* Filters */}
      <div className="report-filters">
        {columns.filter(c => c.filterable).map(column => (
          <div key={column.key} className="filter-field">
            <label>{column.label}</label>
            {column.filterType === 'select' ? (
              <Select
                value={filters[column.key] || ''}
                onChange={(e) => handleFilterChange(column.key, e.target.value)}
              >
                <option value="">All</option>
                {column.filterOptions?.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            ) : (
              <Input
                type={column.filterType || 'text'}
                value={filters[column.key] || ''}
                onChange={(e) => handleFilterChange(column.key, e.target.value)}
                placeholder={`Filter by ${column.label}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Table */}
      <Table>
        <thead>
          <tr>
            {columns.map(column => (
              <Th
                key={column.key}
                sortable={column.sortable}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                {column.label}
                {sort.field === column.key && (sort.order === 'asc' ? ' ↑' : ' ↓')}
              </Th>
            ))}
            {rowActions && <Th>Actions</Th>}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={columns.length + 1}>Loading...</td></tr>
          ) : data.length === 0 ? (
            <tr><td colSpan={columns.length + 1}>No data found</td></tr>
          ) : (
            data.map((row, idx) => (
              <tr key={idx}>
                {columns.map(column => (
                  <Td key={column.key}>{row[column.key]}</Td>
                ))}
                {rowActions && <Td>{rowActions(row)}</Td>}
              </tr>
            ))
          )}
        </tbody>
      </Table>

      {/* Pagination */}
      <div className="report-pagination">
        <span>Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} of {total}</span>
        <Button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
        <Button disabled={page * pageSize >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
      </div>
    </div>
  );
}
```

### Step 3.2: Create Report Pages

#### Leads Report

**File:** `frontend/src/pages/reports/LeadsReport.tsx`

```typescript
import React from 'react';
import { ReportTable } from '@/components/ReportTable';

const columns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'company_name', label: 'Company', sortable: true, filterable: true, filterType: 'text' },
  { key: 'contact_name', label: 'Contact', sortable: true, filterable: true, filterType: 'text' },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'phone', label: 'Phone', sortable: true },
  { 
    key: 'lead_status', 
    label: 'Status', 
    sortable: true, 
    filterable: true, 
    filterType: 'select',
    filterOptions: [
      { value: 'new', label: 'New' },
      { value: 'contacted', label: 'Contacted' },
      { value: 'qualified', label: 'Qualified' },
      { value: 'proposal', label: 'Proposal' },
      { value: 'negotiation', label: 'Negotiation' },
      { value: 'won', label: 'Won' },
      { value: 'lost', label: 'Lost' },
    ]
  },
  { key: 'assigned_to_name', label: 'Assigned To', sortable: true },
  { key: 'created_at', label: 'Created', sortable: true, filterable: true, filterType: 'date' },
];

async function fetchLeads(filters: any, sort: any, page: number) {
  const params = new URLSearchParams({
    page: page.toString(),
    sort_by: sort.field,
    sort_order: sort.order,
    ...filters
  });

  const response = await fetch(`/api/leads?${params}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  if (!response.ok) throw new Error('Failed to fetch leads');
  
  return response.json();
}

export function LeadsReport() {
  return (
    <ReportTable
      title="Leads Report"
      columns={columns}
      fetchData={fetchLeads}
      rowActions={(row) => (
        <>
          <button onClick={() => window.location.href = `/leads/${row.id}`}>View</button>
          <button onClick={() => window.location.href = `/leads/${row.id}/edit`}>Edit</button>
        </>
      )}
    />
  );
}
```

#### Clients Report

**File:** `frontend/src/pages/reports/ClientsReport.tsx`

```typescript
import React from 'react';
import { ReportTable } from '@/components/ReportTable';

const columns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'company_name', label: 'Company', sortable: true, filterable: true, filterType: 'text' },
  { key: 'contact_name', label: 'Contact', sortable: true, filterable: true, filterType: 'text' },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'phone', label: 'Phone', sortable: true },
  { 
    key: 'client_status', 
    label: 'Status', 
    sortable: true, 
    filterable: true, 
    filterType: 'select',
    filterOptions: [
      { value: 'new', label: 'New' },
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'churned', label: 'Churned' },
    ]
  },
  { key: 'project_count', label: '# Projects', sortable: true },
  { key: 'total_revenue', label: 'Revenue', sortable: true },
  { key: 'assigned_to_name', label: 'Account Manager', sortable: true },
  { key: 'created_at', label: 'Created', sortable: true, filterable: true, filterType: 'date' },
];

async function fetchClients(filters: any, sort: any, page: number) {
  const params = new URLSearchParams({
    page: page.toString(),
    sort_by: sort.field,
    sort_order: sort.order,
    ...filters
  });

  const response = await fetch(`/api/clients?${params}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  if (!response.ok) throw new Error('Failed to fetch clients');
  
  return response.json();
}

export function ClientsReport() {
  return (
    <ReportTable
      title="Clients Report"
      columns={columns}
      fetchData={fetchClients}
      rowActions={(row) => (
        <>
          <button onClick={() => window.location.href = `/clients/${row.id}`}>View</button>
          <button onClick={() => window.location.href = `/clients/${row.id}/edit`}>Edit</button>
        </>
      )}
    />
  );
}
```

#### Projects Report

**File:** `frontend/src/pages/reports/ProjectsReport.tsx`

```typescript
import React from 'react';
import { ReportTable } from '@/components/ReportTable';

const columns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'project_name', label: 'Project', sortable: true, filterable: true, filterType: 'text' },
  { key: 'client_name', label: 'Client', sortable: true, filterable: true, filterType: 'text' },
  { 
    key: 'project_status', 
    label: 'Status', 
    sortable: true, 
    filterable: true, 
    filterType: 'select',
    filterOptions: [
      { value: 'planning', label: 'Planning' },
      { value: 'active', label: 'Active' },
      { value: 'on_hold', label: 'On Hold' },
      { value: 'completed', label: 'Completed' },
      { value: 'cancelled', label: 'Cancelled' },
    ]
  },
  { key: 'budget', label: 'Budget', sortable: true },
  { key: 'actual_cost', label: 'Actual Cost', sortable: true },
  { key: 'start_date', label: 'Start Date', sortable: true, filterable: true, filterType: 'date' },
  { key: 'end_date', label: 'End Date', sortable: true, filterable: true, filterType: 'date' },
  { key: 'assigned_to_name', label: 'Project Manager', sortable: true },
];

async function fetchProjects(filters: any, sort: any, page: number) {
  const params = new URLSearchParams({
    page: page.toString(),
    sort_by: sort.field,
    sort_order: sort.order,
    ...filters
  });

  const response = await fetch(`/api/projects?${params}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  if (!response.ok) throw new Error('Failed to fetch projects');
  
  return response.json();
}

export function ProjectsReport() {
  return (
    <ReportTable
      title="Projects Report"
      columns={columns}
      fetchData={fetchProjects}
      rowActions={(row) => (
        <>
          <button onClick={() => window.location.href = `/projects/${row.id}`}>View</button>
          <button onClick={() => window.location.href = `/projects/${row.id}/edit`}>Edit</button>
        </>
      )}
    />
  );
}
```

### Step 3.3: Backend Report Endpoints

**Common report pattern for all entities:**

```python
@leads_bp.route('/api/leads', methods=['GET'])
@requires_auth
def get_leads_report(current_user):
    # Parse query params
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 50, type=int)
    sort_by = request.args.get('sort_by', 'created_at')
    sort_order = request.args.get('sort_order', 'desc')
    
    # Build base query
    query = Lead.query.filter_by(
        tenant_id=current_user.tenant_id,
        deleted_at=None
    )
    
    # Apply filters
    if company_name := request.args.get('company_name'):
        query = query.filter(Lead.company_name.ilike(f'%{company_name}%'))
    
    if contact_name := request.args.get('contact_name'):
        query = query.filter(Lead.contact_name.ilike(f'%{contact_name}%'))
    
    if lead_status := request.args.get('lead_status'):
        query = query.filter_by(lead_status=lead_status)
    
    if created_after := request.args.get('created_after'):
        query = query.filter(Lead.created_at >= created_after)
    
    if created_before := request.args.get('created_before'):
        query = query.filter(Lead.created_at <= created_before)
    
    # Apply sorting
    sort_column = getattr(Lead, sort_by, Lead.created_at)
    if sort_order == 'desc':
        sort_column = sort_column.desc()
    
    query = query.order_by(sort_column)
    
    # Eager load relations to avoid N+1
    query = query.options(
        joinedload(Lead.assigned_user),
        joinedload(Lead.created_by_user)
    )
    
    # Paginate
    total = query.count()
    leads = query.offset((page - 1) * page_size).limit(page_size).all()
    
    return jsonify({
        'data': [{
            'id': lead.id,
            'company_name': lead.company_name,
            'contact_name': lead.contact_name,
            'email': lead.email,
            'phone': lead.phone,
            'lead_status': lead.lead_status,
            'assigned_to_name': lead.assigned_user.name if lead.assigned_user else None,
            'created_at': lead.created_at.isoformat(),
        } for lead in leads],
        'total': total,
        'page': page,
        'page_size': page_size
    })
```

**Files to update:**
- `backend/routes/leads.py` - add/update GET /api/leads with report features
- `backend/routes/clients.py` - add/update GET /api/clients with report features
- `backend/routes/projects.py` - add/update GET /api/projects with report features
- `backend/routes/accounts.py` - add/update GET /api/accounts with report features

### Step 3.4: Add Report Navigation

**File:** `frontend/src/components/Navigation.tsx`

```typescript
<nav>
  {/* ...existing nav items */}
  <div className="nav-section">
    <h3>Reports</h3>
    <a href="/reports/leads">Leads Report</a>
    <a href="/reports/clients">Clients Report</a>
    <a href="/reports/projects">Projects Report</a>
    <a href="/reports/accounts">Accounts Report</a>
  </div>
</nav>
```

### Step 3.5: Reports Checklist

**For AI agent: Verify reports are working**

1. **Load each report page**
   - Leads, Clients, Projects, Accounts
   - Verify data loads and displays correctly

2. **Test filtering**
   - Apply text filters (company name, contact name)
   - Apply status filters
   - Apply date filters
   - Verify results update correctly

3. **Test sorting**
   - Click column headers
   - Verify sort order changes (asc/desc)
   - Verify visual indicator (↑↓) updates

4. **Test pagination**
   - Navigate to page 2, 3, etc.
   - Verify correct records show
   - Verify "Previous" button works

5. **Test CSV export**
   - Click "Export CSV" button
   - Verify file downloads
   - Open CSV and verify correct data

6. **Test performance**
   - Load report with 1000+ records
   - Verify page loads in <2 seconds
   - Verify no N+1 queries (check logs)

---

## Phase 4: Custom Backends

**Goal:** Enable per-customer custom status workflows, pipelines, and business logic.

### Step 4.1: Design Custom Backend Architecture

**Overview:**
- **Default backend:** Generic statuses, shared by all tenants
- **Custom backend:** Tenant-specific configuration, stored in database
- **Backend selector:** Middleware that loads appropriate backend per tenant

### Step 4.2: Create Backend Configuration Models

**File:** `backend/models/backend_config.py`

```python
from backend.database import db
from sqlalchemy.dialects.postgresql import JSONB

class TenantBackendConfig(db.Model):
    __tablename__ = 'tenant_backend_configs'
    
    id = db.Column(db.Integer, primary_key=True)
    tenant_id = db.Column(db.Integer, db.ForeignKey('tenants.id'), nullable=False, unique=True)
    backend_type = db.Column(db.String(50), default='default')  # 'default' or 'custom'
    
    # Custom status definitions
    lead_statuses = db.Column(JSONB, default=['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'])
    client_statuses = db.Column(JSONB, default=['new', 'active', 'inactive', 'churned'])
    project_statuses = db.Column(JSONB, default=['planning', 'active', 'on_hold', 'completed', 'cancelled'])
    task_statuses = db.Column(JSONB, default=['todo', 'in_progress', 'review', 'done', 'cancelled'])
    
    # Custom validation rules
    validation_rules = db.Column(JSONB, default={})
    
    # Custom workflow rules
    workflow_rules = db.Column(JSONB, default={})
    
    # Feature flags
    features = db.Column(JSONB, default={})
    
    created_at = db.Column(db.DateTime, default=db.func.now())
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())
    
    tenant = db.relationship('Tenant', backref='backend_config')
```

**Migration:**
```sql
CREATE TABLE tenant_backend_configs (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL UNIQUE REFERENCES tenants(id),
    backend_type VARCHAR(50) DEFAULT 'default',
    lead_statuses JSONB DEFAULT '["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"]',
    client_statuses JSONB DEFAULT '["new", "active", "inactive", "churned"]',
    project_statuses JSONB DEFAULT '["planning", "active", "on_hold", "completed", "cancelled"]',
    task_statuses JSONB DEFAULT '["todo", "in_progress", "review", "done", "cancelled"]',
    validation_rules JSONB DEFAULT '{}',
    workflow_rules JSONB DEFAULT '{}',
    features JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Step 4.3: Create Backend Loader Middleware

**File:** `backend/middleware/backend_loader.py`

```python
from flask import g
from backend.models.backend_config import TenantBackendConfig

def load_tenant_backend():
    """
    Load tenant-specific backend configuration.
    Call this in @requires_auth decorator after user is loaded.
    """
    if not hasattr(g, 'current_user'):
        return
    
    config = TenantBackendConfig.query.filter_by(
        tenant_id=g.current_user.tenant_id
    ).first()
    
    if not config:
        # Create default config for tenant
        config = TenantBackendConfig(tenant_id=g.current_user.tenant_id)
        db.session.add(config)
        db.session.commit()
    
    g.backend_config = config

# Update auth decorator to include backend loading
def requires_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # ...existing auth logic
        g.current_user = user
        load_tenant_backend()  # ADD THIS LINE
        return f(current_user=user, *args, **kwargs)
    return decorated_function
```

### Step 4.4: Update Validation to Use Backend Config

**File:** `backend/schemas/lead_schema.py`

```python
from flask import g
from pydantic import BaseModel, Field, validator
from typing import Literal, Optional

def get_allowed_lead_statuses():
    """Get allowed lead statuses from tenant backend config"""
    if hasattr(g, 'backend_config'):
        return g.backend_config.lead_statuses
    return ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']

class LeadBase(BaseModel):
    company_name: str = Field(..., min_length=1, max_length=200)
    contact_name: Optional[str] = Field(None, max_length=200)
    email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    lead_status: str  # Changed from Literal to str
    notes: Optional[str] = None
    
    @validator('lead_status')
    def validate_status(cls, v):
        allowed = get_allowed_lead_statuses()
        if v not in allowed:
            raise ValueError(f'Invalid status. Must be one of: {", ".join(allowed)}')
        return v
```

### Step 4.5: Create Backend Admin UI

**File:** `frontend/src/pages/admin/BackendConfig.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { Button, Input, Label } from '@/components/ui';

interface BackendConfig {
  backend_type: string;
  lead_statuses: string[];
  client_statuses: string[];
  project_statuses: string[];
  task_statuses: string[];
}

export function BackendConfigPage() {
  const [config, setConfig] = useState<BackendConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('');
  const [editingEntity, setEditingEntity] = useState<'lead' | 'client' | 'project' | 'task' | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/admin/backend-config', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error('Failed to load config:', error);
    } finally {
      setLoading(false);
    }
  };

  const addStatus = async (entity: string) => {
    if (!newStatus.trim()) return;
    
    const statusKey = `${entity}_statuses`;
    const updated = {
      ...config,
      [statusKey]: [...(config as any)[statusKey], newStatus.trim()]
    };
    
    await saveConfig(updated);
    setNewStatus('');
    setEditingEntity(null);
  };

  const removeStatus = async (entity: string, status: string) => {
    const statusKey = `${entity}_statuses`;
    const updated = {
      ...config,
      [statusKey]: (config as any)[statusKey].filter((s: string) => s !== status)
    };
    
    await saveConfig(updated);
  };

  const saveConfig = async (updated: BackendConfig) => {
    try {
      const response = await fetch('/api/admin/backend-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updated)
      });
      
      if (response.ok) {
        setConfig(updated);
        alert('Configuration saved successfully');
      }
    } catch (error) {
      console.error('Failed to save config:', error);
      alert('Failed to save configuration');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!config) return <div>Failed to load configuration</div>;

  return (
    <div className="backend-config-page">
      <h1>Backend Configuration</h1>
      
      <div className="config-section">
        <h2>Backend Type</h2>
        <p>Current: <strong>{config.backend_type}</strong></p>
        <Button onClick={() => saveConfig({ ...config, backend_type: config.backend_type === 'default' ? 'custom' : 'default' })}>
          Switch to {config.backend_type === 'default' ? 'Custom' : 'Default'}
        </Button>
      </div>

      {config.backend_type === 'custom' && (
        <>
          <StatusEditor
            title="Lead Statuses"
            statuses={config.lead_statuses}
            onAdd={(s) => addStatus('lead')}
            onRemove={(s) => removeStatus('lead', s)}
          />
          
          <StatusEditor
            title="Client Statuses"
            statuses={config.client_statuses}
            onAdd={(s) => addStatus('client')}
            onRemove={(s) => removeStatus('client', s)}
          />
          
          <StatusEditor
            title="Project Statuses"
            statuses={config.project_statuses}
            onAdd={(s) => addStatus('project')}
            onRemove={(s) => removeStatus('project', s)}
          />
          
          <StatusEditor
            title="Task Statuses"
            statuses={config.task_statuses}
            onAdd={(s) => addStatus('task')}
            onRemove={(s) => removeStatus('task', s)}
          />
        </>
      )}
    </div>
  );
}

function StatusEditor({ title, statuses, onAdd, onRemove }: any) {
  const [newStatus, setNewStatus] = useState('');

  return (
    <div className="status-editor">
      <h3>{title}</h3>
      <ul>
        {statuses.map((status: string) => (
          <li key={status}>
            {status}
            <Button onClick={() => onRemove(status)}>Remove</Button>
          </li>
        ))}
      </ul>
      <div>
        <Input
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value)}
          placeholder="New status name"
        />
        <Button onClick={() => { onAdd(newStatus); setNewStatus(''); }}>Add</Button>
      </div>
    </div>
  );
}
```

### Step 4.6: Backend Config API Routes

**File:** `backend/routes/admin.py`

```python
from flask import Blueprint, request, jsonify
from backend.models.backend_config import TenantBackendConfig
from backend.decorators.auth import requires_auth, requires_admin

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/api/admin/backend-config', methods=['GET'])
@requires_auth
@requires_admin
def get_backend_config(current_user):
    config = TenantBackendConfig.query.filter_by(
        tenant_id=current_user.tenant_id
    ).first()
    
    if not config:
        config = TenantBackendConfig(tenant_id=current_user.tenant_id)
        db.session.add(config)
        db.session.commit()
    
    return jsonify({
        'backend_type': config.backend_type,
        'lead_statuses': config.lead_statuses,
        'client_statuses': config.client_statuses,
        'project_statuses': config.project_statuses,
        'task_statuses': config.task_statuses,
    })

@admin_bp.route('/api/admin/backend-config', methods=['PUT'])
@requires_auth
@requires_admin
def update_backend_config(current_user):
    config = TenantBackendConfig.query.filter_by(
        tenant_id=current_user.tenant_id
    ).first()
    
    if not config:
        return jsonify({'error': 'Config not found'}), 404
    
    data = request.get_json()
    
    config.backend_type = data.get('backend_type', config.backend_type)
    config.lead_statuses = data.get('lead_statuses', config.lead_statuses)
    config.client_statuses = data.get('client_statuses', config.client_statuses)
    config.project_statuses = data.get('project_statuses', config.project_statuses)
    config.task_statuses = data.get('task_statuses', config.task_statuses)
    
    db.session.commit()
    
    return jsonify({'success': True})
```

### Step 4.7: Custom Backends Checklist

**For AI agent: Verify custom backends are working**

1. **Load backend config page** (`/admin/backend-config`)
   - Verify current config displays
   - Verify default statuses show

2. **Switch to custom backend**
   - Click "Switch to Custom" button
   - Verify backend_type changes to 'custom'

3. **Add custom status**
   - Add new lead status "under_review"
   - Verify it appears in list
   - Verify it saves to database

4. **Test custom status in form**
   - Go to create lead form
   - Verify new status appears in dropdown
   - Create lead with custom status
   - Verify lead saves successfully

5. **Test validation with custom status**
   - Try to set invalid status via API
   - Verify validation error
   - Try to set custom status via API
   - Verify success

6. **Remove custom status**
   - Remove "under_review" status
   - Verify it disappears from dropdown
   - Verify validation rejects it

---

## Appendix: Critical Infrastructure

### A1: Backups

**Automated daily PostgreSQL backups:**

**File:** `scripts/backup.sh`

```bash
#!/bin/bash
# Daily PostgreSQL backup script

# Configuration
DB_NAME="crm_production"
DB_USER="postgres"
BACKUP_DIR="/var/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Perform backup
pg_dump -U $DB_USER -F c -b -v -f "$BACKUP_DIR/${DB_NAME}_$DATE.backup" $DB_NAME

# Compress backup
gzip "$BACKUP_DIR/${DB_NAME}_$DATE.backup"

# Delete old backups (older than retention period)
find $BACKUP_DIR -name "*.backup.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: ${DB_NAME}_$DATE.backup.gz"
```

**Setup cron job:**
```bash
# Run daily at 2 AM
0 2 * * * /path/to/scripts/backup.sh >> /var/log/crm_backup.log 2>&1
```

**File:** `scripts/restore.sh`

```bash
#!/bin/bash
# Restore PostgreSQL backup

if [ -z "$1" ]; then
    echo "Usage: ./restore.sh <backup_file>"
    exit 1
fi

BACKUP_FILE=$1
DB_NAME="crm_production"
DB_USER="postgres"

# Decompress if needed
if [[ $BACKUP_FILE == *.gz ]]; then
    gunzip -c $BACKUP_FILE > /tmp/restore.backup
    BACKUP_FILE=/tmp/restore.backup
fi

# Restore
pg_restore -U $DB_USER -d $DB_NAME -v $BACKUP_FILE

echo "Restore completed"
```

### A2: Rate Limiting

**Install Redis:**
```bash
pip install redis flask-limiter
```

**File:** `backend/extensions.py`

```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import redis

redis_client = redis.Redis(
    host='localhost',
    port=6379,
    db=0,
    decode_responses=True
)

limiter = Limiter(
    key_func=get_remote_address,
    storage_uri="redis://localhost:6379",
    default_limits=["200 per day", "50 per hour"]
)
```

**File:** `backend/app.py`

```python
from backend.extensions import limiter

def create_app():
    app = Flask(__name__)
    # ...
    limiter.init_app(app)
    return app
```

**Apply rate limits:**

```python
@auth_bp.route('/api/auth/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    # Login logic
    pass

@leads_bp.route('/api/leads/search', methods=['GET'])
@requires_auth
@limiter.limit("30 per minute")
def search_leads(current_user):
    # Search logic
    pass

@reports_bp.route('/api/reports/leads', methods=['GET'])
@requires_auth
@limiter.limit("10 per minute")
def leads_report(current_user):
    # Report logic
    pass
```

### A3: Soft Delete Recovery

**File:** `backend/routes/trash.py`

```python
from flask import Blueprint, request, jsonify
from backend.decorators.auth import requires_auth
from backend.models import Lead, Client, Project, Task

trash_bp = Blueprint('trash', __name__)

@trash_bp.route('/api/trash/<entity_type>', methods=['GET'])
@requires_auth
def get_trash(current_user, entity_type):
    """Get all soft-deleted entities of a given type"""
    
    model_map = {
        'leads': Lead,
        'clients': Client,
        'projects': Project,
        'tasks': Task
    }
    
    if entity_type not in model_map:
        return jsonify({'error': 'Invalid entity type'}), 400
    
    model = model_map[entity_type]
    
    items = model.query.filter(
        model.tenant_id == current_user.tenant_id,
        model.deleted_at.isnot(None)
    ).all()
    
    return jsonify([{
        'id': item.id,
        'name': getattr(item, 'company_name', getattr(item, 'name', str(item.id))),
        'deleted_at': item.deleted_at.isoformat()
    } for item in items])

@trash_bp.route('/api/trash/<entity_type>/<int:entity_id>/restore', methods=['POST'])
@requires_auth
def restore_item(current_user, entity_type, entity_id):
    """Restore a soft-deleted entity"""
    
    model_map = {
        'leads': Lead,
        'clients': Client,
        'projects': Project,
        'tasks': Task
    }
    
    if entity_type not in model_map:
        return jsonify({'error': 'Invalid entity type'}), 400
    
    model = model_map[entity_type]
    
    item = model.query.filter_by(
        id=entity_id,
        tenant_id=current_user.tenant_id
    ).first()
    
    if not item:
        return jsonify({'error': 'Item not found'}), 404
    
    item.deleted_at = None
    db.session.commit()
    
    return jsonify({'success': True, 'message': f'{entity_type[:-1].capitalize()} restored'})
```

---

## Implementation Timeline

### Week 1: Foundation (Nov 19 - Nov 25)
- **Days 1-2:** Phase 1 (Validation)
  - Create Pydantic schemas
  - Create Zod schemas
  - Apply to 2-3 route files and forms
- **Days 3-4:** Phase 1.5 (Monitoring)
  - Setup Sentry
  - Add structured logging
  - Add timing middleware
- **Days 5-7:** Phase 2 Start (Cleanup)
  - Fix N+1 queries in leads/clients
  - Add database indexes
  - Standardize error handling

### Week 2-3: Stability (Nov 26 - Dec 9)
- **Week 2:** Phase 2 Continue
  - Complete N+1 fixes
  - Security audit of auth
  - Tenant isolation review
- **Week 3:** Phase 2 Complete + Phase 3 Start
  - Final stability testing
  - Begin report component foundation
  - Build leads report

### Week 4-5: Reports (Dec 10 - Dec 23)
- **Week 4:** Phase 3
  - Complete all report pages
  - Add CSV export
  - Performance testing with large datasets
- **Week 5:** Phase 3 Polish
  - Report UI refinements
  - Add saved filters
  - Add report scheduling

### Week 6-7: Custom Backends (Dec 24 - Jan 6)
- **Week 6:** Phase 4 Foundation
  - Backend config models
  - Backend loader middleware
  - Dynamic validation
- **Week 7:** Phase 4 Complete
  - Admin UI for backend config
  - Testing with custom statuses
  - Documentation for custom backends

### Week 8: Infrastructure (Jan 7 - Jan 13)
- **Appendix items:**
  - Backup automation
  - Rate limiting
  - Soft delete recovery UI

---

## AI Agent Execution Notes

### For Sequential File-by-File Work:
1. **Always start with the backend schemas** before touching routes
2. **Test each change immediately** - don't batch multiple files
3. **Read the entire file** before making changes to understand context
4. **Use the exact patterns** shown in this document
5. **Log every change** you make in a progress file

### For Agentic/Autonomous Work:
1. **Create a progress tracker** at the start
2. **Follow the phases in order** - don't skip ahead
3. **Run the checklist** after each phase before moving on
4. **If a test fails**, stop and fix before proceeding
5. **Update this document** if you discover better patterns

### Common Pitfalls to Avoid:
1. ❌ Changing database without migrations
2. ❌ Adding validation without updating both frontend + backend
3. ❌ Breaking existing working features
4. ❌ Forgetting to add tenant_id filters
5. ❌ Not testing with multiple users/tenants
6. ❌ Ignoring N+1 queries in "small" views

### Success Criteria for Each Phase:
- **Phase 1:** All forms validate consistently, backend returns structured errors
- **Phase 1.5:** Sentry catches errors, logs show structured JSON
- **Phase 2:** No more than 3 queries per list view, all routes have try/except
- **Phase 3:** All reports load <2s with 1000+ records, export works
- **Phase 4:** Custom statuses work end-to-end, validation adapts per tenant

---

## Support & Questions

When working through this map:
1. **Refer back to this document constantly**
2. **Follow the patterns exactly** until you understand why they work
3. **Test at every step** - don't accumulate untested changes
4. **Document any deviations** you make from this plan

This map is designed to be clear enough that **any AI agent** can pick it up and execute without requiring extensive back-and-forth. Trust the process, follow the checklist, and verify at each phase.

Good luck! 🚀