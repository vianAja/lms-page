# LMS Platform — OpenAI Codex Prompt Playbook
## Structured Prompts: Per Micro-App + Sub-Prompts

> **How to use this playbook:**
> - Run prompts **in order** within each micro-app section.
> - Complete all sub-prompts of one section before moving to the next.
> - Each prompt assumes Codex has full read access to the codebase.
> - Prompts marked 🔒 touch security-critical code — review output manually before committing.

---

## 🛠️ PRE-WORK: Foundation (Run This First, Before Any Micro-App)

> These are infrastructure-level changes that all three micro-apps depend on.
> Run these prompts sequentially before starting Micro-App 1.

---

### FOUNDATION-1 — Database Migration 🔒

```
You are working on a Next.js 16 + PostgreSQL project. The database connection pool is in `src/lib/db.js` using the `pg` library.

Create a new file `src/lib/migrate.js` that runs the following migration when executed directly with `node src/lib/migrate.js`. It must be idempotent (safe to run multiple times).

Add these changes to the database:

1. Add column `is_active BOOLEAN DEFAULT true` to the `users` table (if not exists).

2. Create table `classes`:
   - id SERIAL PRIMARY KEY
   - name VARCHAR(255) NOT NULL
   - description TEXT
   - created_at TIMESTAMP DEFAULT NOW()
   - updated_at TIMESTAMP DEFAULT NOW()

3. Create table `labs`:
   - id SERIAL PRIMARY KEY
   - class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE
   - lab_key VARCHAR(255) UNIQUE NOT NULL  -- e.g. '1-1', '1-2'
   - title VARCHAR(255) NOT NULL
   - content TEXT NOT NULL  -- Markdown content
   - order_num INTEGER DEFAULT 0
   - created_at TIMESTAMP DEFAULT NOW()
   - updated_at TIMESTAMP DEFAULT NOW()

4. Create table `class_enrollments`:
   - id SERIAL PRIMARY KEY
   - username VARCHAR(255) NOT NULL REFERENCES users(username)
   - class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE
   - enrolled_at TIMESTAMP DEFAULT NOW()
   - UNIQUE(username, class_id)

5. Create table `csrf_tokens`:
   - id SERIAL PRIMARY KEY
   - username VARCHAR(255) NOT NULL
   - token VARCHAR(64) NOT NULL
   - expires_at TIMESTAMP NOT NULL
   - UNIQUE(username)

Use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` for column additions and `CREATE TABLE IF NOT EXISTS` for all new tables.

Log each step with console.log. At the end, close the pool and exit.
```

---

### FOUNDATION-2 — CSRF Utility & API Endpoint 🔒

```
You are working on a Next.js 16 TypeScript project. The database pool is available via `import { db } from '@/lib/db'`.

Task 1 — Create `src/lib/csrf.ts`:
- Export function `generateCsrfToken(): string` that returns a 64-character random hex string using Node.js `crypto.randomBytes(32)`.
- Export async function `storeCsrfToken(username: string, token: string): Promise<void>` that upserts into the `csrf_tokens` table with `expires_at = NOW() + INTERVAL '8 hours'`.
- Export async function `validateCsrfToken(username: string, token: string): Promise<boolean>` that queries `csrf_tokens` where `username = $1 AND token = $2 AND expires_at > NOW()` and returns true if a row is found.
- Export function `getCsrfFromRequest(request: Request): string | null` that reads the `X-CSRF-Token` header.

Task 2 — Create `src/app/api/csrf/route.ts`:
- GET handler only.
- Read the `user_session` cookie from `cookies()`.
- If no session cookie exists, generate a temporary token (for unauthenticated use like the login form), store it with username `'__guest__'`, and return `{ csrf_token: token }`.
- If session exists, parse the session JSON, generate a new token, store it for that username, and return `{ csrf_token: token }`.
- Always return status 200.

Do not import or use any third-party CSRF libraries. Use only the utilities created in Task 1.
```

---

### FOUNDATION-3 — Update Login API to Issue CSRF Token 🔒

```
You are working on a Next.js 16 TypeScript project. The file to modify is `src/app/api/auth/login/route.ts`.

