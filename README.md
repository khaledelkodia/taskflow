# TaskFlow

Enterprise-grade SaaS task and project management platform built for software teams and their clients.

## Tech Stack
- **Framework**: Nuxt 4, Vue 3
- **State Management**: Pinia
- **Styling**: TailwindCSS
- **Backend & Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (JWT + RLS)
- **Storage**: Supabase Storage

## Setup Instructions

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and fill in your Supabase credentials:
   ```bash
   SUPABASE_URL="your-project-url"
   SUPABASE_KEY="your-anon-key"
   ```

3. **Database Setup**:
   Execute the files in `supabase/` in your Supabase SQL Editor:
   - Run `schema.sql` to create all tables, enums, triggers, and RLS policies.
   - Run `seed.sql` to inject demo data (optional).

4. **Storage Setup**:
   In Supabase Dashboard, create a new bucket named `task-attachments` and set it to **Private** (RLS enabled).

5. **Run the application locally**:
   ```bash
   npm run dev
   ```

## Key Features
- **Role-based Access**: Super Admin, Project Manager, Sales, Developer, Tester.
- **Client Portal**: Anonymous portal access via unique secure tokens (no login required).
- **Task Workflow**: Advanced state machine with enforced transitions and history tracking.
- **Dual Comment System**: Internal team discussions vs. Public client communications.
- **Enterprise Dashboard**: KPI tracking, Chart.js visualizations, and dynamic filtering.
