from quart import Blueprint, request, jsonify, g
from werkzeug.utils import secure_filename
import pandas as pd
import json
from datetime import datetime
from app.models import Lead, User
from app.database import SessionLocal
from app.utils.auth_utils import requires_auth
from app.utils.phone_utils import clean_phone_number
from app.constants import TYPE_OPTIONS, LEAD_STATUS_OPTIONS, PHONE_LABELS
import io
import tempfile
import os

imports_bp = Blueprint("imports", __name__, url_prefix="/api/import")

# Valid field mappings for leads
VALID_LEAD_FIELDS = {
    'name': {'required': True, 'type': 'string', 'max_length': 100},
    'contact_person': {'required': False, 'type': 'string', 'max_length': 100},
    'contact_title': {'required': False, 'type': 'string', 'max_length': 100},
    'email': {'required': False, 'type': 'email', 'max_length': 120},
    'phone': {'required': False, 'type': 'phone', 'max_length': 20},
    'phone_label': {'required': False, 'type': 'choice', 'choices': PHONE_LABELS},
    'secondary_phone': {'required': False, 'type': 'phone', 'max_length': 20},
    'secondary_phone_label': {'required': False, 'type': 'choice', 'choices': PHONE_LABELS},
    'address': {'required': False, 'type': 'string', 'max_length': 255},
    'city': {'required': False, 'type': 'string', 'max_length': 100},
    'state': {'required': False, 'type': 'string', 'max_length': 100},
    'zip': {'required': False, 'type': 'string', 'max_length': 20},
    'notes': {'required': False, 'type': 'text'},
    'type': {'required': False, 'type': 'choice', 'choices': TYPE_OPTIONS},
    'lead_status': {'required': False, 'type': 'choice', 'choices': LEAD_STATUS_OPTIONS}
}

def read_file_to_dataframe(file_content, filename):
    """Read uploaded file into pandas DataFrame"""
    try:
        if filename.endswith('.csv'):
            # Try different encodings for CSV
            for encoding in ['utf-8', 'latin1', 'cp1252']:
                try:
                    df = pd.read_csv(io.StringIO(file_content.decode(encoding)))
                    break
                except UnicodeDecodeError:
                    continue
            else:
                raise ValueError("Could not decode CSV file")
        elif filename.endswith('.xlsx'):
            df = pd.read_excel(io.BytesIO(file_content))
        else:
            raise ValueError("Unsupported file format")
        
        return df
    except Exception as e:
        raise ValueError(f"Error reading file: {str(e)}")

def validate_field_value(field_name, value, field_config):
    """Validate a single field value"""
    if pd.isna(value) or value == '':
        if field_config['required']:
            return False, f"{field_name} is required"
        return True, None
    
    # Convert to string for processing
    str_value = str(value).strip()
    
    # Check max length
    if 'max_length' in field_config and len(str_value) > field_config['max_length']:
        return False, f"{field_name} exceeds maximum length of {field_config['max_length']}"
    
    # Type-specific validation
    if field_config['type'] == 'email' and str_value:
        if '@' not in str_value or '.' not in str_value.split('@')[-1]:
            return False, f"Invalid email format for {field_name}"
    
    elif field_config['type'] == 'choice' and str_value:
        if str_value not in field_config['choices']:
            return False, f"Invalid choice for {field_name}. Must be one of: {', '.join(field_config['choices'])}"
    
    return True, None

def clean_lead_data(row_data, column_mappings):
    """Clean and prepare lead data from a row"""
    lead_data = {}
    warnings = []
    
    # Map CSV columns to lead fields
    for mapping in column_mappings:
        csv_column = mapping['csvColumn']
        lead_field = mapping['leadField']
        
        if not lead_field or csv_column not in row_data:
            continue
            
        value = row_data[csv_column]
        
        # Skip empty values
        if pd.isna(value) or str(value).strip() == '':
            continue
            
        # Clean and process value
        cleaned_value = str(value).strip()
        
        # Special processing for specific fields
        if lead_field in ['phone', 'secondary_phone'] and cleaned_value:
            cleaned_value = clean_phone_number(cleaned_value)
            if not cleaned_value:
                warnings.append(f"Invalid phone number format: {value}")
                continue
        
        elif lead_field == 'email' and cleaned_value:
            cleaned_value = cleaned_value.lower()
        
        elif lead_field == 'type' and cleaned_value:
            # Try to match business type case-insensitively
            for valid_type in TYPE_OPTIONS:
                if cleaned_value.lower() == valid_type.lower():
                    cleaned_value = valid_type
                    break
            else:
                warnings.append(f"Unknown business type '{cleaned_value}', using 'None'")
                cleaned_value = "None"
        
        elif lead_field == 'lead_status' and cleaned_value:
            # Try to match lead status case-insensitively
            for valid_status in LEAD_STATUS_OPTIONS:
                if cleaned_value.lower() == valid_status.lower():
                    cleaned_value = valid_status
                    break
            else:
                warnings.append(f"Unknown lead status '{cleaned_value}', using 'open'")
                cleaned_value = "open"
        
        elif lead_field in ['phone_label', 'secondary_phone_label'] and cleaned_value:
            # Try to match phone label case-insensitively
            for valid_label in PHONE_LABELS:
                if cleaned_value.lower() == valid_label.lower():
                    cleaned_value = valid_label
                    break
            else:
                warnings.append(f"Unknown phone label '{cleaned_value}', using 'work'")
                cleaned_value = "work"
        
        lead_data[lead_field] = cleaned_value
    
    # Set defaults for required fields if missing
    if 'name' not in lead_data or not lead_data['name']:
        raise ValueError("Company name is required")
    
    # Set reasonable defaults
    if 'phone_label' not in lead_data and 'phone' in lead_data:
        lead_data['phone_label'] = 'work'
    
    if 'secondary_phone_label' not in lead_data and 'secondary_phone' in lead_data:
        lead_data['secondary_phone_label'] = 'mobile'
    
    if 'type' not in lead_data:
        lead_data['type'] = 'None'
    
    if 'lead_status' not in lead_data:
        lead_data['lead_status'] = 'open'
    
    return lead_data, warnings