The current login route reads username/password, verifies with bcrypt, and sets a `user_session` cookie. 

Make these modifications:

1. Import `generateCsrfToken` and `storeCsrfToken` from `@/lib/csrf`.

2. After successful password verification, generate a CSRF token.

3. Call `storeCsrfToken(user.username, csrfToken)` to persist it.

4. Update the `user_session` cookie value to include `csrf_token` in the JSON object:
   `{ id, username, fullname, role, csrf_token }`

5. Cookie must have these attributes:
   - httpOnly: true
   - secure: process.env.NODE_ENV === 'production'
   - sameSite: 'strict'
   - path: '/'
   - maxAge: 60 * 60 * 8  (8 hours)

6. Return the CSRF token in the response body alongside the role:
   `{ ok: true, csrf_token: csrfToken, role: user.role }`

7. On login failure (wrong password or user not found), always return status 401 with body `{ message: 'Invalid username or password' }`. Do not distinguish between the two failure cases.

Do not change any other behavior of the existing route.
```

---

### FOUNDATION-4 — CSRF Validation Middleware Helper 🔒

```
You are working on a Next.js 16 TypeScript project.

Create `src/lib/withCsrf.ts` that exports a higher-order function `withCsrf` to wrap Next.js Route Handlers.

The wrapper must:
1. Only run CSRF validation on methods: POST, PUT, PATCH, DELETE.
2. Read the `user_session` cookie to get the current username.
3. Call `validateCsrfToken(username, headerToken)` from `@/lib/csrf`.
4. If validation fails (missing token, invalid token, expired), return a NextResponse with status 403 and body `{ message: 'Invalid CSRF token' }`.
5. If validation passes, call and return the original handler.

Usage pattern it should support:
  export const POST = withCsrf(async (request: Request) => { ... })

Also update `src/middleware.ts` to add a comment block at the top clearly explaining that route-level CSRF validation is handled per-route via `withCsrf`, not in this middleware. Do not add CSRF logic to the middleware itself — keep auth/role checks only.
```

---
---

## 📦 MICRO-APP 1 — Login & Student Portal

> **Goal:** Transform the existing login-only flow into a full student entry point with profile and class material listing.
> **Affected files:** `src/app/login/page.tsx`, `src/app/page.tsx`, `src/app/api/auth/login/route.ts`, `src/app/api/classes/route.ts` (new)

---

### M1-1 — Update Login Page with CSRF Prefetch

```
You are working on a Next.js 16 React 19 TypeScript project. The file to modify is `src/app/login/page.tsx`.

This is currently a client component (`'use client'`) with a basic login form using `useState` and `fetch`.

Make these changes:

1. On component mount (`useEffect`), fetch `GET /api/csrf` and store the returned `csrf_token` in a state variable.

2. Update the `handleLogin` function to include the CSRF token in the request headers:
   ```
   headers: {
     'Content-Type': 'application/json',
     'X-CSRF-Token': csrfToken
   }
   ```

3. After a successful login response, read `role` from the response JSON:
   - If `role === 'admin'` → `router.push('/dashboard')`
   - If `role === 'student'` → `router.push('/')`

4. Show a loading state on the submit button while the login request is in flight (disable the button and change text to "Signing in...").

5. Error message must be displayed inside an element with `role="alert"` and `aria-live="assertive"` for accessibility.

6. Do not change the visual design or Tailwind classes — only add behavior.
```

---

### M1-2 — Student Portal API (`/api/classes`) 🔒

```
You are working on a Next.js 16 TypeScript project. The database pool is at `src/lib/db.js`.

Create a new API route file: `src/app/api/classes/route.ts`

