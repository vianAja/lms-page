# Product Requirements Document (PRD)
## Interactive Lab Management System (LMS) — Micro-Apps Platform

---

**Document Version:** 1.0  
**Status:** Draft  
**Created:** April 2026  
**Product Manager:** [Name]  
**Tech Stack:** Next.js 16 · React 19 · TypeScript · PostgreSQL · Socket.IO · SSH2 · Tailwind CSS  

---

## Table of Contents

1. [Overview & Vision](#1-overview--vision)
2. [System Architecture](#2-system-architecture)
3. [User Personas & Roles](#3-user-personas--roles)
4. [Micro-App 1 — Login & Student Portal](#4-micro-app-1--login--student-portal)
5. [Micro-App 2 — Interactive Lab Page](#5-micro-app-2--interactive-lab-page)
6. [Micro-App 3 — Admin Dashboard](#6-micro-app-3--admin-dashboard)
7. [Cross-App Security (CSRF + Auth)](#7-cross-app-security-csrf--auth)
8. [API Contract](#8-api-contract)
9. [Database Schema](#9-database-schema)
10. [Non-Functional Requirements](#10-non-functional-requirements)
11. [Out of Scope](#11-out-of-scope)
12. [Milestones & Phasing](#12-milestones--phasing)
13. [Success Metrics](#13-success-metrics)
14. [Open Questions](#14-open-questions)

---

## 1. Overview & Vision

### 1.1 Product Summary

The Interactive Lab Management System (LMS) is a **micro-apps platform** designed to deliver hands-on technical lab experiences to students while giving administrators full control over class creation, lab content, and student access management.

The platform is composed of **three independently deployable micro-apps**, each with a distinct responsibility and user-facing surface, all connected via a shared REST API layer and a common PostgreSQL database.

### 1.2 Problem Statement

Technical training programs face a recurring challenge: learners need access to **real computing environments** to practice commands and complete lab tasks, but provisioning, monitoring, and managing these environments is operationally expensive. This platform solves that by embedding a real SSH-connected web terminal alongside lab instructions — with the admin able to create, assign, and revoke access to any lab at any time.

### 1.3 Core Value Proposition

| Persona | Value |
|---|---|
| **Student** | One-click access to a live terminal inside an instructional lab environment — no local setup required. |
| **Instructor / Admin** | Full visibility into which students have access to which labs; ability to create new classes and labs in Markdown, all from a clean dashboard. |

---

## 2. System Architecture

### 2.1 Micro-App Breakdown

```
┌────────────────────────────────────────────────────────────────┐
│                      LMS Platform                              │
│                                                                │
│  ┌───────────────┐   ┌──────────────────┐   ┌──────────────┐  │
│  │  Micro-App 1  │   │   Micro-App 2    │   │ Micro-App 3  │  │
│  │  Login &      │   │  Interactive Lab  │   │    Admin     │  │
│  │  Student      │──▶│  Page (Terminal  │   │  Dashboard   │  │
│  │  Portal       │   │  + Markdown)     │   │              │  │
│  └──────┬────────┘   └──────┬───────────┘   └──────┬───────┘  │
│         │                   │                       │          │
│         └───────────────────┴───────────────────────┘          │
│                             │                                  │
│                    ┌────────▼────────┐                         │
│                    │   REST API      │                         │
│                    │ (Next.js Routes)│                         │
│                    └────────┬────────┘                         │
│                             │                                  │
│              ┌──────────────┴──────────────┐                  │
│              │       PostgreSQL DB          │                  │
│              │  users · lab_sessions        │                  │
│              │  lab_access · classes · labs │                  │
│              └─────────────────────────────┘                  │
└────────────────────────────────────────────────────────────────┘
```

### 2.2 Communication Flow

- **Auth**: Cookie-based session (`user_session`) set at login; verified via Next.js Middleware on every protected route.
- **Terminal**: Real-time bidirectional via **Socket.IO**, proxied through the custom `server.js` HTTP server. SSH connection is established server-side using the `ssh2` library.
- **Data**: All app-to-database communication happens through Next.js API routes using the shared `pg` (PostgreSQL) pool.
- **Security**: CSRF tokens issued at session creation, validated on all state-mutating API calls. See [Section 7](#7-cross-app-security-csrf--auth).

---

## 3. User Personas & Roles

| Role | Description | Entry Point |
|---|---|---|
| `student` | A learner enrolled in one or more classes. Can view class materials, access assigned labs, and use the interactive terminal. | Login → redirects to `/lab/[id]` |
| `admin` | An instructor or platform manager. Can manage students, create classes and lab content, and monitor access. | Login → redirects to `/dashboard` |

Role is stored in the `users` table and validated both in middleware and per-route server-side checks.

---

## 4. Micro-App 1 — Login & Student Portal

### 4.1 Purpose

The entry point of the platform. Handles authentication, displays the student's profile, and lists all class materials and labs they are enrolled in.

### 4.2 User Stories

| ID | As a… | I want to… | So that… |
|---|---|---|---|
| US-1.1 | Student | Log in with my username and password | I can access my personalized lab environment |
| US-1.2 | Student | See my profile (name, role) after login | I can confirm I'm in the right account |
| US-1.3 | Student | View a list of classes and their associated labs | I can choose which lab to start |
| US-1.4 | Student | Click a lab to open the interactive terminal page | I can begin the lab immediately |
| US-1.5 | Student | Log out securely | My session is terminated and my data is protected |
| US-1.6 | Admin | Log in and be redirected to the admin dashboard | I can manage the platform |

### 4.3 Functional Requirements

#### 4.3.1 Login Page (`/login`)

- Username and password form.
- On submit: POST to `/api/auth/login` with JSON body `{ username, password }`.
- On success: server sets `user_session` cookie (HttpOnly, Secure, SameSite=Strict) containing `{ id, username, fullname, role }` and a `csrf_token`.
- On failure: display inline error message (do not reveal whether username or password is incorrect — use generic message).
- If user is already logged in and visits `/login`, redirect based on role:
  - `student` → `/` (portal/home)
  - `admin` → `/dashboard`
- **CSRF**: Login form must include a CSRF token fetched from `/api/csrf` before form render.

#### 4.3.2 Student Home / Portal (`/`)

> This is the "Login Page with profile and class material" referenced in requirements.

- Protected route: redirect to `/login` if no session.
- Display **Profile Card**:
  - Full name
  - Username
  - Role badge
  - Avatar initials component
- Display **Class Material List**:
  - Fetched from `/api/classes` filtered by the logged-in user's enrolled classes.
  - Each class shows: Class name, description, and an expandable list of labs.
  - Each lab item shows: Lab ID, lab title, and a "Start Lab" button.
  - Labs the student does **not** have access to are shown as locked (greyed-out, no button).
- Clicking "Start Lab" navigates to `/lab/[labId]`.
- **Header** component with logout button (calls `/api/auth/logout`, clears cookie, redirects to `/login`).

#### 4.3.3 Existing Code Notes

The current codebase (`src/app/login/page.tsx`) implements the login form as a client component using `useState` and `fetch`. The student portal page (`/`) currently redirects directly to `/lab/1-1` — this needs to be expanded into a full portal page as described above.

### 4.4 Wireframe Description

```
┌──────────────────────────────────────────────────────┐
│  HEADER: [Logo]            [Username] [Logout]        │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────┐   ┌──────────────────────────────┐ │
│  │ PROFILE CARD │   │  CLASS MATERIALS              │ │
│  │ [Avatar]     │   │  ┌────────────────────────┐   │ │
│  │ Full Name    │   │  │ 📂 Class 1: Intro Linux │   │ │
│  │ @username    │   │  │   ▸ Lab 1.1  [Start]    │   │ │
│  │ Role: Student│   │  │   ▸ Lab 1.2  [Start]    │   │ │
│  └──────────────┘   │  │   ▸ Lab 1.3  [🔒 Locked]│   │ │
│                     │  └────────────────────────┘   │ │
│                     │  ┌────────────────────────┐   │ │
│                     │  │ 📂 Class 2: Networking  │   │ │
│                     │  │   ▸ Lab 2.1  [Start]    │   │ │
│                     │  └────────────────────────┘   │ │
│                     └──────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

---

## 5. Micro-App 2 — Interactive Lab Page

### 5.1 Purpose

The core learning environment. Opened when a student clicks a lab from the portal. Displays the lab's Markdown instructions alongside a live, interactive SSH-connected web terminal — in a resizable split-pane layout.

### 5.2 User Stories

| ID | As a… | I want to… | So that… |
|---|---|---|---|
| US-2.1 | Student | See the lab instructions in a readable format | I know exactly what tasks to complete |
| US-2.2 | Student | Type commands into a real terminal | I can complete the lab tasks hands-on |
| US-2.3 | Student | Resize the instruction and terminal panels | I can adjust to my screen size |
| US-2.4 | Student | See the terminal connected automatically on page load | I don't need to configure anything manually |
| US-2.5 | Student | See an error message if my terminal can't connect | I understand what went wrong |
| US-2.6 | Student | Navigate back to the portal | I can switch to another lab |

### 5.3 Functional Requirements

#### 5.3.1 Route: `/lab/[id]`

- Protected route: redirect to `/login` if no session.
- Access check: if the student does not have `has_access = true` in `lab_access` for this `lab_id`, show an "Access Denied" screen with a "Back to Portal" button.
- On load:
  1. Fetch lab Markdown content from `/api/lab/[id]` (reads from `/page/lab[id].md`).
  2. Initiate Socket.IO connection.
  3. Emit `init-ssh` event with `{ labId, appUser: session.username }`.
  4. On `ssh-ready`: render the xterm.js terminal, fully interactive.
  5. On `ssh-error`: display an inline error banner with the error message.

#### 5.3.2 Layout: Resizable Split Pane

- Two panels side by side (desktop default):
  - **Left panel**: Markdown Viewer (renders lab instructions via `react-markdown` with `@tailwindcss/typography`)
  - **Right panel**: Web Terminal (xterm.js with `@xterm/addon-fit`)
- Panels are resizable via a draggable divider (implemented in `ResizableSplit.tsx`).
- On mobile/narrow screens: panels stack vertically (terminal below instructions).

#### 5.3.3 Terminal Requirements

- Powered by xterm.js + Socket.IO.
- SSH connection is established server-side (`server.js`) and proxied via sockets.
- The terminal must:
  - Auto-fit to the panel dimensions on load and on resize.
  - Support standard terminal input/output (ANSI escape codes, etc.).
  - Reconnect or show a "Reconnecting..." state if the socket drops.
  - Terminate the SSH session cleanly on page leave (`disconnect` event).

#### 5.3.4 Markdown Viewer Requirements

- Render standard Markdown headings, lists, code blocks (with syntax styling), bold, italic, and inline code.
- Code blocks should be visually distinct (monospace font, background highlight).
- Scrollable independently of the terminal panel.

#### 5.3.5 Existing Code Notes

`WebTerminal.tsx`, `MarkdownViewer.tsx`, and `ResizableSplit.tsx` are already implemented in the codebase. The `server.js` SSH proxy is functional. The primary gap is the access-check guard and portal navigation.

---

## 6. Micro-App 3 — Admin Dashboard

### 6.1 Purpose

A management console for administrators to monitor student access, manage class and lab content, and create new classes/labs with Markdown-formatted content. Visual design reference: [https://divans-dashboard.webflow.io/](https://divans-dashboard.webflow.io/).

### 6.2 User Stories

| ID | As an… | I want to… | So that… |
|---|---|---|---|
| US-3.1 | Admin | See an overview of total classes, labs, and active students | I have a quick pulse on platform usage |
| US-3.2 | Admin | View a list of all students and their lab access status | I can see who is and isn't authorized |
| US-3.3 | Admin | Toggle a student's lab access on/off | I can quickly authorize or restrict a student |
| US-3.4 | Admin | Create a new class with a name and description | I can organize lab content into logical groups |
| US-3.5 | Admin | Add labs to a class with Markdown content | I can author lab instructions directly in the platform |
| US-3.6 | Admin | Edit existing lab Markdown content | I can update lab material without touching the filesystem |
| US-3.7 | Admin | Delete a class or a lab | I can clean up outdated content |
| US-3.8 | Admin | View all user accounts | I can audit who has access to the platform |
| US-3.9 | Admin | Create or deactivate user accounts | I can manage student enrollment at the user level |

### 6.3 Functional Requirements

#### 6.3.1 Layout

- Protected by role check: only `admin` role may access `/dashboard/**`. Enforced in both middleware (`middleware.ts`) and `DashboardLayout`.
- **Sidebar navigation** (existing `layout.tsx` as base):
  - Overview (home)
  - Manage Students (`/dashboard/manage-student`)
  - Class & Lab Management (`/dashboard/classes`) — *new*
  - User Management (`/dashboard/users`)
- **Top Header** with admin profile, platform name.
- **Main content area** for each sub-page.

#### 6.3.2 Overview Page (`/dashboard`)

Display summary cards (stat tiles):

| Card | Data Source |
|---|---|
| Total Students | `SELECT COUNT(*) FROM users WHERE role='student'` |
| Total Classes | `SELECT COUNT(*) FROM classes` |
| Total Labs | `SELECT COUNT(*) FROM labs` |
| Active Lab Sessions | `SELECT COUNT(*) FROM lab_sessions` |

A recent activity table showing the last 10 access changes (who, which lab, granted/revoked, timestamp).

Design reference: Clean card-based stat layout inspired by [https://divans-dashboard.webflow.io/](https://divans-dashboard.webflow.io/) — white cards on a light grey background, blue accent color `#2D9CDB`, green for positive metrics `#27AE60`.

#### 6.3.3 Manage Students Page (`/dashboard/manage-student`)

Extends the existing implementation:

- Display all students with their full name and username.
- For each student, show all labs (across all classes) and their current access toggle.
- Currently limited to `lab_id = '1-1'` — this must be expanded to show all labs dynamically.
- Toggling access calls a server action that updates `lab_access` table.
- **Add access CSRF token** to the form submission (see [Section 7](#7-cross-app-security-csrf--auth)).
- Filter bar: search by student name or username.

#### 6.3.4 Class & Lab Management Page (`/dashboard/classes`) — *New Feature*

**Class List View:**
- Table or card grid of all classes.
- Columns: Class Name, Description, Lab Count, Created Date, Actions (Edit, Delete).
- "Create New Class" button opens a modal/slide-over form.

**Create / Edit Class Form:**
- Fields: `name` (text, required), `description` (textarea, optional).
- On save: POST/PATCH to `/api/classes`.
- CSRF token included.

**Class Detail View (`/dashboard/classes/[classId]`):**
- Shows class metadata and a list of its labs.
- "Add Lab" button opens the lab editor.
- Lab rows: Lab ID, title, last updated, Actions (Edit, Delete).

**Lab Editor (Modal or Dedicated Page):**
- Fields:
  - `title` (text, required)
  - `order` (number, for ordering within the class)
  - `content` (Markdown editor — rich textarea with live preview split view)
- The Markdown editor should provide a live preview pane using the same `MarkdownViewer` component used in Micro-App 2.
- On save: POST/PATCH to `/api/labs`. Content is persisted in the `labs` table (not just the filesystem).
- CSRF token included.

#### 6.3.5 User Management Page (`/dashboard/users`)

Extends existing implementation:

- Table of all users with columns: Username, Full Name, Role, Status (Active/Inactive), Actions.
- "Create User" button: modal form with fields `username`, `fullname`, `password`, `role`.
- Password must be hashed server-side (bcrypt) before storage — never stored in plaintext.
- "Deactivate" (soft-delete): sets `is_active = false` on the user record.
- CSRF token on all mutating forms.

---

## 7. Cross-App Security (CSRF + Auth)

### 7.1 Session Strategy

The platform uses **cookie-based sessions** with the following attributes:

| Attribute | Value |
|---|---|
| Name | `user_session` |
| Storage | JSON-serialized `{ id, username, fullname, role, csrf_token }` |
| HttpOnly | `true` — not accessible from JavaScript |
| Secure | `true` in production |
| SameSite | `Strict` |
| Path | `/` |
| Expiry | 8 hours (rolling) |

### 7.2 CSRF Token Implementation

Because the three micro-apps share one domain (or communicate via cross-origin API calls), CSRF protection is mandatory on all state-mutating requests.

#### Token Generation

On login success, a random CSRF token is generated server-side:

```typescript
import { randomBytes } from 'crypto';
const csrfToken = randomBytes(32).toString('hex');
```

This token is embedded in the session cookie AND returned in the login response body for client-side storage.

#### Token Storage (Client)

The CSRF token is stored in:
- A **meta tag** on each server-rendered page: `<meta name="csrf-token" content="..." />`
- A **non-HttpOnly cookie** (`csrf_token`) that JavaScript can read to send in headers.

#### Token Validation (Server)

A shared middleware validates the CSRF token on all `POST`, `PUT`, `PATCH`, and `DELETE` API routes:

```typescript
// src/lib/csrf.ts
export function validateCsrf(request: Request, session: Session): boolean {
  const headerToken = request.headers.get('X-CSRF-Token');
  return headerToken === session.csrf_token;
}
```

Any request missing or having a mismatched CSRF token returns `403 Forbidden`.

#### Client-Side Usage

All fetch calls from Micro-App 1 (Portal) and Micro-App 3 (Dashboard) must include:

```typescript
headers: {
  'Content-Type': 'application/json',
  'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? ''
}
```

Next.js Server Actions (used in `manage-student/page.tsx`) must validate the CSRF token by extracting it from the session cookie within the action.

### 7.3 Route Protection Summary

| Route | Auth Required | Role Required | CSRF Required |
|---|---|---|---|
| `/login` | No | — | Yes (login form) |
| `/` (portal) | Yes | `student` or `admin` | — |
| `/lab/[id]` | Yes | `student` | — |
| `/dashboard/**` | Yes | `admin` | — |
| `POST /api/auth/login` | No | — | Yes |
| `POST /api/auth/logout` | Yes | Any | Yes |
| `GET /api/classes` | Yes | Any | No |
| `POST /api/classes` | Yes | `admin` | Yes |
| `PATCH /api/classes/[id]` | Yes | `admin` | Yes |
| `DELETE /api/classes/[id]` | Yes | `admin` | Yes |
| `GET /api/labs/[id]` | Yes | Any | No |
| `POST /api/labs` | Yes | `admin` | Yes |
| `PATCH /api/labs/[id]` | Yes | `admin` | Yes |
| `DELETE /api/labs/[id]` | Yes | `admin` | Yes |
| `GET /api/users` | Yes | `admin` | No |
| `POST /api/users` | Yes | `admin` | Yes |
| `PATCH /api/users/[id]` | Yes | `admin` | Yes |
| `POST /api/lab-access` | Yes | `admin` | Yes |
| `GET /api/csrf` | Yes | Any | No |

---

## 8. API Contract

All API routes are under `/api/`. All requests/responses use `Content-Type: application/json`. State-mutating requests require `X-CSRF-Token` header.

### 8.1 Auth

**POST `/api/auth/login`**

Request body:
```json
{ "username": "string", "password": "string" }
```
Response (200):
```json
{ "ok": true, "csrf_token": "hex_string", "role": "student|admin" }
```
Response (401):
```json
{ "message": "Invalid credentials" }
```

**POST `/api/auth/logout`**  
No body. Clears `user_session` cookie. Returns `{ "ok": true }`.

**GET `/api/csrf`**  
Returns a CSRF token for pre-authenticated forms (e.g., login form itself):
```json
{ "csrf_token": "hex_string" }
```

### 8.2 Classes

**GET `/api/classes`** — list all classes (student sees only enrolled; admin sees all)  
**POST `/api/classes`** — create a class  
**PATCH `/api/classes/[id]`** — update class metadata  
**DELETE `/api/classes/[id]`** — delete a class and all its labs  

### 8.3 Labs

**GET `/api/lab/[id]`** — returns `{ content: "markdown string", title: "string" }` (existing route, to be extended)  
**POST `/api/labs`** — create a lab under a class  
**PATCH `/api/labs/[id]`** — update lab content or metadata  
**DELETE `/api/labs/[id]`** — delete a lab  

### 8.4 Lab Access

**POST `/api/lab-access`** — grant or revoke access  
Request body:
```json
{ "username": "string", "labId": "string", "hasAccess": true }
```

### 8.5 Users

**GET `/api/users`** — list all users (admin only)  
**POST `/api/users`** — create a user (admin only)  
**PATCH `/api/users/[id]`** — update user details or deactivate (admin only)  

---

## 9. Database Schema

### 9.1 Existing Tables (from `seed.js`)

```sql
-- Users
CREATE TABLE users (
  id          SERIAL PRIMARY KEY,
  username    VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,         -- bcrypt hash
  role        VARCHAR(50)  NOT NULL,         -- 'student' | 'admin'
  fullname    VARCHAR(255),
  is_active   BOOLEAN DEFAULT true           -- NEW: for soft-delete
);

-- SSH lab session mapping (per user per lab)
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

-- Lab access control
CREATE TABLE lab_access (
  id         SERIAL PRIMARY KEY,
  username   VARCHAR(255) NOT NULL,
  lab_id     VARCHAR(255) NOT NULL,
  has_access BOOLEAN DEFAULT true,
  UNIQUE(username, lab_id)
);
```

### 9.2 New Tables Required

```sql
-- Classes
CREATE TABLE classes (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- Labs (database-persisted, replaces filesystem-only approach)
CREATE TABLE labs (
  id         SERIAL PRIMARY KEY,
  class_id   INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  lab_key    VARCHAR(255) UNIQUE NOT NULL,   -- e.g. '1-1', '1-2'
  title      VARCHAR(255) NOT NULL,
  content    TEXT NOT NULL,                   -- Markdown content
  order_num  INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Class enrollment (which students are in which class)
CREATE TABLE class_enrollments (
  id         SERIAL PRIMARY KEY,
  username   VARCHAR(255) NOT NULL REFERENCES users(username),
  class_id   INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(username, class_id)
);

-- CSRF tokens (server-side store for additional security)
CREATE TABLE csrf_tokens (
  id         SERIAL PRIMARY KEY,
  username   VARCHAR(255) NOT NULL,
  token      VARCHAR(64)  NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  UNIQUE(username)
);
```

### 9.3 ERD Summary

```
users ──< class_enrollments >── classes ──< labs
  │                                           │
  └──< lab_access >── (lab_key links to labs.lab_key)
  │
  └──< lab_sessions
```

---

## 10. Non-Functional Requirements

### 10.1 Security

- All passwords stored as bcrypt hashes (minimum 10 salt rounds).
- Sessions expire after 8 hours of inactivity.
- CSRF tokens rotate on each login.
- SSH credentials stored in the database must be encrypted at rest (AES-256) — not stored as plaintext.
- All API routes validate `role` server-side; middleware is a secondary guard, not the primary one.
- Rate limiting on `/api/auth/login`: max 10 attempts per IP per 15 minutes.
- HTTPS enforced in production (Secure cookie flag).

### 10.2 Performance

- Lab page initial load (Markdown render + socket connection) should complete in < 3 seconds on a standard connection.
- Terminal latency (keystroke to echo): < 200ms on the same network as the SSH host.
- Dashboard data queries should return in < 500ms.

### 10.3 Availability

- Uptime target: 99.5% during business hours (8 AM – 10 PM local time).
- Socket.IO connection must auto-reconnect with exponential backoff (max 3 attempts).

### 10.4 Scalability

- The PostgreSQL pool (`pg.Pool`) should be configured with `max: 20` connections.
- The Socket.IO server (`server.js`) should support horizontal scaling via Redis adapter if concurrent sessions exceed 100.

### 10.5 Accessibility

- Login form: all inputs have associated `<label>` elements.
- Error messages are announced via `aria-live` regions.
- Dashboard tables include `<caption>` and proper `scope` attributes on headers.
- Color is never the sole indicator of state (e.g., access toggles include text labels).

### 10.6 Browser Support

- Chrome/Edge (latest 2 versions), Firefox (latest 2 versions), Safari 16+.
- xterm.js terminal is desktop-first; mobile is read-only/view-only for the terminal.

---

## 11. Out of Scope

The following are explicitly excluded from this version:

- Real-time collaboration (multiple students in the same terminal).
- Lab grading or automated assessment.
- File upload/download from within the terminal UI.
- Email notifications (e.g., for access changes).
- OAuth / SSO (Google, GitHub) login.
- Multi-tenant (multiple organizations) support.
- Mobile-first terminal interaction (xterm.js is desktop-only in v1).

---

## 12. Milestones & Phasing

### Phase 1 — Foundation (Weeks 1–2)

- [ ] Database schema migration (add `classes`, `labs`, `class_enrollments`, `csrf_tokens` tables).
- [ ] CSRF token generation and validation middleware.
- [ ] `/api/csrf` endpoint.
- [ ] Add `is_active` column to `users`.
- [ ] Update login flow to include CSRF token in cookie and response.

### Phase 2 — Micro-App 1 Completion (Weeks 3–4)

- [ ] Build Student Portal page (`/`): profile card + class material list.
- [ ] `/api/classes` endpoint (with enrollment filter for students).
- [ ] Access lock UI for labs the student cannot access.
- [ ] End-to-end login → portal → lab navigation.

### Phase 3 — Micro-App 2 Polish (Week 5)

- [ ] Add access guard to `/lab/[id]` (check `lab_access` table).
- [ ] Auto-reconnect logic for Socket.IO.
- [ ] Mobile-responsive stacked layout.
- [ ] "Back to Portal" navigation.

### Phase 4 — Micro-App 3 Dashboard (Weeks 6–8)

- [ ] Overview page with stat cards and recent activity table.
- [ ] Expand Manage Students to show all labs dynamically.
- [ ] Class & Lab Management CRUD pages.
- [ ] Markdown editor with live preview for lab content authoring.
- [ ] User Management CRUD with soft-delete.
- [ ] All forms wired with CSRF headers.

### Phase 5 — Hardening & QA (Weeks 9–10)

- [ ] Rate limiting on login endpoint.
- [ ] SSH credential encryption at rest.
- [ ] Cross-app CSRF validation audit.
- [ ] Performance testing (lab page load, terminal latency).
- [ ] Accessibility audit.
- [ ] Docker Compose final configuration for production.

---

## 13. Success Metrics

| Metric | Target | Measurement Method |
|---|---|---|
| Login success rate | > 98% | API response logs |
| Terminal connection success on lab open | > 95% | Socket.IO event logs |
| Lab page load time (P95) | < 3 seconds | Browser performance API |
| Admin dashboard load time (P95) | < 1 second | Server-side timing headers |
| CSRF block rate (false positives) | < 0.1% | API 403 error logs |
| Student satisfaction (lab experience) | > 4.0/5.0 | Post-lab survey |

---

## 14. Open Questions

| # | Question | Owner | Priority |
|---|---|---|---|
| OQ-1 | Should SSH credentials be managed per-lab or per-user-per-lab? Currently it's per-user-per-lab — is there a shared lab environment model needed? | PM + Backend | High |
| OQ-2 | Should lab content persist in the database, the filesystem, or both? Currently it's filesystem only (`/page/*.md`). Database is recommended for admin editability. | PM + Backend | High |
| OQ-3 | Is there a need for student-to-student isolation at the SSH level (separate Linux users per student)? | PM + Infra | Medium |
| OQ-4 | What is the expected maximum number of concurrent students in a lab session? This affects Socket.IO + SSH server sizing. | PM + Infra | Medium |
| OQ-5 | Should the admin be able to enroll students into classes from the dashboard, or is this handled externally? | PM | Medium |
| OQ-6 | Is there a need for lab progress tracking (e.g., "Lab 1.1: Completed")? | PM + Product | Low |
| OQ-7 | What is the deployment target — self-hosted Docker, cloud VM, or managed PaaS? This affects the `docker-compose.yml` configuration. | PM + Infra | High |

---

*End of Document — PRD v1.0*

---
> **Review Cycle**: This PRD should be reviewed and signed off by the tech lead and relevant stakeholders before Phase 1 begins. Any changes to scope, schema, or API contracts after Phase 1 kickoff require a formal change request.
