-- ============================================================
-- TaskFlow — Supabase PostgreSQL Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── ENUMS ─────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM (
  'super_admin', 'project_manager', 'sales', 'developer', 'tester'
);

CREATE TYPE client_status AS ENUM ('active', 'inactive', 'prospect');

CREATE TYPE project_status AS ENUM ('active', 'on_hold', 'completed', 'cancelled');

CREATE TYPE task_type AS ENUM (
  'bug', 'feature', 'enhancement', 'support',
  'integration', 'database', 'ui_ux', 'infrastructure'
);

CREATE TYPE priority AS ENUM ('critical', 'high', 'medium', 'low');

CREATE TYPE task_status AS ENUM (
  'new', 'under_review', 'approved', 'assigned', 'in_progress',
  'development_completed', 'testing', 'waiting_client_feedback',
  'completed', 'rejected', 'cancelled'
);

CREATE TYPE notification_type AS ENUM (
  'task_assigned', 'status_changed', 'task_completed', 'comment_added'
);

-- ─── PROFILES ──────────────────────────────────────────────
-- Extends auth.users
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  role        user_role NOT NULL DEFAULT 'developer',
  avatar_url  TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'developer')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── CLIENTS ───────────────────────────────────────────────
CREATE TABLE clients (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name    TEXT NOT NULL,
  contact_person  TEXT NOT NULL,
  phone           TEXT,
  email           TEXT,
  status          client_status NOT NULL DEFAULT 'active',
  notes           TEXT,
  portal_token    UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
  created_by      UUID NOT NULL REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── PROJECTS ──────────────────────────────────────────────
CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  description TEXT,
  status      project_status NOT NULL DEFAULT 'active',
  sales_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_by  UUID NOT NULL REFERENCES profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── TASK NUMBER SEQUENCE ───────────────────────────────────
CREATE SEQUENCE task_number_seq START 1001;

-- ─── TASKS ─────────────────────────────────────────────────
CREATE TABLE tasks (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_number         INTEGER NOT NULL DEFAULT nextval('task_number_seq') UNIQUE,
  title               TEXT NOT NULL,
  description         TEXT,
  client_id           UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_id          UUID REFERENCES projects(id) ON DELETE SET NULL,
  type                task_type NOT NULL,
  priority            priority NOT NULL DEFAULT 'medium',
  status              task_status NOT NULL DEFAULT 'new',
  assigned_to         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_by          UUID NOT NULL REFERENCES profiles(id),
  estimated_hours     NUMERIC(6,2),
  actual_hours        NUMERIC(6,2),
  due_date            DATE,
  completion_date     DATE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── ATTACHMENTS ───────────────────────────────────────────
CREATE TABLE attachments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id      UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  file_name    TEXT NOT NULL,
  file_url     TEXT NOT NULL,
  file_size    BIGINT,
  file_type    TEXT,
  uploaded_by  UUID NOT NULL REFERENCES profiles(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── COMMENTS ──────────────────────────────────────────────
CREATE TABLE comments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id      UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  is_internal  BOOLEAN NOT NULL DEFAULT FALSE,
  is_client    BOOLEAN NOT NULL DEFAULT FALSE,
  -- author_id / author_role are NULL for portal client comments (no profile)
  author_id    UUID REFERENCES profiles(id),
  author_name  TEXT NOT NULL,
  author_role  user_role,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── TASK HISTORY ──────────────────────────────────────────
CREATE TABLE task_history (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id          UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  field_changed    TEXT NOT NULL,
  old_value        TEXT,
  new_value        TEXT,
  changed_by       UUID NOT NULL REFERENCES profiles(id),
  changed_by_name  TEXT NOT NULL,
  changed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── NOTIFICATIONS ─────────────────────────────────────────
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        notification_type NOT NULL,
  message     TEXT NOT NULL,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  task_id     UUID REFERENCES tasks(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── INDEXES ───────────────────────────────────────────────
CREATE INDEX idx_tasks_client_id    ON tasks(client_id);
CREATE INDEX idx_tasks_project_id   ON tasks(project_id);
CREATE INDEX idx_tasks_assigned_to  ON tasks(assigned_to);
CREATE INDEX idx_tasks_status       ON tasks(status);
CREATE INDEX idx_tasks_priority     ON tasks(priority);
CREATE INDEX idx_tasks_created_by   ON tasks(created_by);
CREATE INDEX idx_projects_sales_id  ON projects(sales_id);
CREATE INDEX idx_comments_task_id   ON comments(task_id);
CREATE INDEX idx_history_task_id    ON task_history(task_id);
CREATE INDEX idx_notifs_user_id     ON notifications(user_id);
CREATE INDEX idx_notifs_is_read     ON notifications(user_id, is_read);
CREATE INDEX idx_attachments_task   ON attachments(task_id);

-- ─── UPDATED_AT TRIGGER ────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── TASK HISTORY ──────────────────────────────────────────
-- Task history is recorded from the application layer (see stores/tasks.ts)
-- to capture the acting user reliably.

-- ─── ROW LEVEL SECURITY ────────────────────────────────────
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients       ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects      ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_history  ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper: get current user role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

-- Profiles: users see all profiles (needed for dropdowns), manage own
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_admin_all" ON profiles FOR ALL TO authenticated
  USING (get_my_role() = 'super_admin');

-- Clients: internal roles only
CREATE POLICY "clients_internal_select" ON clients FOR SELECT TO authenticated
  USING (get_my_role() IN ('super_admin','project_manager','sales','developer','tester'));
CREATE POLICY "clients_internal_insert" ON clients FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('super_admin','project_manager'));
CREATE POLICY "clients_internal_update" ON clients FOR UPDATE TO authenticated
  USING (get_my_role() IN ('super_admin','project_manager'));
CREATE POLICY "clients_admin_delete" ON clients FOR DELETE TO authenticated
  USING (get_my_role() = 'super_admin');

-- Client portal access is served exclusively through SECURITY DEFINER RPCs
-- (portal_get_*), so no broad anon SELECT policy is granted here.

-- Projects: sales sees only their own; everyone else sees all
CREATE POLICY "projects_select" ON projects FOR SELECT TO authenticated
  USING (get_my_role() <> 'sales' OR sales_id = auth.uid());
CREATE POLICY "projects_insert" ON projects FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('super_admin','project_manager'));
CREATE POLICY "projects_update" ON projects FOR UPDATE TO authenticated
  USING (get_my_role() IN ('super_admin','project_manager'));
CREATE POLICY "projects_delete" ON projects FOR DELETE TO authenticated
  USING (get_my_role() = 'super_admin');

-- Tasks: sales sees only tasks of their projects; everyone else sees all
CREATE POLICY "tasks_select_auth" ON tasks FOR SELECT TO authenticated
  USING (
    get_my_role() <> 'sales'
    OR project_id IN (SELECT id FROM projects WHERE sales_id = auth.uid())
  );
CREATE POLICY "tasks_insert" ON tasks FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('super_admin','project_manager'));
CREATE POLICY "tasks_update" ON tasks FOR UPDATE TO authenticated
  USING (get_my_role() IN ('super_admin','project_manager','developer','tester')
    OR assigned_to = auth.uid());
CREATE POLICY "tasks_delete" ON tasks FOR DELETE TO authenticated
  USING (get_my_role() = 'super_admin');

-- Comments (anon reads/writes public comments via portal RPCs only)
CREATE POLICY "comments_select_auth"     ON comments FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "comments_insert"          ON comments FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid());
CREATE POLICY "comments_delete_own"      ON comments FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR get_my_role() IN ('super_admin','project_manager'));