GET handler requirements:
1. Read and parse the `user_session` cookie. If missing, return 401.
2. If role is `student`:
   - Query all classes the student is enrolled in via the `class_enrollments` table.
   - For each class, return its labs (from the `labs` table, ordered by `order_num ASC`).
   - For each lab, also return whether the student has access (join with `lab_access` table on `username = session.username AND lab_id = labs.lab_key`).
   - Response shape:
     ```json
     [
       {
         "id": 1,
         "name": "Intro to Linux",
         "description": "...",
         "labs": [
           { "id": 1, "lab_key": "1-1", "title": "Getting Started", "order_num": 1, "has_access": true },
           { "id": 2, "lab_key": "1-2", "title": "File System", "order_num": 2, "has_access": false }
         ]
       }
     ]
     ```
3. If role is `admin`: return all classes and all labs (no enrollment filter), with `has_access: true` for all labs.
4. On any DB error, return 500 with `{ message: 'Internal server error' }`.

No CSRF validation needed on GET routes.
```

---

### M1-3 — Build Student Portal Page (`/`)

```
You are working on a Next.js 16 React 19 TypeScript project using Tailwind CSS v4. The file to replace is `src/app/page.tsx`.

Currently `src/app/page.tsx` only does a redirect to `/lab/1-1`. Replace it entirely with a full Student Portal page.

This is a SERVER COMPONENT. Read the session from `cookies()` server-side.

Requirements:

1. If no `user_session` cookie exists, call `redirect('/login')`.
2. Parse the session. If role is `admin`, call `redirect('/dashboard')`.
3. Fetch class data from the database directly (do not call the API route from server component — query the db directly using `import { db } from '@/lib/db'`).
   - Use the same query logic as described in M1-2 for students.
4. Render the following layout:

   TOP: The existing `<Header>` component (from `src/components/Header.tsx`) passing `title="My Learning Portal"`.

   BODY (two-column layout on desktop, single column on mobile):
   
   LEFT COLUMN (1/4 width): Profile Card
   - Large avatar circle showing the first letter of `fullname`, uppercase, in bg-blue-500 text-white.
   - Full name in bold.
   - `@username` in muted text.
   - Role badge: rounded pill, blue for 'student', purple for 'admin'.
   
   RIGHT COLUMN (3/4 width): Class Materials
   - Section heading "My Classes".
   - For each class, render a card with:
     - Folder icon + class name as card header.
     - Class description in muted text (if present).
     - A list of labs inside the card. For each lab:
       - Lab title text.
       - If `has_access === true`: a blue "Start Lab →" link/button that navigates to `/lab/[lab_key]`.
       - If `has_access === false`: a grey locked state with a lock icon and text "Access Restricted". No button.
   - If no classes are found: show an empty state message "No classes assigned yet."

5. Use the same color palette as the existing dashboard layout:
   - Background: `bg-[#F2F5F8]`
   - Cards: `bg-white border border-[#E0E6ED] rounded-xl shadow-sm`
   - Primary blue: `#2D9CDB`
   - Muted text: `text-[#828282]`
```

---

### M1-4 — Logout Hardening 🔒

```
You are working on a Next.js 16 TypeScript project.

Modify `src/app/api/auth/logout/route.ts`:

1. Change to only accept POST method. If GET is used, return 405.
2. Validate the CSRF token using `withCsrf` from `@/lib/withCsrf`.
3. When clearing the `user_session` cookie, also clear any `csrf_token` cookie if it exists.
4. Delete the CSRF token from the `csrf_tokens` table for the current user (get username from the session cookie before clearing it).
5. Return `{ ok: true }` with status 200.

Also update the `<Header>` component in `src/components/Header.tsx`:
- The logout button must call `POST /api/auth/logout` (not GET).
- Include the CSRF token in the request header. Read the token from the `user_session` cookie value if available (parse from the cookie), or from a `<meta name="csrf-token">` tag.
- After success, `window.location.href = '/login'`.
```

---
---

## 📦 MICRO-APP 2 — Interactive Lab Page

> **Goal:** Harden the existing lab page with access control, auto-reconnect, and improved navigation.
> **Affected files:** `src/app/lab/[id]/page.tsx`, `src/components/WebTerminal.tsx`, `src/components/ResizableSplit.tsx`

---

### M2-1 — Lab Page Access Guard

```
You are working on a Next.js 16 React 19 TypeScript project. The file to modify is `src/app/lab/[id]/page.tsx`.