@imports_bp.route("/leads/preview", methods=["POST"])
@requires_auth()
async def preview_lead_file():
    """Preview uploaded file and return headers and sample data"""
    try:
        files = await request.files
        if 'file' not in files:
            return jsonify({"error": "No file uploaded"}), 400
        
        file = files['file']
        if not file.filename:
            return jsonify({"error": "No file selected"}), 400
        
        # Read file content
        file_content = file.read()
        
        # Parse file
        df = read_file_to_dataframe(file_content, file.filename)
        
        if df.empty:
            return jsonify({"error": "File is empty"}), 400
        
        # Clean column names
        df.columns = df.columns.astype(str).str.strip()
        
        # Return preview data
        preview_data = {
            "headers": df.columns.tolist(),
            "rows": df.head(10).fillna('').values.tolist(),  # Show first 10 rows
            "totalRows": len(df)
        }
        
        return jsonify(preview_data)
        
    except Exception as e:
        return jsonify({"error": f"Error processing file: {str(e)}"}), 400

@imports_bp.route("/leads/generic", methods=["POST"])
@requires_auth()
async def import_leads_generic():
    """Import leads with custom field mapping"""
    user = request.user  # ✅ Production: using request.user
    session = SessionLocal()
    
    try:
        # Get form data
        form_data = await request.form
        files = await request.files
        
        if 'file' not in files:
            return jsonify({"error": "No file uploaded"}), 400
        
        file = files['file']
        assigned_user_email = form_data.get('assigned_user_email')
        column_mappings_str = form_data.get('column_mappings')
        
        if not assigned_user_email:
            return jsonify({"error": "No assigned user specified"}), 400
        
        if not column_mappings_str:
            return jsonify({"error": "No column mappings provided"}), 400
        
        # Parse column mappings
        try:
            column_mappings = json.loads(column_mappings_str)
        except json.JSONDecodeError:
            return jsonify({"error": "Invalid column mappings format"}), 400
        
        # Validate assigned user
        assigned_user = session.query(User).filter_by(
            email=assigned_user_email,
            tenant_id=user.tenant_id,
            is_active=True
        ).first()
        
        if not assigned_user:
            return jsonify({"error": f"User {assigned_user_email} not found or inactive"}), 400
        
        # Read and parse file
        file_content = file.read()
        df = read_file_to_dataframe(file_content, file.filename)
        
        if df.empty:
            return jsonify({"error": "File is empty"}), 400
        
        # Clean column names
        df.columns = df.columns.astype(str).str.strip()
        
        # Validate column mappings
        mapped_fields = [m['leadField'] for m in column_mappings if m['leadField']]
        invalid_fields = [f for f in mapped_fields if f not in VALID_LEAD_FIELDS]
        if invalid_fields:
            return jsonify({"error": f"Invalid field mappings: {', '.join(invalid_fields)}"}), 400
        
        # Check required fields
        required_fields = [f for f, config in VALID_LEAD_FIELDS.items() if config['required']]
        missing_required = [f for f in required_fields if f not in mapped_fields]
        if missing_required:
            return jsonify({"error": f"Missing required field mappings: {', '.join(missing_required)}"}), 400
        
        # Process each row
        successful_imports = 0
        failed_imports = 0
        failures = []
        all_warnings = []
        
        for index, row in df.iterrows():
            try:
                # Convert row to dict
                row_data = row.to_dict()
                
                # Clean and map data
                lead_data, warnings = clean_lead_data(row_data, column_mappings)
                all_warnings.extend(warnings)
                
                # Validate all fields
                validation_errors = []
                for field_name, value in lead_data.items():
                    if field_name in VALID_LEAD_FIELDS:
                        is_valid, error_msg = validate_field_value(
                            field_name, value, VALID_LEAD_FIELDS[field_name]
                        )
                        if not is_valid:
                            validation_errors.append(error_msg)
                
                if validation_errors:
                    raise ValueError("; ".join(validation_errors))
                
                # Create lead
                lead = Lead(
                    tenant_id=user.tenant_id,
                    created_by=user.id,
                    assigned_to=assigned_user.id,
                    created_at=datetime.utcnow(),
                    **lead_data
                )
                
                session.add(lead)
                session.flush()  # Get the ID without committing
                
                successful_imports += 1
                
            except Exception as e:
                failed_imports += 1
                failure_data = {
                    'row': index + 2,  # +2 because pandas is 0-indexed and we skip header
                    'data': {k: v for k, v in row_data.items() if not pd.isna(v)},
                    'error': str(e)
                }
                failures.append(failure_data)
                
                # Continue processing other rows
                session.rollback()
        
        # Commit successful imports
        if successful_imports > 0:
            session.commit()
        
        # Prepare response
        result = {
            "message": f"Import completed: {successful_imports} successful, {failed_imports} failed",
            "successful_imports": successful_imports,
            "failed_imports": failed_imports,
            "warnings": list(set(all_warnings)),  # Remove duplicates
            "failures": failures
        }
        
        return jsonify(result)
        
    except Exception as e:
        session.rollback()
        return jsonify({"error": f"Import failed: {str(e)}"}), 500
    finally:
        session.close()

