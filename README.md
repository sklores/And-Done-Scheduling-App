# Shift — GCDC Employee Scheduling App

A clean, minimal employee scheduling app for GCDC. Built as a proof of concept with Express + Vercel serverless functions + Supabase.

## Stack

- **Frontend:** Vanilla HTML/CSS/JS (no framework)
- **Server:** Express (`index.js`) serving `/public` static files
- **API:** Vercel serverless functions in `/api`
- **Database:** Supabase (Postgres), service role only — no RLS, no auth tables
- **SMS:** Twilio
- **Fonts:** IBM Plex Mono + IBM Plex Sans

## File Structure

```
/
├── index.js               # Express server (local dev)
├── package.json
├── vercel.json            # Vercel routing config
├── api/
│   ├── _supabase.js       # Shared Supabase client (service role)
│   ├── _auth.js           # Auth middleware helpers
│   ├── owner-login.js     # POST /api/owner-login
│   ├── employee-login.js  # POST /api/employee-login (PIN → JWT)
│   ├── employees.js       # GET, POST /api/employees
│   ├── employees/
│   │   └── [id].js        # PATCH, DELETE /api/employees/:id
│   ├── shifts.js          # GET, POST /api/shifts
│   ├── shifts/
│   │   └── [id].js        # DELETE /api/shifts/:id
│   ├── send-schedule.js   # POST /api/send-schedule (Twilio)
│   ├── employee-schedule.js # GET /api/employee-schedule
│   └── weekly-notes.js    # GET, POST /api/weekly-notes
└── public/
    ├── landing.html        # Entry point — choose portal
    ├── index.html          # Manager scheduling UI
    └── employee.html       # Employee portal (PIN login)
```

## Supabase Setup

Run the following SQL in your Supabase project's SQL editor:

```sql
-- Employees table
CREATE TABLE employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  hourly_rate numeric DEFAULT 0,
  employee_code text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  phone text,
  color text,
  created_at timestamptz DEFAULT now()
);

-- Shifts table
CREATE TABLE shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  start_ts timestamptz NOT NULL,
  end_ts timestamptz NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Weekly notes table
CREATE TABLE weekly_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start date UNIQUE NOT NULL,
  notes text
);

-- Owner settings table
CREATE TABLE owner_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tip_pool numeric DEFAULT 0,
  payroll_tax_rate numeric DEFAULT 0.08,
  created_at timestamptz DEFAULT now()
);

-- Insert default owner settings row
INSERT INTO owner_settings (tip_pool, payroll_tax_rate) VALUES (0, 0.08);
```

> **No RLS policies needed.** All database access is via service role in serverless functions only. Never expose the service role key to the client.

## Environment Variables

Set these in Vercel (or your `.env` file for local dev):

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (keep secret!) |
| `MANAGER_PASSWORD` | Shared password for manager login |
| `OWNER_PASSWORD` | Separate password for owner access |
| `EMPLOYEE_PORTAL_SECRET` | Secret for signing employee JWT tokens (random string, min 32 chars) |
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_FROM_NUMBER` | Twilio phone number (e.g. `+14155550100`) |

## Auth Model

| Role | Auth Method | Storage |
|---|---|---|
| Manager | `MANAGER_PASSWORD` env var — passed as `Authorization: Bearer <password>` | `sessionStorage` |
| Owner | `OWNER_PASSWORD` env var — same pattern | `sessionStorage` |
| Employee | 4-digit PIN → serverless returns signed JWT | `sessionStorage` |

All auth is validated server-side on every API call. No Supabase auth, no cookies.

## API Endpoints

### Auth
- `POST /api/owner-login` — `{ password }` → validates against `OWNER_PASSWORD`
- `POST /api/employee-login` — `{ code }` → returns `{ token, employeeName }`

### Employees (requires manager auth header)
- `GET /api/employees` — returns all active employees
- `POST /api/employees` — `{ name, role, hourly_rate, employee_code, phone, color }`
- `PATCH /api/employees/:id` — update fields
- `DELETE /api/employees/:id` — soft delete (sets `is_active = false`)

### Shifts (requires manager auth header)
- `GET /api/shifts?week_start=YYYY-MM-DD` — returns shifts for that week with employee data
- `POST /api/shifts` — `{ employee_id, start_ts, end_ts, notes }`
- `DELETE /api/shifts/:id` — hard delete

### Schedule SMS (requires manager auth header)
- `POST /api/send-schedule` — `{ messages: [{ to, body }], fromWeekStart }` → sends via Twilio

### Employee Portal (requires employee JWT)
- `GET /api/employee-schedule?week_start=YYYY-MM-DD` — returns employee's own shifts only (no payroll data)

### Notes (requires manager auth header)
- `GET /api/weekly-notes?week_start=YYYY-MM-DD`
- `POST /api/weekly-notes` — `{ week_start, notes }`

## Local Development

```bash
npm install
# Set env vars in .env file or export them
node index.js
# App runs at http://localhost:3000
```

For full serverless function support locally:
```bash
npm install -g vercel
vercel dev
```

## Deploy to Vercel

```bash
vercel --prod
```

Set all environment variables in the Vercel dashboard under **Settings → Environment Variables**.

## Pages

| URL | Description |
|---|---|
| `/` or `/landing.html` | Entry point — choose Manager or Employee |
| `/manager` or `/index.html` | Manager scheduling UI (password protected) |
| `/employee` or `/employee.html` | Employee portal (PIN protected) |

## Role Colors

| Role | Color |
|---|---|
| Manager | Blue `#1e4db7` |
| Server | Purple `#6b3fa0` |
| Cook | Red `#a83228` |
| Cashier | Green `#2d7a3a` |
| Host | Olive `#6b6b2a` |
| Barista | Teal `#1a7a7a` |

## Design System

- **Background:** `#f5f3ee` (cream)
- **Surface:** `#ffffff`
- **Border:** `#d9d5cc`
- **Text:** `#1a1916`
- **Accent:** `#c84b2f` (red-orange)
- **Green:** `#2d5a27`
- **Header:** `#1a1916` (near-black)
- **Border radius:** `3px`
- **Grid row height:** `84px` (CSS variable `--rowH`, zero JS layout)