The current page renders the lab layout without checking if the student has access to that specific lab.

Make these changes:

1. This is a SERVER COMPONENT. Keep it as a server component.

2. After reading the session cookie, before rendering anything, query the database:
   ```sql
   SELECT has_access FROM lab_access 
   WHERE username = $1 AND lab_id = $2
   ```
   Where `$1` is `session.username` and `$2` is the `id` param from the URL.

3. If no row is found OR `has_access === false`, render an "Access Denied" screen:
   - Dark background matching the existing lab page style.
   - Centered card with:
     - A red lock icon (use an SVG or lucide-react `LockIcon`).
     - Heading: "Access Restricted"
     - Body: "You do not have permission to access this lab. Please contact your instructor."
     - A button "← Back to Portal" that navigates to `/`.
   - Do NOT redirect — render the denial UI inline on the same route.

4. If access is granted, render the existing lab layout unchanged.

5. Also fetch the lab content from the `labs` table using `lab_key = id` param, falling back to reading from the filesystem at `/page/lab[id].md` if no database record exists. This ensures backward compatibility with existing markdown files.
```

---

### M2-2 — Terminal Auto-Reconnect & Status Banner

```
You are working on a Next.js 16 React 19 TypeScript project. The file to modify is `src/components/WebTerminal.tsx`.

This component uses socket.io-client and xterm.js to create an SSH-connected terminal.

Add the following improvements:

1. Auto-reconnect with exponential backoff:
   - On socket `disconnect` event, attempt to reconnect.
   - Attempt 1: wait 1 second, Attempt 2: wait 2 seconds, Attempt 3: wait 4 seconds.
   - After 3 failed attempts, stop retrying and show a permanent error state.
   - Track reconnect attempt count in a `useRef`.