@imports_bp.route("/leads/generic-template", methods=["GET"])
@requires_auth()
async def download_generic_template():
    """Download a generic CSV template with all possible lead fields"""
    try:
        # Create sample data with all possible fields
        template_data = {
            'company_name': ['Example Corp', 'Sample Industries'],
            'contact_person': ['John Smith', 'Jane Doe'],
            'contact_title': ['Manager', 'Director'],
            'email': ['john@example.com', 'jane@sample.com'],
            'phone': ['(555) 123-4567', '555.987.6543'],
            'phone_type': ['work', 'mobile'],
            'secondary_phone': ['(555) 234-5678', ''],
            'secondary_phone_type': ['mobile', ''],
            'street_address': ['123 Main St', '456 Oak Ave'],
            'city': ['Houston', 'Dallas'],
            'state': ['TX', 'TX'],
            'zip_code': ['77001', '75201'],
            'business_type': ['Oil & Gas', 'Secondary Containment'],
            'lead_status': ['open', 'qualified'],
            'notes': ['Contact from trade show', 'Referral from existing client']
        }
        
        df = pd.DataFrame(template_data)
        
        # Create CSV
        output = io.StringIO()
        df.to_csv(output, index=False)
        csv_content = output.getvalue()
        
        # Return as file download
        from quart import Response
        return Response(
            csv_content,
            mimetype='text/csv',
            headers={
                'Content-Disposition': 'attachment; filename=lead_import_template_generic.csv'
            }
        )
        
    except Exception as e:
        return jsonify({"error": f"Failed to generate template: {str(e)}"}), 500

# Helper endpoint to get field definitions for frontend
@imports_bp.route("/leads/field-definitions", methods=["GET"])
@requires_auth()
async def get_lead_field_definitions():
    """Get lead field definitions for the frontend"""
    field_definitions = []
    
    for field_name, config in VALID_LEAD_FIELDS.items():
        definition = {
            'field': field_name,
            'required': config['required'],
            'type': config['type'],
            'description': get_field_description(field_name)
        }
        
        if 'max_length' in config:
            definition['max_length'] = config['max_length']
        
        if 'choices' in config:
            definition['choices'] = config['choices']
        
        field_definitions.append(definition)
    
    return jsonify(field_definitions)

def get_field_description(field_name):
    """Get human-readable description for field"""
    descriptions = {
        'name': 'Company or organization name',
        'contact_person': 'Primary contact person name',
        'contact_title': 'Contact person job title',
        'email': 'Primary email address',
        'phone': 'Primary phone number',
        'phone_label': 'Primary phone type (work, mobile, home, fax, other)',
        'secondary_phone': 'Secondary phone number',
        'secondary_phone_label': 'Secondary phone type',
        'address': 'Street address',
        'city': 'City name',
        'state': 'State or province',
        'zip': 'ZIP or postal code',
        'notes': 'Additional notes or comments',
        'type': 'Business or industry type',
        'lead_status': 'Current lead status (open, qualified, proposal, closed)'
    }
    
    return descriptions.get(field_name, field_name.replace('_', ' ').title())