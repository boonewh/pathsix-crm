# 🧭 PathSix CRM Roadmap (Updated)

_A professional development roadmap for building a scalable, multi-tenant CRM using Quart (backend) and Vite + React (frontend) with Tailwind + Catalyst UI._

---

## ✅ PHASE 1: Foundation (Core Auth & Structure)

> Goal: Establish secure, scalable architecture.

- [x] Project layout & blueprints  
- [x] JWT-based auth with protected routes  
- [x] Frontend login form using token  
- [x] Redirect to `/login` if not authenticated  
- [x] Auth context (frontend)  
- [x] `ProtectedLayout` component  

🔜 **Next:**  
- [ ] Token expiration & auto-logout  
- [ ] User model & hashed passwords  
- [ ] Optional registration  

---

## ✅ PHASE 2: CRUD & Core Entities

> Goal: Build actual CRM functionality.

- [x] `Client` SQLAlchemy model  
- [x] Backend `/api/clients` CRUD  
- [x] React `Customers` page: fetch, list, edit, delete  
- [x] Mobile-first Headless UI menu for actions  
- [x] Confirm dialog for deletes  

🔜 **Next:**  
- [ ] Add `Lead`, `Project`, and `Account` models  
- [ ] CRUD endpoints + UI for those entities  
- [ ] Form validation (backend + frontend)  
- [ ] Error handling for API failures  

---

## ✅ PHASE 3: Usability & UX Polish

> Goal: Make it feel professional.

- [x] Beautiful sidebar layout  
- [x] Collapsible sidebar w/ icon/logo swap  
- [x] Grouped nav sections: Main, Reports, Settings  
- [x] Mobile drawer navigation (responsive)  
- [x] Clean spacing & hover effects  
- [x] Transition animations  
- [x] Button polish & UI feedback  
- [x] Headless UI menu buttons (mobile safe)

🔜 **Next:**  
- [ ] Global user context from JWT  
- [ ] Toast notifications for actions  
- [ ] Dark mode toggle  

---

## PHASE 4: Advanced Features

> Goal: Power-user tools & flexibility.

- [ ] Search + filters on client/lead list  
- [ ] Report page with charts  
- [ ] Export (CSV, PDF)  
- [ ] Roles & permissions  
- [ ] Offline sync (optional)

---

## PHASE 5: Deployment & Scalability

> Goal: Launch-ready SaaS infrastructure.

- [ ] Backend ready for Hypercorn/Gunicorn  
- [ ] `.env` configuration separation  
- [ ] Vite build pipeline  
- [ ] Vercel/Netlify for frontend  
- [ ] Quart backend to Kamatera or Fly.io  
- [ ] Redis integration (queue, cache, or rate-limit)

---

### 🛠️ Notes

- Using Tailwind CSS with Catalyst UI as primary styling  
- Sidebar is extracted into a responsive, animated `SidebarNav` component  
- Architecture is multi-tenant and scalable  
- Redis, background jobs, permissions, and analytics are on the roadmap

---

_Last updated: **2025-05-04**_

_________________________________________________________________________________________________________________
# Old (Keeping for some details)


# 🧭 PathSix CRM Roadmap

A professional development roadmap for building a scalable, multi-tenant CRM using Quart (backend) and Vite + React (frontend) with Tailwind + Catalyst UI.

---

## ✅ PHASE 1: Foundation (Core Auth & Structure)

> Goal: Establish secure, scalable architecture.

- [x] Project layout & blueprints  
  - `backend/routes/auth.py`, `users.py`, `crm.py`, etc.

- [x] JWT-based auth  
  - Login form  
  - JWT issue/verify  
  - Protected routes (backend + frontend)

- [ ] Logout + token expiration handling  
  - Manual logout: remove token + redirect  
  - Optional: check JWT expiry on each route

- [ ] Create User & Auth models  
  - SQLAlchemy User model  
  - Password hashing with `passlib[bcrypt]`

- [ ] Registration  
  - Optional now; useful for multi-tenant support

---

## ✅ PHASE 2: CRUD & Core Entities

> Goal: Build actual CRM functionality.

- [ ] Client model + frontend management page  
  - Add `Client` model  
  - `/api/clients` CRUD endpoints  
  - React form & list page

- [ ] Lead, Project & Account models  
  - Tie to Client via foreign keys  
  - Relationships with SQLAlchemy

- [ ] Frontend UI for Clients / Leads / Accounts  
  - Use `ProtectedLayout`  
  - Display data and allow edits

- [ ] Form validation  
  - Backend: Pydantic or Marshmallow  
  - Frontend: form error handling

---

## ✅ PHASE 3: Usability & UX Polish

> Goal: Make it feel professional.

- [ ] Global user context  
  - Store user email / role from JWT  
  - Make accessible via context API

- [ ] Sidebar nav + route structure  
  - Dashboard, Customers, Reports, Settings  
  - Show/hide based on login

- [ ] Feedback & errors  
  - Toasts, inline alerts, loading states

- [ ] Dark mode toggle  
  - Tailwind + `:root` tokens already in place

---

## ✅ PHASE 4: Advanced Features

> Goal: Power-user tools & flexibility.

- [ ] Search & filters  
  - On Clients, Leads, etc.

- [ ] Reports  
  - Exportable CSV or PDF  
  - Basic analytics / charts

- [ ] Offline write support  
  - LocalStorage/IndexedDB cache  
  - Auto-sync to backend

- [ ] Roles & permissions  
  - Admin vs User  
  - Route and UI-level gating

---

## ✅ PHASE 5: Deployment & Scalability

> Goal: Launch-ready SaaS infrastructure.

- [ ] Production-ready backend  
  - Quart behind Hypercorn  
  - `.env` config and secrets

- [ ] Frontend build & deployment  
  - `vite build` → deploy via Vercel or Netlify

- [ ] Backend hosting  
  - Kamatera or move to Fly.io / Render

- [ ] Redis integration  
  - Caching, rate limiting, or task queues

---

### 🛠️ Notes

- Tailwind + Catalyst UI are primary for styling  
- Blueprint-based architecture is maintained  
- Backend is shared for multi-tenant support  
- Redis, roles, and offline support are future-facing but planned

---

_Last updated: 2025-05-02_
