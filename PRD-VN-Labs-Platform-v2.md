# Product Requirements Document (PRD)
## VN-Labs — Interactive DevOps Lab Management System
### UI Implementation Reference (v2.0)

---

**Document Version:** 2.0  
**Status:** Final — Ready for Implementation  
**Created:** May 2026  
**Supersedes:** PRD-LMS-Platform v1.0  
**Tech Stack:** Next.js 16 · React 19 · TypeScript · PostgreSQL · Socket.IO · SSH2 · Tailwind CSS v4  
**UI Reference:** Stitch V2 Design (18 screens, HTML prototypes provided)  
**Design System:** VN-Labs Identity (Geist + Inter + JetBrains Mono, dark theme `#10141a`)

---

## Table of Contents

1. [Product Overview & Vision](#1-product-overview--vision)
2. [Design System & UI Tokens](#2-design-system--ui-tokens)
3. [System Architecture](#3-system-architecture)
4. [User Roles & Personas](#4-user-roles--personas)
5. [Route Map & Navigation](#5-route-map--navigation)
6. [Screen Specifications](#6-screen-specifications)
   - 6.1 [Login Page](#61-login-page--login)
   - 6.2 [Student Portal (Home)](#62-student-portal--home-)
   - 6.3 [Lab Environment](#63-lab-environment--labid)
   - 6.4 [Student Progress](#64-student-progress--progress)
   - 6.5 [Admin Dashboard Overview](#65-admin-dashboard-overview--dashboard)
   - 6.6 [Admin: Student Access Control](#66-admin-student-access-control--dashboardmanage-student)
   - 6.7 [Admin: Class Detail & Labs](#67-admin-class-detail--labs--dashboardclassesid)
   - 6.8 [Admin: Lab Content Editor](#68-admin-lab-content-editor--dashboardclassesidlabsnew--edit)
   - 6.9 [Admin: User Management](#69-admin-user-management--dashboardusers)
   - 6.10 [Lab Grading / Results](#610-lab-grading--results)
   - 6.11 [Platform Settings](#611-platform-settings--dashboardsettings)
   - 6.12 [Notification System](#612-notification-system-components)
   - 6.13 [Empty States & Error Pages](#613-empty-states--error-pages)
7. [Shared Components](#7-shared-components)
8. [API Contract](#8-api-contract)
9. [Database Schema](#9-database-schema)
10. [Security Requirements](#10-security-requirements)
11. [Non-Functional Requirements](#11-non-functional-requirements)
12. [Implementation Phases](#12-implementation-phases)
13. [Success Metrics](#13-success-metrics)

---

## 1. Product Overview & Vision

### 1.1 Product Name & Tagline

**VN-Labs** — *"Your terminal. Your lab. Your learning."*

A hands-on interactive DevOps training platform that embeds a real SSH-connected web terminal side-by-side with structured lab instructions in the browser — no local setup required.

### 1.2 Problem Statement

Technical training programs (DevOps, Linux, Jenkins, networking) require students to practice on real servers. The gap: learners either need complex local VM setups, or rely on passive video content. VN-Labs bridges this gap by delivering a live terminal environment inside a structured, instructor-authored lab page — accessible from any modern browser.

### 1.3 Core Value Proposition

| Persona | Pain Point | VN-Labs Solution |
|---|---|---|
| **Student** | Needs a real server to practice commands but doesn't have one | One-click SSH terminal embedded in the lab page |
| **Admin/Instructor** | Hard to control which students access which labs, manage content | Full dashboard: CRUD labs, toggle student access per-lab |
| **Platform** | Lab content is static and hard to update | Admin markdown editor with live preview, DB-persisted content |

### 1.4 Platform Personality

The VN-Labs brand is **"The Expert Mentor"** — silent, efficient, and precise. The UI is dark, developer-focused, and minimalist. Think VS Code meets AWS CloudShell: utilitarian beauty, high information density, technical edge. No marketing fluff, no pastel gradients — this is a working environment.

---

## 2. Design System & UI Tokens

> All UI implementation must strictly follow these tokens. Source of truth: `vn_labs_identity/DESIGN.md`.

### 2.1 Color Palette

```css
/* Backgrounds — layered tonal system */
--bg-base:              #0a0e14;  /* surface-container-lowest: deepest layer */
--bg-primary:           #10141a;  /* surface / background: main app background */
--bg-card:              #1c2026;  /* surface-container: cards, panels */
--bg-card-high:         #262a31;  /* surface-container-high: elevated cards */
--bg-card-highest:      #31353c;  /* surface-container-highest: modals, dropdowns */
--bg-bright:            #353940;  /* surface-bright: hover states */

/* Text */
--text-primary:         #dfe2eb;  /* on-surface: body text */
--text-secondary:       #bec8d2;  /* on-surface-variant: labels, secondary */
--text-muted:           #88929b;  /* outline: placeholders, disabled */

/* Borders */
--border-default:       #3e4850;  /* outline-variant */
--border-muted:         #262a31;  /* subtle separators */

/* Brand Accents */
--primary:              #89ceff;  /* primary: links, active states, teal-light */
--primary-action:       #0ea5e9;  /* primary-container: CTA buttons, interactive */
--secondary:            #4edea3;  /* secondary: success, connected, completed */
--tertiary:             #ffb86e;  /* tertiary: warnings, streak, XP */
--error:                #ffb4ab;  /* error text */
--error-container:      #93000a;  /* error backgrounds */
```

### 2.2 Typography

| Token | Font | Size | Weight | Use |
|---|---|---|---|---|
| `headline-xl` | Geist | 40px | 700 | Page hero titles |
| `headline-lg` | Geist | 32px | 600 | Page section titles |
| `headline-md` | Geist | 24px | 600 | Card headings |
| `body-lg` | Inter | 18px | 400 | Lab instructions body |
| `body-md` | Inter | 16px | 400 | General body copy |
| `body-sm` | Inter | 14px | 400 | Labels, metadata |
| `code-md` | JetBrains Mono | 14px | 400 | Terminal, code blocks, badge text |
| `label-caps` | JetBrains Mono | 12px | 600 | All-caps labels, nav items |

**Import:** `https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Geist:wght@600;700&family=Inter:wght@400&display=swap`

### 2.3 Spacing

Base unit: `4px`. Primary spacings: `4px (xs)` · `8px (sm)` · `16px (md)` · `24px (lg)` · `48px (xl)` · `20px (gutter)`.

### 2.4 Border Radius

- UI elements (buttons, inputs, cards): `4px` (rounded-sm in Tailwind)
- Elevated surfaces (modals, drawers): `8px`
- Status badges/pills: `9999px` (fully rounded)
- Active nav indicator: `2px left border` (not rounded background)

### 2.5 Elevation System

| Level | Background | Border | Use |
|---|---|---|---|
| 0 — Base | `#0a0e14` | — | App background |
| 1 — Cards | `#1c2026` | `1px #3e4850` | Cards, panels, sidebar |
| 2 — Popovers | `#262a31` | `1px #3e4850` | Dropdowns, tooltips |
| 3 — Modals | `#31353c` | `1px #3e4850` + shadow | Modals, drawers |

### 2.6 Interaction States

- **Hover:** Border color → `#0ea5e9` (teal). No lift effect. No shadow change.
- **Focus ring:** `box-shadow: 0 0 0 3px rgba(14,165,233,0.20)`
- **Active state (nav):** 2px left solid border in `#89ceff` + teal text. No pill background.
- **Disabled:** opacity `0.40`, `cursor-not-allowed`

---

## 3. System Architecture

### 3.1 App Structure

```
VN-Labs Platform (Next.js 16, single monorepo)
│
├── /login                    → Micro-App 1: Auth entry point
├── /                         → Micro-App 1: Student Portal
├── /progress                 → Student progress & lab history
├── /lab/[id]                 → Micro-App 2: Interactive Lab (split pane)
│
├── /dashboard                → Micro-App 3: Admin — Overview
├── /dashboard/manage-student → Admin — Student Lab Access Control
├── /dashboard/classes        → Admin — Class list
├── /dashboard/classes/[id]   → Admin — Class Detail + Labs tab
├── /dashboard/classes/[id]/labs/new  → Admin — Lab Content Editor (new)
├── /dashboard/classes/[id]/labs/[labId]/edit → Admin — Lab Editor (edit)
├── /dashboard/users          → Admin — User Management CRUD
└── /dashboard/settings       → Admin — Platform Settings
│
├── /api/**                   → REST API routes (Next.js Route Handlers)
└── server.js                 → Custom HTTP server (Socket.IO + SSH2 proxy)
```

### 3.2 Communication Architecture

```
Browser ──HTTP──▶ Next.js App Router (SSR + API Routes)
                              │
                              ├── PostgreSQL (pg pool, max:20)
                              └── server.js (Socket.IO)
                                        │
                                        └── SSH2 ──SSH──▶ Lab Server
```

- **Auth:** Cookie-based (`user_session`, HttpOnly, Secure, SameSite=Strict, 8h expiry)
- **Terminal:** Socket.IO bidirectional, SSH2 server-side proxy
- **CSRF:** Token in session + `X-CSRF-Token` header on all mutating requests
- **Real-time:** Socket.IO for terminal I/O; no polling elsewhere

### 3.3 Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend Framework | Next.js | 16.1.7 |
| UI Library | React | 19.2.3 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | v4 |
| Database | PostgreSQL | 14+ |
| DB Client | pg (node-postgres) | 8.x |
| Terminal UI | @xterm/xterm + @xterm/addon-fit | 6.x |
| WebSocket | socket.io + socket.io-client | 4.x |
| SSH | ssh2 | 1.x |
| Markdown | react-markdown | 10.x |
| Icons | lucide-react | 0.577+ |
| Auth | bcrypt | 6.x |
| Server | Custom server.js (Node HTTP + Socket.IO) | — |

---

## 4. User Roles & Personas

| Role | Description | Login Redirect | Access |
|---|---|---|---|
| `student` | Learner enrolled in classes | `→ /` (Portal) | `/`, `/lab/[id]`, `/progress` |
| `admin` | Instructor / platform manager | `→ /dashboard` | All routes |

Role is stored in `users.role` (PostgreSQL), validated in:
1. Next.js Middleware (`src/middleware.ts`) — redirect guard
2. Per-route server-side checks — role enforcement

---

## 5. Route Map & Navigation

### Student Navigation (Top App Bar)
```
[VN-Labs Logo]    [Class]   [Module]   [Profile ▼]   [🔔 Bell]
```
- Tabs are for visual context; actual routing uses sidebar / direct links
- `Profile ▼` → dropdown: My Progress, Logout

### Admin Navigation (Left Sidebar, 320px fixed)
```
[VN-Labs Logo]
[Admin Panel]
─────────────
● Overview         /dashboard
  Users            /dashboard/users  (24)
  Class Assignment /dashboard/manage-student
  Modules          /dashboard/classes
  Labs             /dashboard/classes (tab)
  Settings         /dashboard/settings
─────────────
[Avatar] Najwan  [Logout icon]
```
- Active state: 2px left border teal + teal text
- Mini counts shown next to items (e.g., "Users (24)")

---

## 6. Screen Specifications

---

### 6.1 Login Page (`/login`)

**Reference file:** `vn_labs_login_page_states/code.html`

#### Layout
Full-viewport dark background (`#0a0e14`) with subtle dot-grid overlay and radial teal glow behind the card.

#### Card (centered, 420px wide)
- Background: `#1c2026`, border: `1px solid #3e4850`, border-radius: `8px`
- Top accent: `3px solid #0ea5e9` at top edge only (the "powered-on" indicator)

#### Card Content (top to bottom)
1. **Logo section:** Hexagon icon (teal) + "VN-Labs" (Geist Bold 24px) + "DevOps Lab Platform" (JetBrains Mono 12px, muted)
2. **Heading:** "Welcome back" (Geist 24px, white) + subtext (Inter 14px, `#bec8d2`)
3. **Username field:**
   - Label: `USERNAME` (JetBrains Mono 12px, all-caps, `#88929b`)
   - Input: `bg-[#0a0e14]`, `border-[#3e4850]`, focus → teal border + `box-shadow: 0 0 0 3px rgba(14,165,233,0.15)`
   - Placeholder: `"your-username"` (monospace, `#3e4850`)
4. **Password field:** Same as username + eye toggle icon (show/hide)
5. **Error state:** Red dot + message below password. Both fields get `border-red-500`
6. **Login button:** Full-width, `bg-[#0ea5e9]`, hover `bg-[#0284c7]`, JetBrains Mono, text "Sign In →"
   - Loading state: spinner + "Authenticating..."
7. **Footer:** Lock icon + "Secure login · Session expires in 8 hours" (JetBrains Mono 11px, muted)

#### Behavior
- Fetch CSRF token from `/api/csrf` on mount
- POST `/api/auth/login` with `{ username, password }` + `X-CSRF-Token` header
- Success: redirect based on `role` (`student` → `/`, `admin` → `/dashboard`)
- Error: generic "Invalid credentials" message (never specify which field is wrong)
- Already logged in: middleware redirects before page renders

#### Components Needed
- `LoginCard` (client component)
- `PasswordInput` (with show/hide toggle)
- `ErrorMessage` (with `aria-live="assertive"`)

---

### 6.2 Student Portal (`/` — Home)

**Reference files:** `vn_labs_student_portal/code.html`, `vn_labs_student_portal_enhanced/code.html`

#### Layout
Full-height, two-column split: **Left Sidebar (320px fixed)** + **Right Main Area (fluid)**

#### Top App Bar (full width, 56px)
- Left: Hexagon logo + "VN-Labs" (Geist Bold, teal)
- Center: Nav tabs — `[Class]` `[Module]` `[Profile]` (Profile = active, teal pill)
- Right: Notification bell with badge (red dot, count) + Avatar circle (initials)

#### Left Sidebar
- Search input: "Search by name" + filter chips `[Class]` `[Latest]`
- **Recently Accessed** section: 3 lab chips (monospace lab IDs, e.g., `LAB 1.1`)
- **Class Cards** (stacked, scrollable):
  - Each card: class name header + trash icon + list of lab items
  - **Lab Item:** Lab ID badge (teal pill, JetBrains Mono) + title (truncated) + status badge + chevron →
  - Status badges: `Active` (emerald, `bg-emerald-950 text-emerald-400`), `Locked` (red, `bg-red-950 text-red-400`), `Done` (zinc)
  - Below each lab item: thin 4px teal progress bar (% completion if in-progress)
  - Active/selected lab: teal left border on the item

#### Right Main Area
When a lab is selected from sidebar:
- **Header bar:** Lab title + teal `Grade` button
- **Split preview (50/50):**
  - Left sub-panel: Lab instructions (markdown rendered, `prose` style, dark background)
  - Right sub-panel: Terminal preview area (dark, monospace prompt, status indicator)

#### Keyboard Shortcut Footer
Fixed at bottom of sidebar: `"Press Tab to switch panels · Ctrl+\` for terminal"` (JetBrains Mono 11px, muted)

#### Data
- Fetch from `/api/classes` (filtered by enrollment for logged-in student)
- Labs the student has no access to: shown locked (no click, no chevron, red badge)
- Clicking a lab with access: navigate to `/lab/[lab_key]`

---

### 6.3 Lab Environment (`/lab/[id]`)

**Reference files:** `vn_labs_lab_environment/code.html`, `vn_labs_lab_environment_enhanced/code.html`

This is the **core feature** of VN-Labs. Full-screen split-pane workspace.

#### Layout
```
[Top App Bar — 56px]
[Breadcrumb Bar — 36px]
[════════════════════════════════════]
[ LEFT PANEL        ║ RIGHT PANEL    ]
[ Lab Instructions  ║ SSH Terminal   ]
[ (default 50%)     ║ (default 50%)  ]
[════════════════════════════════════]
```

#### Breadcrumb Bar
`← Back to Portal  |  Lab: [Lab Title]`

#### Left Panel — Lab Instructions
Background: `#10141a`

Structure (scrollable):
1. **Header:** Lab title (Geist Bold, large) + difficulty badge + duration chip + XP chip
2. **Task Progress:** `"Tasks: 2 / 4 completed"` — stepped dots (not continuous bar), JetBrains Mono
3. **Markdown content sections:**
   - `Overview` — body text, `body-lg` Inter
   - `Prerequisites` — numbered list; collapsible (collapsed by default after first view)
   - `Tasks` — accordion items, each with checkbox on left; ticking a checkbox updates progress dots
   - `Hints` — collapsed by default, expandable; amber left border when open
4. **Code blocks:** `bg-[#0a0e14]`, teal left border (3px), JetBrains Mono 14px; **Copy button** appears top-right on hover

Fixed bottom footer:
- `← Previous Lab` | `Next Lab →` navigation buttons
- Keyboard hint: `"Ctrl+\` — focus terminal"`

#### Resize Handle (center divider)
- Width: `6px`, background `#3e4850`
- Hover: background `#0ea5e9` + `cursor-col-resize`
- Center: small pill indicator (⇔ arrows) + tooltip "Drag to resize"
- Dragging: no text selection, blue glow
- Min/max: 15% – 85% of container width

#### Right Panel — SSH Terminal
Background: `#09090b` (near black)

**Terminal Header (36px):**
- Left: Three macOS-style dots (decorative: `#ff5f57`, `#febc2e`, `#28c840`)
- Center: `"SSH Terminal — [lab_session_host]"` JetBrains Mono
- Right: Connection status dot + text + action buttons: `[↺ Reconnect]` `[✕ Clear]` `[⛶ Fullscreen]`
- Session timer: `"00:23:47"` elapsed

**Connection Status States:**
| State | Dot Color | Text |
|---|---|---|
| `connecting` | `#88929b` (zinc) | "Connecting to lab environment..." |
| `connected` | `#4edea3` (emerald) + pulse animation | "Connected" |
| `reconnecting` | `#ffb86e` (amber) + pulse | "Reconnecting... (attempt X of 3)" |
| `failed` | `#ffb4ab` (red) | "Connection failed." + Retry button |

**Terminal Body:**
- xterm.js instance, `fontSize: 14`, `fontFamily: "JetBrains Mono, Menlo, monospace"`
- Theme: `background: #09090b`, `foreground: #e4e4e7`, prompt in `#4edea3`
- Fills all available height

**Keyboard Shortcuts Overlay** (toggle with keyboard icon in header):
- Semi-transparent overlay inside terminal area
- Table of shortcuts: Ctrl+C, Ctrl+D, Tab, Up/Down, Ctrl+L (clear), etc.

**Terminal Footer (28px):**
- Left: `"Lines: 47 | Cols: 132"` JetBrains Mono
- Right: `"xterm.js v6 | SSH2"`

#### Mobile (< 1024px)
- Stacked: instructions top (45vh) + terminal bottom (45vh)
- Tab bar to switch: `[Instructions]` `[Tasks]` (terminal always visible bottom)
- Bottom toolbar: `[↕ Resize]` `[⛶ Full Terminal]` `[📋 Copy]` `[↩ Reconnect]`

#### WebTerminal Component (existing — to be restyled)
Existing `WebTerminal.tsx` logic is correct. Needs visual overhaul:
- Replace the basic status bar with the enhanced header above
- Add timer (use `useEffect` interval, reset on connect)
- Add Clear and Fullscreen buttons
- Add keyboard shortcuts overlay toggle
- Apply new color tokens throughout

---

### 6.4 Student Progress (`/progress`)

**Reference file:** `vn_labs_student_progress/code.html`

#### Layout
Full page, single column, max-width container. Same Top App Bar as portal.

**Breadcrumb:** `← Back to Portal  |  My Progress`

#### Section 1 — Student Summary Card
Full-width card (`bg-[#1c2026]`, border)

Left side:
- Avatar (48px, teal bg, white initials)
- Name (Geist Bold 24px)
- Username (JetBrains Mono 14px, muted)
- Role badge (sky pill)
- "Enrolled since: March 2026"

Right side (stat row):
- "12 / 18 Labs Completed" (large teal number)
- "3 Classes Enrolled"
- "2,400 XP Earned" (amber, trophy icon)
- "7-Day Streak 🔥"

Bottom: Overall completion progress bar (`4px`, teal fill) + "Overall Completion: 67%"

#### Section 2 — Class Progress Cards

One card per enrolled class:
- Header: Class name + module count + completion % badge
- Class-level progress bar
- **Lab list table:**

| Lab ID | Lab Title | Status | Score | Time | Completed |
|---|---|---|---|---|---|
| `LAB 1.1` | Configure... | ✅ Completed | 95/100 | 42 min | Apr 12 |
| `LAB 1.2` | Build Freestyle... | ▶ In Progress | — | 15 min | — |
| `LAB 1.3` | Pipeline as Code | 🔒 Locked | — | — | — |

Status badge colors: Completed (emerald), In Progress (teal + pulse), Not Started (zinc), Locked (red)

Footer: "Continue Learning →" if incomplete labs exist

#### Section 3 — Recent Activity Timeline
Vertical timeline with left border line:
- Each entry: dot (color = status) + action text + time ago + optional score
- Types: Completed, Started, Access Granted, Enrolled, Lab Locked

---

### 6.5 Admin Dashboard Overview (`/dashboard`)

**Reference files:** `vn_labs_admin_dashboard/code.html`, `vn_labs_admin_dashboard_enhanced/code.html`

#### Layout
Left sidebar (320px fixed) + main content (fluid). Main content scrollable.

#### Page Header
- Title: "Overview" (Geist Bold)
- Subtitle: day/date
- Right: Date range filter chips `[Today]` `[This Week]` `[This Month]` + "Create New Class" button (teal)

#### Stats Grid (4 cards, responsive 2×2 → 1×4)
Each stat card (`bg-[#1c2026]`, border, hover → teal border):
- Label + icon (Material Symbols Outlined)
- Large number (Geist, teal for primary stat)
- Trend: "+3 this week" (emerald) or trend arrow
- Mini sparkline chart (7-day inline SVG, bottom of card)

Stats:
1. **Total Students** — real count from `users` where `role='student' AND is_active=true`
2. **Active Classes** — count from `classes`
3. **Total Labs** — count from `labs`
4. **Active Sessions** — count from `lab_sessions`

#### Recent Sessions Table
Columns: Student (avatar+name) | Lab | Started | Duration | Status

Status: `Active` (emerald dot + pulse) | `Ended` (zinc)

#### Class Table
Columns: Class Name | Students | Labs | Status | Created | Actions

Actions: `[Edit]` `[Delete]` — Delete shows confirmation modal before executing

#### Activity Feed
Right sidebar (240px) or section below table:
- Feed of recent `lab_access` changes
- Format: `[icon] Action — X min ago`

#### Quick Actions Panel
Fixed to sidebar or panel area:
- `[+] Add Student`
- `[+] Create Lab`
- `[→] Grant Access`
- `[⚡] View Active Sessions`

---

### 6.6 Admin: Student Access Control (`/dashboard/manage-student`)

**Reference file:** `vn_labs_student_access_control/code.html`

#### Purpose
The most-used admin workflow: toggle which students can access which labs.

#### Page Header
Title: "Class Assignment & Access Control"
Subtitle: "Manage student lab access per class"
Right: `[Export CSV]` (outlined) + `[Bulk Assign]` (teal)

#### Filter & Search Bar
- Search: "Search students..."
- Class dropdown filter
- Lab dropdown filter
- Status chips: `[All]` `[Active]` `[Locked]`

#### Main Table
Sticky header. Columns: **Student** | **Username** | **Class** | **[Lab columns…]** | **Actions**

Lab columns are dynamic (one per lab). Each cell = **Toggle Switch:**
- ON: teal thumb + `"Active"` label below
- OFF: zinc thumb + `"Locked"` label below
- No session: `"—"` dash

Row actions (kebab `⋮` menu): "View Profile", "Revoke All", "Grant All"

**Bulk Action Bar** (appears when rows checked):
Sticky bottom: `"N students selected"` + `[Grant Access ▼]` `[Revoke Access ▼]` `[Cancel]`

#### Side Drawer (380px, slides from right)
Opens on row click:
- Student profile card (avatar + name + stats)
- Individual lab toggles with labels
- "Last Login: X ago"
- "Total Lab Sessions: 12"
- "Save Changes" button (teal, bottom)

#### Data / API
- GET `/api/users?role=student` for student list
- GET `/api/labs` for lab columns
- POST `/api/lab-access` `{ username, labId, hasAccess }` on toggle (with CSRF)

---

### 6.7 Admin: Class Detail & Labs (`/dashboard/classes/[id]`)

**Reference file:** `vn_labs_jenkins_fundamentals_class_detail/code.html`

#### Page Header Card
- Class name (Geist Bold 32px) + description + meta (labs count, students, created)
- Right: `[Edit Class]` (outlined) + `[Delete Class]` (outlined, red hover) + `[+ Add Lab]` (teal)

#### Tab Bar
`[Labs (6)]` `[Enrolled Students (12)]` `[Settings]`

#### Labs Tab (active)
Reorderable list (drag handle on left ≡):

Each lab card:
```
[≡] [LAB 1.1] "Configure Credential Store using Secret Text"
     Intermediate · 45 min · 100 XP · 12 students assigned
     [Published ⬤]    [Edit ✏]   [Delete 🗑]
```

- Lab ID: teal pill, JetBrains Mono
- Status toggle: Published (teal) / Draft (zinc)
- `+ Add New Lab`: dashed border button at bottom of list

#### Add Lab Modal (600px, centered)
Fields: Lab Title | Lab ID/Key (auto-slug, editable, monospace) | Difficulty | Duration | XP | Status (Draft/Published)
CTA: `[Next: Add Content →]` (teal)

#### Enrolled Students Tab
Student list: Avatar + Name + Username + Enrollment Date + Progress bar + Remove button

---

### 6.8 Admin: Lab Content Editor (`/dashboard/classes/[id]/labs/new` + `/edit`)

**Reference file:** `vn_labs_lab_content_editor/code.html`

#### Layout
Side-by-side: **Left (Markdown Editor, 50%)** | **Right (Live Preview, 50%)**

#### Action Bar (top of main area)
Inline metadata fields: Title input | Difficulty select | Duration input | XP input | Status radio
Right: `[Save Draft]` (outlined) + `[Publish]` (teal)
Status: "Last saved: 2 min ago" | "Characters: 1,247" | "~8 min read"

#### Left Panel — Editor
- Dark code-editor look (`bg-[#0a0e14]`)
- Line numbers (zinc-600)
- Markdown syntax highlighting: headings (teal), bold (white), code (distinct bg), lists
- Toolbar: `B I \`code\` H1 H2 | link image | undo redo | fullscreen`
- Textarea (controlled `<textarea>` or CodeMirror integration)

#### Right Panel — Preview
- Same rendered Markdown as student view (same `MarkdownViewer` component)
- Header: `"Preview"` label + green pulsing live indicator dot
- Updates as editor content changes (debounced 300ms)

#### Keyboard Shortcut
`Ctrl+S` → Save Draft; `Ctrl+Shift+P` → Publish

---

### 6.9 Admin: User Management (`/dashboard/users`)

**Reference file:** `user_management_access_control/code.html`

#### Page Header
Title: "User Management"
Subtitle: "24 total users · 22 students · 2 admins"
Right: `[Export]` (outlined) + `[Create User]` (teal)

#### Filter Bar
Search | Role chips `[All Roles] [Students] [Admins]` | Status chips `[All] [Active] [Inactive]` | Sort dropdown

#### User Table
Columns: **Avatar+Name** | **Username** | **Role** | **Status** | **Enrolled Classes** | **Last Login** | **Actions**

Role badges: Student (sky pill) | Admin (purple pill)
Status: Active (green dot) | Inactive (red dot)
Actions: `[Edit]` + `[⋮]` kebab menu

Skeleton row shown during loading (shimmer animation).
Pagination: `< 1 2 3 > "Showing 1–10 of 24 users"`

#### Create User Modal (480px)
Fields:
- Full Name
- Username (auto-slug from name, editable; real-time availability check "✓ Username available")
- Password (text input + `[🎲 Generate]` button + show/hide eye)
- Confirm Password
- Role: Radio — `[Student]` `[Admin]` with descriptions
- Status: Toggle Active/Inactive
- Enroll in Class: multi-select dropdown (optional)

CTA: `[Cancel]` + `[Create User →]` (teal)

#### Edit User Drawer (400px, right side)
Same fields as create (pre-filled) + avatar area.

**Danger Zone** (bottom of drawer, red-bordered card):
- Reset Password → `[Reset]` (sends temp password)
- Deactivate Account → toggle with confirmation
- Delete Account → `[Delete]` (red) → shows confirmation modal

#### API
- GET `/api/users` — list users
- POST `/api/users` — create (bcrypt password server-side)
- PATCH `/api/users/[id]` — update / deactivate
- DELETE (or PATCH `is_active=false`) — soft delete

---

### 6.10 Lab Grading / Results

**Reference files:** `vn_labs_grading_in_progress/code.html`, `vn_labs_lab_results_87_100/code.html`

#### State 1: Grading In Progress (full-screen overlay)
Dark overlay (`#0a0e14` at 95% opacity) centered card (500px):
- Animated hexagon spinner (teal rotating border)
- Title: "Grading Your Submission..."
- Step checklist with states: ✅ done | ⏳ current (spinner) | ⬜ pending
- "This usually takes 15–30 seconds. Don't close this window."

#### State 2: Results Page
Full-page (or overlay) with two variants:

**PASS variant:**
- Large emerald checkmark icon (64px) + "Lab Completed!" (Geist Bold 32px)
- Confetti particle animation layer

**FAIL variant:**
- Large red X icon + "Keep Practicing"

**Score Card (centered):**
- Score: `"87 / 100"` (Geist Bold 56px, teal)
- Grade: `"B+"` (JetBrains Mono)

**Task Breakdown Table:**

| Task | Description | Points | Status |
|---|---|---|---|
| Task 1 | Credential Store Created | 30/30 | ✅ Pass |
| Task 2 | Secret Text Format | 25/25 | ✅ Pass |
| Task 3 | Pipeline Integration | 20/25 | ⚠️ Partial |
| Task 4 | Build Log Verification | 12/20 | ❌ Fail |

**Feedback Section:**
- Green callout (pass items)
- Amber callout (partial items)
- Red callout (fail items with specific guidance)

**XP Animation:** `"+87 XP"` badge animates in with count-up if passed

**Action Buttons:**
- If passed: `[Next Lab →]` (teal) + `[Back to Portal]` (text link)
- If failed: `[Retry Lab]` (outlined) + `[View Hint]` (outlined zinc) + `[Back to Portal]`

---

### 6.11 Platform Settings (`/dashboard/settings`)

**Reference file:** `vn_labs_platform_settings_ssh/code.html`

#### Layout
Admin sidebar + two-column settings layout:
- Left (200px sticky): Settings nav (General, Security, SSH Connections ✦active, Notifications, Appearance, About)
- Right (fluid): Settings content panel

#### SSH Connections (active section)

**Lab Session Configuration card:**
- Default SSH Port (number input, default: 22)
- Session Timeout (number input, default: 480 min)
- Max Reconnect Attempts (number input, default: 3)
- Reconnect Delay ms (number input, default: 1000)
- Toggle: Auto-reconnect on disconnect — ON
- Toggle: Show SSH debug logs — OFF

**SSH Host Templates table:**
| Template Name | Host Pattern | SSH User | Port | Status | Actions |
|---|---|---|---|---|---|
| `jkadm-lab-{n}` | `pro-jkadm-vian` | `student` | 22 | Active | `[Edit] [Test]` |

"+ Add Template" button below

**Security Settings card:**
- Toggle: Enforce CSRF Protection — ON (locked, cannot disable)
- Toggle: Rate limit login attempts — ON
- Max attempts: 10 per 15 minutes
- Toggle: Require HTTPS — ON
- Session Cookie Expiry: 8 hours

**Danger Zone (red-bordered card):**
- Reset All Lab Sessions → `[Reset]`
- Clear Terminal History → `[Clear]`
- Wipe Demo Data → `[Wipe]`

**Bottom:** `[Save Changes]` (teal) + "Last saved: 5 min ago"

---

### 6.12 Notification System Components

**Reference file:** `vn_labs_notification_system_ui_kit/code.html`

These are shared UI components used across all pages.

#### Toast Notifications (top-right, stacked, z-50)
- 320px wide, `bg-[#1c2026]`, colored left border (4px), dismiss X
- Auto-dismiss: 5 seconds, progress bar at bottom
- Variants: Success (emerald), Error (red), Warning (amber), Info (teal)

#### Notification Bell (in Top App Bar)
- Icon: 🔔 with red badge (count)
- Click: opens 360px right drawer

#### Notification Drawer
- Header: "Notifications" + "Mark all read" link
- Filter tabs: `[All]` `[Labs]` `[Access]` `[System]`
- Item states: Unread (`bg-[#262a31]` + blue dot) | Read (`bg-[#1c2026]`)
- Item types with icons: Access Granted 🔓, Graded ✅, Disconnected ⚠️, New Class 📚, Locked 🔒

#### Inline Alert Banners (full-width, inside pages)
- Info: teal left border + info icon + message + dismiss
- Warning: amber left border
- Error: red left border
- Placed at top of main content area when relevant

#### Confirmation Modal
- 480px wide, centered, `bg-[#31353c]`
- Title + destructive description
- `[Cancel]` (outlined) + `[Confirm Action]` (red)
- Backdrop: `bg-black/60` overlay

---

### 6.13 Empty States & Error Pages

**Reference file:** `vn_labs_empty_states_error_pages/code.html`

#### Empty States

Each empty state: centered icon (48px, muted) + title + description + optional CTA

| Context | Icon | Message |
|---|---|---|
| No labs assigned (Student) | `lock_outline` | "No Labs Available Yet. Contact your instructor." |
| No students enrolled (Admin) | `group_off` | "No Students Enrolled. Go to Class Assignment." |
| Terminal failed | Disconnect icon | "Connection failed. ERR: SSH host unreachable." + Retry button |
| No search results | `search_off` | "No students found. Try a different search term." |

#### Error Pages

**403 Forbidden:**
- Large faint "403" (120px, `#3e4850`) background
- Lock icon (red, 48px) foreground
- "Access Restricted" + explanation + `[← Back to Portal]`

**404 Not Found:**
- Large faint "404" background
- Terminal icon (zinc)
- "Lab Not Found" + monospace error detail `lab_id: lab-9-9 → NOT_FOUND`

**500 Server Error:**
- Warning icon (amber)
- "Something went wrong on our end"
- `[Try Again]` + `[Go to Portal]`

---

## 7. Shared Components

### Component Registry

| Component | File | Type | Description |
|---|---|---|---|
| `TopAppBar` | `components/TopAppBar.tsx` | Client | Student-facing top nav with logo, tabs, avatar, bell |
| `AdminSidebar` | `components/DashboardSidebar.tsx` | Client | Admin left nav with active states (EXISTS — needs restyle) |
| `DashboardLayout` | `app/dashboard/layout.tsx` | Server | Admin layout wrapper (EXISTS) |
| `ResizableSplit` | `components/ResizableSplit.tsx` | Client | Draggable split pane (EXISTS — needs visual restyle) |
| `WebTerminal` | `components/WebTerminal.tsx` | Client | xterm.js + socket.io (EXISTS — needs restyle + features) |
| `MarkdownViewer` | `components/MarkdownViewer.tsx` | Client | react-markdown renderer (EXISTS — needs restyle) |
| `StatusBadge` | `components/ui/StatusBadge.tsx` | Client | Active/Locked/Done/Draft pill badges |
| `LabCard` | `components/LabCard.tsx` | Client | Class list card with expandable lab items |
| `ToggleSwitch` | `components/ui/ToggleSwitch.tsx` | Client | Teal/zinc toggle for access control |
| `UserAvatar` | `components/ui/UserAvatar.tsx` | Client | Initials-based avatar with color |
| `CodeBlock` | `components/ui/CodeBlock.tsx` | Client | Code snippet with copy button |
| `ConfirmModal` | `components/ui/ConfirmModal.tsx` | Client | Reusable destructive action modal |
| `Toast` | `components/ui/Toast.tsx` | Client | Toast notification system |
| `EmptyState` | `components/ui/EmptyState.tsx` | Client | Reusable empty state pattern |
| `Header` | `components/Header.tsx` | Server | (EXISTS — replace with TopAppBar) |

### Component Standards
- All components use VN-Labs design tokens (CSS variables or Tailwind custom values)
- No component uses `bg-white`, `text-black`, or light-mode colors
- All interactive elements have focus rings (`ring-2 ring-[#0ea5e9]/30`)
- All status-conveying elements have text labels (not color-only)

---

## 8. API Contract

All routes return `Content-Type: application/json`. All state-mutating routes require `X-CSRF-Token` header.

### 8.1 Auth

| Method | Route | Auth | CSRF | Description |
|---|---|---|---|---|
| GET | `/api/csrf` | No | — | Get pre-auth CSRF token |
| POST | `/api/auth/login` | No | Yes | Login, returns `{ ok, csrf_token, role }` |
| POST | `/api/auth/logout` | Yes | Yes | Clears session cookie |

### 8.2 Classes

| Method | Route | Auth | Role | CSRF |
|---|---|---|---|---|
| GET | `/api/classes` | Yes | Any | No |
| POST | `/api/classes` | Yes | admin | Yes |
| PATCH | `/api/classes/[id]` | Yes | admin | Yes |
| DELETE | `/api/classes/[id]` | Yes | admin | Yes |

### 8.3 Labs

| Method | Route | Auth | Role | CSRF |
|---|---|---|---|---|
| GET | `/api/lab/[id]` | Yes | Any | No |
| GET | `/api/labs` | Yes | Any | No |
| POST | `/api/labs` | Yes | admin | Yes |
| PATCH | `/api/labs/[id]` | Yes | admin | Yes |
| DELETE | `/api/labs/[id]` | Yes | admin | Yes |

### 8.4 Lab Access

| Method | Route | Body | CSRF |
|---|---|---|---|
| POST | `/api/lab-access` | `{ username, labId, hasAccess: boolean }` | Yes |
| GET | `/api/lab-access?username=` | — | No |

### 8.5 Users

| Method | Route | Auth | Role | CSRF |
|---|---|---|---|---|
| GET | `/api/users` | Yes | admin | No |
| POST | `/api/users` | Yes | admin | Yes |
| PATCH | `/api/users/[id]` | Yes | admin | Yes |

### 8.6 Progress (New)

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/progress` | Yes (student) | Returns student's lab completion + XP totals |

### 8.7 Grading (New)

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/grade/[labId]` | Yes (student) | Triggers automated grading, returns `{ score, tasks, passed }` |

---

## 9. Database Schema

### 9.1 Existing Tables (to be kept)

```sql
-- EXISTING: Users
CREATE TABLE users (
  id          SERIAL PRIMARY KEY,
  username    VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,         -- bcrypt hash
  role        VARCHAR(50)  NOT NULL,         -- 'student' | 'admin'
  fullname    VARCHAR(255),
  is_active   BOOLEAN DEFAULT true
);

-- EXISTING: Lab sessions (SSH credentials per user per lab)
CREATE TABLE lab_sessions (
  id        SERIAL PRIMARY KEY,
  lab_id    VARCHAR(255) NOT NULL,
  app_user  VARCHAR(255) NOT NULL,
  ssh_host  VARCHAR(255) NOT NULL,
  ssh_user  VARCHAR(255) NOT NULL,
  ssh_pass  VARCHAR(255) NOT NULL,
  ssh_port  INTEGER DEFAULT 22,
  UNIQUE(lab_id, app_user)
);

-- EXISTING: Lab access control
CREATE TABLE lab_access (
  id         SERIAL PRIMARY KEY,
  username   VARCHAR(255) NOT NULL,
  lab_id     VARCHAR(255) NOT NULL,
  has_access BOOLEAN DEFAULT true,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(username, lab_id)
);
```

### 9.2 New / Extended Tables

```sql
-- Classes
CREATE TABLE classes (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- Labs (DB-persisted, replaces filesystem)
CREATE TABLE labs (
  id         SERIAL PRIMARY KEY,
  class_id   INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  lab_key    VARCHAR(255) UNIQUE NOT NULL,   -- e.g. '1-1', '1-2'
  title      VARCHAR(255) NOT NULL,
  content    TEXT NOT NULL,                   -- Markdown content
  difficulty VARCHAR(50) DEFAULT 'Intermediate',  -- NEW
  duration   INTEGER DEFAULT 45,              -- NEW: minutes
  xp_points  INTEGER DEFAULT 100,             -- NEW
  status     VARCHAR(20) DEFAULT 'draft',     -- NEW: 'draft' | 'published'
  order_num  INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Class enrollment
CREATE TABLE class_enrollments (
  id          SERIAL PRIMARY KEY,
  username    VARCHAR(255) NOT NULL REFERENCES users(username),
  class_id    INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(username, class_id)
);

-- CSRF tokens
CREATE TABLE csrf_tokens (
  id         SERIAL PRIMARY KEY,
  username   VARCHAR(255) NOT NULL,
  token      VARCHAR(64)  NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  UNIQUE(username)
);

-- Lab completion tracking (NEW — for progress page)
CREATE TABLE lab_completions (
  id           SERIAL PRIMARY KEY,
  username     VARCHAR(255) NOT NULL REFERENCES users(username),
  lab_key      VARCHAR(255) NOT NULL,
  score        INTEGER,
  grade        VARCHAR(5),
  completed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(username, lab_key)
);

-- Notifications (NEW)
CREATE TABLE notifications (
  id         SERIAL PRIMARY KEY,
  username   VARCHAR(255) NOT NULL,
  type       VARCHAR(50) NOT NULL,       -- 'access_granted', 'graded', 'disconnected', etc.
  message    TEXT NOT NULL,
  is_read    BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 10. Security Requirements

| Requirement | Implementation |
|---|---|
| Passwords | bcrypt, min 10 salt rounds, never stored plaintext |
| Sessions | HttpOnly, Secure, SameSite=Strict, 8h expiry |
| CSRF | Token in session + `X-CSRF-Token` header on POST/PUT/PATCH/DELETE |
| Route protection | Next.js Middleware (redirect) + per-route server-side role check |
| Rate limiting | `/api/auth/login`: max 10 attempts per IP per 15 min |
| SSH credentials | AES-256 encrypted at rest in `lab_sessions` table |
| Error messages | Generic — never reveal whether username or password is wrong |
| HTTPS | Enforced in production via Secure cookie flag + Middleware redirect |

---

## 11. Non-Functional Requirements

| Category | Requirement | Target |
|---|---|---|
| Performance | Lab page initial load (Markdown + socket connect) | < 3 seconds |
| Performance | Terminal keystroke-to-echo latency | < 200ms |
| Performance | Admin dashboard data load | < 500ms |
| Availability | Uptime (business hours) | 99.5% |
| Availability | Socket.IO auto-reconnect | Exponential backoff, max 3 attempts |
| Scalability | PostgreSQL pool | `max: 20` connections |
| Accessibility | Form inputs | `<label>` elements, `aria-live` for errors |
| Accessibility | State indicators | Never color-only; always include text label |
| Browser support | Target | Chrome/Edge latest 2, Firefox latest 2, Safari 16+ |
| Mobile | Terminal | Desktop-first; mobile = stacked layout (45vh/45vh) |

---

## 12. Implementation Phases

### Phase 1 — UI Foundation (Week 1–2)
Priority: Apply VN-Labs design system to all existing components.

- [ ] Add Geist + JetBrains Mono + Inter fonts to `layout.tsx`
- [ ] Define Tailwind v4 CSS custom properties for all VN-Labs color tokens
- [ ] Restyle `LoginPage` → match `vn_labs_login_page_states` reference
- [ ] Restyle `Header` → replace with `TopAppBar` component
- [ ] Restyle `DashboardSidebar` → match `vn_labs_admin_dashboard_enhanced` sidebar
- [ ] Restyle `ResizableSplit` → new teal handle with drag indicator pill
- [ ] Restyle `WebTerminal` → full header (macOS dots, session timer, shortcuts, Clear/Fullscreen buttons)
- [ ] Restyle `MarkdownViewer` → dark theme, code blocks with copy button, teal headings

### Phase 2 — Student-Facing Pages (Week 3–4)
- [ ] Build `TopAppBar` with notification bell + avatar dropdown
- [ ] Restyle Student Portal (`/`) → match `vn_labs_student_portal_enhanced` (sidebar + recently accessed + progress bars on lab items)
- [ ] Build `StatusBadge` component (Active/Locked/Done/In Progress variants)
- [ ] Build `LabCard` component (expandable, with lab items)
- [ ] Build Student Progress page (`/progress`) → match `vn_labs_student_progress`
- [ ] Add `/api/progress` endpoint
- [ ] `lab_completions` table migration

### Phase 3 — Admin Dashboard & Access Control (Week 5–6)
- [ ] Restyle Admin Dashboard Overview → match `vn_labs_admin_dashboard_enhanced` (sparklines, sessions table, quick actions)
- [ ] Restyle Manage Student page → match `vn_labs_student_access_control` (toggle switches, side drawer)
- [ ] Build `ToggleSwitch` component
- [ ] Build `UserAvatar` component
- [ ] Add bulk action bar (select + grant/revoke all)

### Phase 4 — Class & Lab Management (Week 7–8)
- [ ] Build Class Detail page (`/dashboard/classes/[id]`) → tabs: Labs, Students, Settings
- [ ] Build reorderable lab list (drag handle)
- [ ] Build Add Lab modal
- [ ] Build Lab Content Editor → split markdown editor + live preview
- [ ] Add `difficulty`, `duration`, `xp_points`, `status` columns to `labs` table migration
- [ ] Wire `Publish` / `Save Draft` to PATCH `/api/labs/[id]`

### Phase 5 — User Management & Settings (Week 9)
- [ ] Restyle User Management page → match `user_management_access_control`
- [ ] Build Create User modal + Edit User drawer
- [ ] Build Danger Zone (reset password, deactivate, delete)
- [ ] Build Platform Settings page (`/dashboard/settings`) → SSH templates table

### Phase 6 — Notification & Grading System (Week 10)
- [ ] Build `Toast` notification system (4 variants, auto-dismiss)
- [ ] Build Notification drawer (bell → panel)
- [ ] Build Grading overlay (in-progress + results states)
- [ ] Add `/api/grade/[labId]` stub endpoint
- [ ] `notifications` table migration
- [ ] Build Empty States and Error Pages (403, 404, 500)

### Phase 7 — Polish & QA (Week 11–12)
- [ ] Mobile responsive: stacked lab layout, drawer sidebar, bottom nav
- [ ] Accessibility audit: aria labels, focus management, color contrast
- [ ] CSRF audit across all mutating routes
- [ ] Performance: SSR where possible, defer xterm.js load
- [ ] Rate limiting on `/api/auth/login`
- [ ] Docker Compose production config

---

## 13. Success Metrics

| Metric | Target | Measurement |
|---|---|---|
| Login success rate | > 98% | API response logs |
| Terminal connect success on lab open | > 95% | Socket.IO event logs |
| Lab page load P95 | < 3 seconds | Browser performance API |
| Admin dashboard P95 | < 1 second | Server-side timing |
| CSRF false positive rate | < 0.1% | API 403 logs |
| Student satisfaction (post-lab survey) | > 4.0/5.0 | Survey tool |
| Admin task completion time (grant access) | < 30 seconds | UX observation |

---

*VN-Labs PRD v2.0 — Ready for Codex Implementation*  
*All UI references correspond to HTML files in `stitch_vn_labs_interactive_devops_portal_V2.zip`*