-- Attachments
CREATE POLICY "attachments_select_auth" ON attachments FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "attachments_insert"      ON attachments FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid());
CREATE POLICY "attachments_delete"      ON attachments FOR DELETE TO authenticated
  USING (uploaded_by = auth.uid() OR get_my_role() = 'super_admin');

-- Task History
CREATE POLICY "history_select" ON task_history FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "history_insert" ON task_history FOR INSERT TO authenticated WITH CHECK (TRUE);

-- ─── PORTAL RPCs (anon, token-scoped, SECURITY DEFINER) ────
CREATE OR REPLACE FUNCTION portal_get_client(p_token TEXT)
RETURNS TABLE (id UUID, company_name TEXT, contact_person TEXT, status client_status)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.company_name, c.contact_person, c.status
  FROM clients c WHERE c.portal_token::text = p_token;
$$;

CREATE OR REPLACE FUNCTION portal_get_projects(p_token TEXT)
RETURNS SETOF projects
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.* FROM projects p
  JOIN clients c ON c.id = p.client_id
  WHERE c.portal_token::text = p_token
  ORDER BY p.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION portal_get_tasks(p_token TEXT)
RETURNS TABLE (
  id UUID, task_number INTEGER, title TEXT, description TEXT,
  project_id UUID, project_name TEXT, status task_status, priority priority,
  due_date DATE, completion_date DATE, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.id, t.task_number, t.title, t.description,
         t.project_id, pr.name AS project_name, t.status, t.priority,
         t.due_date, t.completion_date, t.created_at, t.updated_at
  FROM tasks t
  JOIN clients c ON c.id = t.client_id
  LEFT JOIN projects pr ON pr.id = t.project_id
  WHERE c.portal_token::text = p_token
  ORDER BY t.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION portal_get_comments(p_token TEXT, p_task UUID)
RETURNS TABLE (id UUID, content TEXT, author_name TEXT, is_client BOOLEAN, created_at TIMESTAMPTZ)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT cm.id, cm.content, cm.author_name, cm.is_client, cm.created_at
  FROM comments cm
  JOIN tasks t   ON t.id = cm.task_id
  JOIN clients c ON c.id = t.client_id
  WHERE c.portal_token::text = p_token AND cm.task_id = p_task AND cm.is_internal = FALSE
  ORDER BY cm.created_at ASC;
$$;

CREATE OR REPLACE FUNCTION portal_add_comment(p_token TEXT, p_task UUID, p_content TEXT, p_author TEXT)
RETURNS TABLE (id UUID, content TEXT, author_name TEXT, is_client BOOLEAN, created_at TIMESTAMPTZ)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_client UUID;
BEGIN
  SELECT c.id INTO v_client
  FROM tasks t JOIN clients c ON c.id = t.client_id
  WHERE t.id = p_task AND c.portal_token::text = p_token;

  IF v_client IS NULL THEN RAISE EXCEPTION 'Invalid token or task'; END IF;
  IF p_content IS NULL OR length(btrim(p_content)) = 0 THEN RAISE EXCEPTION 'Empty comment'; END IF;

  RETURN QUERY
  INSERT INTO comments (task_id, content, is_internal, is_client, author_name)
  VALUES (p_task, btrim(p_content), FALSE, TRUE, COALESCE(NULLIF(btrim(p_author), ''), 'Client'))
  RETURNING comments.id, comments.content, comments.author_name, comments.is_client, comments.created_at;
END;
$$;

GRANT EXECUTE ON FUNCTION portal_get_client(TEXT)               TO anon;
GRANT EXECUTE ON FUNCTION portal_get_projects(TEXT)             TO anon;
GRANT EXECUTE ON FUNCTION portal_get_tasks(TEXT)                TO anon;
GRANT EXECUTE ON FUNCTION portal_get_comments(TEXT, UUID)       TO anon;
GRANT EXECUTE ON FUNCTION portal_add_comment(TEXT, UUID, TEXT, TEXT) TO anon;

-- Notifications
CREATE POLICY "notifs_select" ON notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "notifs_update" ON notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "notifs_insert" ON notifications FOR INSERT TO authenticated WITH CHECK (TRUE);

-- ─── STORAGE BUCKET ────────────────────────────────────────
-- Run in Supabase Dashboard > Storage:
-- Create bucket: "task-attachments" (public: false)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('task-attachments', 'task-attachments', false);
