# ✅ Future Upgrades for PathSix CRM (Updated)

The ability for admins to assign a lead and then assign a follow up and see the results of that followup OR if it goes past due. 

⚠️ Optional: Hook up token from useAuth() in Projects.tsx like the other pages, so you can stop hardcoding the token string.

Update how projects show on the client/lead detail pages

Refactor projects to use status: "pending" | "won" | "lost" dropdown logic

Add project filtering per lead or client in the /api/projects/ route

🧩 Core Features
Add Projects with status (Won/Lost/Pending)

Add Accounts tied to clients

📊 Reporting & Analytics
Overdue follow-up summary

Activity history by rep or lead

Monthly or weekly stats

🔔 Productivity
Daily/weekly email reminder system

Tasks or to-dos tied to clients/leads

Note pinning or tagging

🧭 UI Improvements
Search or filtering in client/lead lists

Sortable tables (e.g., most recent first)

Dashboard with quick stats


Role-based access controls (your backend supports roles but they aren’t enforced or editable via UI yet).

Account management (like the Project section but for Account records per client).

Recurring follow-ups or reminders with notifications.

Activity log or audit trail of who did what and when.

Email or SMS integration for follow-up reminders or outreach.

Export to CSV/PDF for clients, leads, or interactions.

Advanced filtering/search/sorting on the frontend lists.

Multi-tenant user/role management from the frontend (admin panels).

Dashboard metrics (conversion rate, total deals won/lost, average deal size, etc.).



- [ ] Hook into 404 page and log unknown routes to database once backend is ready  
        // Example future code to log 404s:
        // fetch("/api/log-404", { method: "POST", body: JSON.stringify({ path: window.location.pathname }), headers: { "Content-Type": "application/json" } }).catch((error) => { console.error("Failed to log 404:", error); });
        // for Quart:
        //@app.route("/api/log-404", methods=["POST"])
        //    async def log_404():
        //        data = await request.get_json()
        //        path = data.get("path")
        //        # Save `path` to your database
        //        return jsonify({"message": "Logged"}), 200  
- [x] Replace fake isLoggedIn check with real login/auth flow  
- [x] Protect API calls with token authentication (after login)  
- [ ] Add basic error boundaries for React app  
- [ ] Set logic to prevent duplicate entries into DB by multiple users  
    - Tip: Add database UNIQUE constraints (e.g., company name or email)  
    - Tip: Check for existence before inserting  
    - Tip: Disable submit button during API call  
    - Tip: Use toast to inform user  
- [ ] Confirm auto-increment IDs are properly handled by the database  
- [ ] Store 404s with extra info like timestamp, IP, or user agent  
- [x] Do NOT show IDs externally — use company names, not numeric ranking  
- [ ] Add `client_id` (tenant ID) to all main database tables (customers, projects, invoices, etc.)  
- [ ] Add `client_id` to all users (each user belongs to one company/client)  
- [ ] On all API queries, always filter by `client_id` to prevent cross-tenant data access  
- [ ] Prevent exposing raw internal IDs — use public UUIDs or safe keys  
- [ ] Verify on every create/update/delete API call that the user’s `client_id` matches the record’s  
- [ ] Ensure frontend navigation does not allow switching between clients  
- [ ] Future: Add admin/superadmin roles that can cross client boundaries  
- [ ] Future: Log all unauthorized access attempts for security audits  
- [ ] Future: Add cleanup routines for deleting all data tied to a `client_id` (or soft delete)

 Option B — Multiple Notes (Recommended for a CRM)
Each note is its own object:

ts
Copy
Edit
{
  id,
  client_id,
  content,
  created_at,
  created_by
}
Pros:

Looks and feels like Interactions: multiple cards

Allows timestamps, authorship, sorting

Supports future features (pin note, search notes, filter notes)

Cons:

Requires a new ClientNote model in the backend

Adds complexity to both DB and API

Great question — the dashboard is your mission control. It should surface the most important insights at a glance. For a CRM like yours, here’s what a clean, useful dashboard might include:

🔁 Follow-Up Summary (Top Row)
Overdue Follow-Ups (e.g., red count badge — click to view list)

Today's Follow-Ups

Upcoming (Next 7 Days)

📈 Lead & Client Metrics
New Leads This Month

New Clients This Month

Lead → Client Conversion Rate

Deals Won / Lost (Projects by status, e.g. won/lost/pending)

💰 Revenue Metrics (if you're tracking project worth)
Total Project Value (This Quarter)

Average Project Value

Top 3 Clients by Value

📋 Recent Activity Feed
"You added an interaction with John Smith (Client)"

"Converted lead Sarah W. to client"

"Created new project: Website Redesign"

📅 Mini Calendar / Upcoming Interactions
Next 3 follow-ups or appointments with names, times, and a CTA to view

🧭 Optional Widgets
Quick Add Buttons for Lead, Client, Interaction

Team Summary (if you scale to multiple users/roles)

System Messages / Alerts

The key is to show just enough to orient the user and prompt useful actions.

Would you like to start implementing this piece-by-piece, maybe with the follow-up summary cards and a recent activity list first?


 Good Default Uses for Settings.tsx
🔐 Account Security
 Change Password (already implemented)

 Enable 2FA (later)

👤 User Profile
 Change display name

 Update email (with re-verification)

 Upload/change profile picture (if applicable)

🔔 Notifications
 Toggle notification emails (e.g., reminders, assignments)

 Set preferred notification channels (email/SMS)

🏷️ Preferences
 Set default dashboard view (e.g. clients vs leads)

 Theme switcher (light/dark mode toggle)

 Language or timezone preferences

🧑‍💼 Admin-Specific (only shown for admins)
 Manage system-wide settings (like roles or API tokens)

 Manage billing and subscriptions (if you ever make it paid)
 

✨ Optional Improvements for ForgotPasswordPage.tsx
  If you want to polish a bit:

  Add a loading state to disable the button while submitting (prevents double clicks).

  Normalize error messages in case the backend returns HTML or unexpected formats.

  Replace <a href="/login"> with <Link to="/login"> from react-router-dom for SPA routing.


Reports page to-dos: 
If/when you're ready to:

Add user-based breakdowns

Compare periods (e.g. this month vs last)

Export as CSV or PDF

We can build that straight onto this solid foundation.

Let me know what’s next!