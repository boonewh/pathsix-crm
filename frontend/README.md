# PathSix CRM - Feature Documentation

## User Instructions

## 📅 Adding Follow-Ups to Google Calendar

After creating an interaction with a follow-up date, users have the option to add it directly to their personal Google Calendar.

### Where it appears

- Once an interaction is saved, the follow-up appears in the interaction list.
- If the interaction includes a `follow_up` date, an **"Add to Google Calendar"** link will appear beneath the follow-up timestamp.

### How it works

- Clicking the link opens a pre-filled Google Calendar event in a new tab.
- The event includes:
  - Title: `Follow-up: {Company Name}`
  - Date and time: from the `follow_up` field
  - Notes and outcome pulled from the interaction

### Technical Notes

- The link uses Google Calendar’s URL API:  
  `https://calendar.google.com/calendar/render?action=TEMPLATE...`
- It only appears after the interaction has been saved to avoid mismatched or premature events.


## 🔐 Authentication for now. Upgrades will be worked on later.

JWT-based authentication protects all API routes. Users log in using email and password. The token is stored and passed in headers via the React auth context.

* JWT is verified on the backend using a shared secret
* `useAuth()` React hook provides access to token and login/logout state
* All protected routes use a `ProtectedLayout` wrapper

---
---

## 📇 Clients & Leads

Clients and leads are the core CRM entities. Leads may later become clients. Both are associated with addresses, contacts, and interactions.

### Client & Lead Detail Pages

* Shared layout and logic for viewing details
* Show:

  * Company name
  * Contact person
  * Email
  * Phone
  * Address
  * Notes
* Display all past interactions
* Provide collapsible form to log new interactions

### Components

* `InteractionForm`: shared form for adding and editing interactions
* `InteractionCard`: renders a single interaction summary

---

## 💬 Interactions

Interactions represent logged communication with a client or lead.

### Features

* **Create Interactions**

  * Includes: contact date, outcome, notes, optional follow-up
  * Entered via a shared `InteractionForm` component
  * Appear immediately in the interaction list

* **Edit & Delete**

  * Edit uses the same form, pre-filled with existing data
  * Delete includes a confirmation prompt
  * Updates sync with the backend in real time

* **Display**

  * Interactions listed in reverse-chronological order
  * Show contact date, outcome, notes, follow-up date (if any)

### Technical Notes

* Stored in the `interactions` table
* Foreign key references to `client_id` or `lead_id`
* Endpoints:

  * `GET /api/interactions/`
  * `POST /api/interactions/`
  * `PUT /api/interactions/:id`
  * `DELETE /api/interactions/:id`
* Interactions with a follow-up date appear in the calendar

---

## 🗓 Follow-Up Calendar

The calendar provides a visual interface for managing interaction follow-ups.

### Features

* **Event Rendering**

  * Events sourced from interactions with a `follow_up` date
  * Rendered using `@fullcalendar/react`
  * Format: `Follow-up: {Company Name}`
  * Overdue follow-ups are styled in red

* **Modals**

  * Click any event to open a detailed modal
  * Modal includes: outcome, notes, contact info, profile link

* **Google Calendar Integration**

  * Each modal includes an "Add to Google Calendar" button
  * Uses Google Calendar's URL API (`render?action=TEMPLATE`)

* **Drag-and-Drop Rescheduling**

  * Events are draggable
  * Dragging triggers a `PUT /api/interactions/:id` update
  * On error, event is reverted and alert is shown

* **Views & Navigation**

  * Supports month, week, and day views
  * Toolbar includes Today, Previous, and Next controls

### Technical Notes

* `eventContent` hook handles dynamic styling for overdue
* `eventDrop` handles rescheduling and backend sync
* `eventClick` opens modals with contact and interaction data
* Events are passed as `extendedProps` to the calendar instance

---

## 🔍 Filtering Follow-Ups by Lead or Client

To help focus on specific accounts, the calendar includes filter functionality that lets users view only the follow-ups for a selected client or lead.

### Features

* **Dropdown Filter**

  * A select menu allows switching between "All", "Clients only", or "Leads only"
  * Optionally, users can filter by specific company name

* **Filtered View**

  * Once selected, only follow-up events tied to that type (or company) are shown
  * Events are still fully functional: can be clicked, rescheduled, etc.

### Technical Notes

* Filtering is done client-side after loading all interactions
* Dropdown input is tracked in state (`filterType` or `selectedCompany`)
* `setEvents()` is called with a filtered subset of the original interaction data
* No additional API calls are required unless server-side filtering is added later

---

## 🧱 Stack Summary

* **Frontend**: React + Vite + Tailwind CSS
* **Backend**: Quart (async Flask-style)
* **Database**: SQLite via SQLAlchemy
* **Auth**: JWT
* **Calendar**: `@fullcalendar/react`
* **Styling**: Tailwind CSS, Catalyst UI, Radix UI
* **Modular routing**: `/clients`, `/interactions`, `/calendar`, etc.

---
