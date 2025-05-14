# ✅ Future Upgrades for PathSix CRM (Updated)

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