2. Connection status banner:
   - Add a small status bar above the terminal (inside the component's container div).
   - States:
     - Connecting: grey dot + "Connecting to lab environment..."
     - Connected: green dot + "Connected"
     - Reconnecting: yellow dot + "Reconnecting... (attempt X of 3)"
     - Failed: red dot + "Connection failed. " + a "Retry" button that resets the backoff and tries again.
   - Use `useState` to manage status: `'connecting' | 'connected' | 'reconnecting' | 'failed'`

3. On `ssh-ready` event: set status to `'connected'`.
4. On `ssh-error` event: set status to `'failed'`, write the error message to the xterm terminal in red.
5. On socket `disconnect` event: begin the backoff sequence.

Do not change the SSH input/output pipe logic. Only add status tracking and reconnect behavior.
```

---

### M2-3 — Lab Page Navigation & Mobile Layout

```
You are working on a Next.js 16 React 19 TypeScript project using Tailwind CSS v4.

The file to modify is `src/app/lab/[id]/page.tsx` and `src/components/ResizableSplit.tsx`.

Task 1 — Add navigation to lab page:
- Below the `<Header>` and above the split pane, add a thin breadcrumb/navigation bar:
  `← Back to Portal   |   Lab: [lab title]`
- "Back to Portal" is a Next.js `<Link href="/">` styled as a subtle text link (no button styling).
- Lab title is read from the lab data fetched in M2-1.
- This bar should be full-width, white background, small text, padding `py-2 px-6`.

Task 2 — Mobile responsive layout in `ResizableSplit.tsx`:
- The current component renders two panels side-by-side with a draggable divider.
- Add a responsive behavior:
  - On screens `lg` and above (≥1024px): keep the existing side-by-side resizable layout.
  - On screens below `lg`: stack the panels vertically. Markdown panel on top (fixed height 45vh), terminal panel below (fixed height 45vh). Hide the drag divider on mobile.
- Use a `useMediaQuery` hook or listen to `window.innerWidth` with a resize event listener to detect the breakpoint. Do not use CSS-only approach since the split logic is JavaScript-driven.
- Do not break the existing desktop resizing behavior.
```

---
---

## 📦 MICRO-APP 3 — Admin Dashboard

> **Goal:** Extend the existing dashboard with stat overview, dynamic student management, full Class/Lab CRUD, and User management.
> **Affected files:** `src/app/dashboard/**`, new API routes under `src/app/api/**`

---

### M3-1 — Dashboard Overview Page (Stat Cards + Activity)

```
You are working on a Next.js 16 React 19 TypeScript project using Tailwind CSS v4. 

The file to modify is `src/app/dashboard/page.tsx`. Currently it renders minimal content.

Replace it with a full overview page. This is a SERVER COMPONENT.

Requirements:

1. Run these 4 queries in parallel using `Promise.all`:
   - Total students: `SELECT COUNT(*) FROM users WHERE role='student' AND is_active=true`
   - Total classes: `SELECT COUNT(*) FROM classes`
   - Total labs: `SELECT COUNT(*) FROM labs`
   - Active lab sessions: `SELECT COUNT(*) FROM lab_sessions`

2. Also query the last 10 lab access changes (you'll need an `updated_at` column on `lab_access` — add it to the query with `COALESCE(updated_at, NOW())`):
   ```sql
   SELECT la.username, la.lab_id, la.has_access, u.fullname
   FROM lab_access la
   JOIN users u ON u.username = la.username
   ORDER BY la.id DESC
   LIMIT 10
   ```

3. Render a 4-column stat card grid (2 columns on mobile):
   Each card: white background, rounded-xl, shadow-sm, border border-[#E0E6ED].
   Inside: large number in bold (#333), label in muted text (#828282), a colored icon.
   - Students card: blue icon (Users SVG)
   - Classes card: purple icon (BookOpen SVG)
   - Labs card: green icon (FlaskConical SVG)
   - Active Sessions card: orange icon (Terminal SVG)
   Use inline SVGs or lucide-react icons.

4. Below the cards: a "Recent Access Activity" section.
   - Table with columns: Student, Lab ID, Status (Authorized/Restricted), 
   - Status uses a colored badge: green for authorized, red for restricted.
   - If no activity, show empty state text.

Color palette must match existing dashboard: bg-[#F2F5F8], cards bg-white, primary #2D9CDB, green #27AE60.
```

---

### M3-2 — Dynamic Student Access Management 🔒

```
You are working on a Next.js 16 TypeScript project.

Task 1 — Update `src/app/dashboard/manage-student/page.tsx`:

The current page only shows access for `lab_id = '1-1'` hardcoded. Replace this with dynamic multi-lab support.

New query (replace the existing query):
```sql
SELECT 
  u.username, 
  u.fullname,
  l.lab_key,
  l.title as lab_title,
  l.id as lab_id,
  COALESCE(la.has_access, false) as has_access
FROM users u
CROSS JOIN labs l
LEFT JOIN lab_access la ON la.username = u.username AND la.lab_id = l.lab_key
WHERE u.role = 'student' AND u.is_active = true
ORDER BY u.username ASC, l.order_num ASC
```

Group the results by student in JavaScript before rendering.

UI Changes:
- Each student card now shows ALL labs (not just lab 1-1), each with its own toggle.
- Add a search input at the top of the page (client-side filter) that filters student cards by name or username. Make this a `'use client'` wrapper component — keep the data fetching in the parent server component and pass data down as props.

Task 2 — Update the `toggleAccess` server action in the same file:
- After the existing DB upsert, also call `validateCsrfToken` — but since this is a Next.js Server Action (not an API route), read the CSRF token from the `user_session` cookie's parsed `csrf_token` field and validate it matches the `csrf_tokens` table entry for that user.
- Import `validateCsrfToken` from `@/lib/csrf`.
- If CSRF validation fails, throw an Error('Unauthorized').
```

---

### M3-3 — Class Management API Routes 🔒

```
You are working on a Next.js 16 TypeScript project. All routes must be admin-only.

Create the following API route files. Each mutating route must be wrapped with `withCsrf` from `@/lib/withCsrf`. Each route must also verify `session.role === 'admin'` and return 403 if not.

File 1: `src/app/api/classes/route.ts` (this may already exist from M1-2 — add POST to it)
- POST handler: create a new class.
  - Body: `{ name: string, description?: string }`
  - Validate `name` is non-empty.
  - Insert into `classes` table, return the created row with status 201.

File 2: `src/app/api/classes/[id]/route.ts`
- GET handler: return a single class with its labs ordered by `order_num`.
- PATCH handler: update `name` and/or `description`. Update `updated_at = NOW()`. Return updated row.
- DELETE handler: delete the class (cascade deletes labs via FK). Return 204.

File 3: `src/app/api/labs/route.ts`
- POST handler: create a new lab.
  - Body: `{ class_id: number, lab_key: string, title: string, content: string, order_num?: number }`
  - Validate `lab_key` is unique — return 409 if duplicate.
  - Insert into `labs` table. Return created row with 201.

File 4: `src/app/api/labs/[id]/route.ts`
- GET handler: return a single lab by id.
- PATCH handler: update `title`, `content`, `order_num`. Update `updated_at`. Return updated row.
- DELETE handler: delete the lab. Return 204.

All error responses must follow: `{ message: string }` shape.
```

---

### M3-4 — Class & Lab Management UI Pages

```
You are working on a Next.js 16 React 19 TypeScript project using Tailwind CSS v4.

Create the following pages inside `src/app/dashboard/classes/`.

Page 1: `src/app/dashboard/classes/page.tsx` (Class List)
- SERVER COMPONENT. Admin-only (check session, redirect if not admin).
- Fetch all classes with lab count:
  ```sql
  SELECT c.*, COUNT(l.id) as lab_count 
  FROM classes c 
  LEFT JOIN labs l ON l.class_id = c.id 
  GROUP BY c.id ORDER BY c.created_at DESC
  ```
- Render a table with columns: Class Name, Description (truncated to 60 chars), Labs Count, Created Date, Actions.
- Actions column: "Manage Labs" (link to `/dashboard/classes/[id]`) and "Delete" (a form POST to `/api/classes/[id]` with DELETE method override using a hidden `_method` field, or use a client component button).
- "Create New Class" button at top right — clicking it shows an inline form below the button (collapsible, not a modal): input for Name, textarea for Description, Submit button. This form section is a `'use client'` component that posts to `POST /api/classes` with the CSRF token from the page's `<meta name="csrf-token">` tag. On success, refresh the page using `router.refresh()`.

Page 2: `src/app/dashboard/classes/[id]/page.tsx` (Lab List for a Class)
- SERVER COMPONENT.
- Fetch the class and its labs ordered by `order_num`.
- Show class name as page heading.
- Render a table of labs: Order, Lab Key, Title, Last Updated, Actions (Edit, Delete).
- "Add New Lab" button — links to `/dashboard/classes/[id]/labs/new`.

Page 3: `src/app/dashboard/classes/[id]/labs/new/page.tsx` (Lab Creator)
- CLIENT COMPONENT (`'use client'`).
- Fetch CSRF token on mount from `GET /api/csrf`.
- Form fields:
  - Lab Key (text, e.g. "1-1") — with a note "Must be unique across all labs"
  - Title (text)
  - Order Number (number, default 1)
  - Content (textarea for Markdown — large, min-height 400px, monospace font)
  - Live Preview toggle button: when active, show a split view with the textarea on left and `<MarkdownViewer content={...} />` on right using the existing MarkdownViewer component.
- On submit: POST to `/api/labs` with CSRF token in header.
- On success: redirect to `/dashboard/classes/[id]`.
- On error: show inline error message.

Apply the same dashboard color palette throughout.
```

---

### M3-5 — User Management Page & API 🔒

```
You are working on a Next.js 16 React 19 TypeScript project.

Task 1 — Create API routes:

File: `src/app/api/users/route.ts`
- GET: return all users (admin only). Exclude `password` field from response. Order by `id ASC`.
  Response: `[{ id, username, fullname, role, is_active }]`
- POST: create a new user (admin only, CSRF required via withCsrf).
  - Body: `{ username, fullname, password, role }`
  - Hash password with bcrypt (saltRounds: 10).
  - Insert into `users`. Return 201 with created user (no password field).
  - If username already exists (unique constraint violation), return 409 with `{ message: 'Username already taken' }`.

File: `src/app/api/users/[id]/route.ts`
- PATCH (CSRF required): update `fullname`, `role`, or `is_active`. If `password` is in the body and non-empty, hash and update it too. Return updated user (no password).
- Admins cannot deactivate themselves — check `session.id !== id` before allowing `is_active: false`.

Task 2 — Update `src/app/dashboard/users/page.tsx`:
- Keep as SERVER COMPONENT for initial data fetch.
- Extract the "Create User" form and "Deactivate/Activate" toggle into a separate client component file `src/app/dashboard/users/UserManagementClient.tsx`.
- The client component receives the user list as props and handles:
  - "Create User" inline form (same collapsible pattern as M3-4) with fields: username, fullname, password, role (select: student/admin). Posts to `POST /api/users` with CSRF token.
  - "Deactivate" / "Activate" toggle button per user. Sends PATCH to `/api/users/[id]` with `{ is_active: false/true }` and CSRF token.
  - After any action, call `router.refresh()` to re-sync server data.
- In the table, show a status badge: green "Active" or grey "Inactive" based on `is_active`.
- Admins cannot deactivate themselves — hide the deactivate button for the row matching the current session's username.
```

---

### M3-6 — Add Sidebar Menu Items for New Pages

```
You are working on a Next.js 16 TypeScript project.

Modify `src/app/dashboard/layout.tsx`.

Add two new entries to the `menuItems` array:

1. Class Management:
   - label: 'Class & Lab Management'
   - href: '/dashboard/classes'
   - icon: an SVG BookOpen icon (24x24, stroke-based, matching the style of existing icons in the file)

2. Insert it BETWEEN the existing "Manage Student" and "User Management" items so the order is:
   1. Manage Student
   2. Class & Lab Management  ← new
   3. User Management

Also update the active link highlighting: the current implementation uses static `hover:` classes. Add logic so that the currently active route gets a persistent active style (`bg-[#F2F5F8] text-[#2D9CDB]`) using Next.js `usePathname()` hook. To do this, extract the `<nav>` sidebar content into a `'use client'` component file `src/components/DashboardSidebar.tsx` and use it in `layout.tsx`. Keep `layout.tsx` itself as a server component.
```

---

## ✅ Verification Checklist (Run After All Prompts)

> Paste this as a final Codex prompt after completing all sub-prompts above.

```
You are reviewing a Next.js 16 LMS project for correctness and security.

Perform the following checks and report findings for each item. Do NOT auto-fix — only report:

SECURITY CHECKS:
1. Verify every POST/PATCH/DELETE API route either uses `withCsrf` wrapper or is a Next.js Server Action with manual csrf_token validation.
2. Verify no API route returns a password field (even hashed) in any response.
3. Verify the `user_session` cookie is set with httpOnly: true, sameSite: 'strict' everywhere it is written.
4. Verify the `/dashboard` route and all sub-routes check `session.role === 'admin'` server-side (not just in middleware).
5. Verify `/lab/[id]` checks `lab_access` table before rendering terminal.

FUNCTIONALITY CHECKS:
6. Verify `src/app/page.tsx` (Student Portal) reads enrolled classes from DB and shows locked state for inaccessible labs.
7. Verify `src/components/WebTerminal.tsx` has reconnect logic with max 3 attempts.
8. Verify `src/app/dashboard/classes/` folder has: `page.tsx`, `[id]/page.tsx`, `[id]/labs/new/page.tsx`.
9. Verify `src/lib/migrate.js` exists and covers all 5 schema changes.
10. Verify `src/lib/csrf.ts` exports: `generateCsrfToken`, `storeCsrfToken`, `validateCsrfToken`, `getCsrfFromRequest`.

For each check, respond with: ✅ PASS, ❌ FAIL (with file and line reference), or ⚠️ PARTIAL (with explanation).
```
