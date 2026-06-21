-- ============================================================
-- TaskFlow — Migration v2
-- Sales ownership on projects, client portal comments,
-- role-scoped RLS, and secure portal RPCs (anon).
-- Safe to run on an existing database (idempotent).
-- ============================================================

-- ─── (A) Sales ownership on projects ───────────────────────
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS sales_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_sales_id ON projects(sales_id);

-- ─── (B) Allow client (portal) comments ────────────────────
-- Portal clients have no profile, so author_id / author_role must be nullable.
ALTER TABLE comments ALTER COLUMN author_id   DROP NOT NULL;
ALTER TABLE comments ALTER COLUMN author_role DROP NOT NULL;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_client BOOLEAN NOT NULL DEFAULT FALSE;

-- ─── (C) Role-scoped RLS for internal users ────────────────
-- Projects: sales sees only their own; everyone else sees all.
DROP POLICY IF EXISTS "projects_select" ON projects;
CREATE POLICY "projects_select" ON projects FOR SELECT TO authenticated
  USING (get_my_role() <> 'sales' OR sales_id = auth.uid());

-- Tasks: sales sees only tasks of their projects; everyone else sees all.
DROP POLICY IF EXISTS "tasks_select_auth" ON tasks;
CREATE POLICY "tasks_select_auth" ON tasks FOR SELECT TO authenticated
  USING (
    get_my_role() <> 'sales'
    OR project_id IN (SELECT id FROM projects WHERE sales_id = auth.uid())
  );

-- Tasks: only admin/PM can create.
DROP POLICY IF EXISTS "tasks_insert" ON tasks;
CREATE POLICY "tasks_insert" ON tasks FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('super_admin','project_manager'));

-- Tasks: sales can no longer update; team + assignee can.
DROP POLICY IF EXISTS "tasks_update" ON tasks;
CREATE POLICY "tasks_update" ON tasks FOR UPDATE TO authenticated
  USING (get_my_role() IN ('super_admin','project_manager','developer','tester')
    OR assigned_to = auth.uid());

-- Clients: sales can no longer create/update.
DROP POLICY IF EXISTS "clients_internal_insert" ON clients;
CREATE POLICY "clients_internal_insert" ON clients FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('super_admin','project_manager'));
DROP POLICY IF EXISTS "clients_internal_update" ON clients;
CREATE POLICY "clients_internal_update" ON clients FOR UPDATE TO authenticated
  USING (get_my_role() IN ('super_admin','project_manager'));

-- ─── (D) Lock down anonymous access (was USING TRUE = leak) ─
DROP POLICY IF EXISTS "clients_anon_portal"     ON clients;
DROP POLICY IF EXISTS "tasks_anon_select"       ON tasks;
DROP POLICY IF EXISTS "comments_select_anon_pub" ON comments;
DROP POLICY IF EXISTS "attachments_select_anon" ON attachments;
DROP POLICY IF EXISTS "history_anon"            ON task_history;

-- ─── (D) Secure portal RPCs (SECURITY DEFINER, token-scoped) ─
CREATE OR REPLACE FUNCTION portal_get_client(p_token TEXT)
RETURNS TABLE (id UUID, company_name TEXT, contact_person TEXT, status client_status)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.company_name, c.contact_person, c.status
  FROM clients c
  WHERE c.portal_token::text = p_token;
$$;

CREATE OR REPLACE FUNCTION portal_get_projects(p_token TEXT)
RETURNS SETOF projects
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.*
  FROM projects p
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
RETURNS TABLE (
  id UUID, content TEXT, author_name TEXT, is_client BOOLEAN, created_at TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT cm.id, cm.content, cm.author_name, cm.is_client, cm.created_at
  FROM comments cm
  JOIN tasks t   ON t.id = cm.task_id
  JOIN clients c ON c.id = t.client_id
  WHERE c.portal_token::text = p_token
    AND cm.task_id = p_task
    AND cm.is_internal = FALSE
  ORDER BY cm.created_at ASC;
$$;

CREATE OR REPLACE FUNCTION portal_add_comment(
  p_token TEXT, p_task UUID, p_content TEXT, p_author TEXT
)
RETURNS TABLE (
  id UUID, content TEXT, author_name TEXT, is_client BOOLEAN, created_at TIMESTAMPTZ
)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_client UUID;
BEGIN
  -- Ensure the task belongs to the client owning this token.
  SELECT c.id INTO v_client
  FROM tasks t
  JOIN clients c ON c.id = t.client_id
  WHERE t.id = p_task AND c.portal_token::text = p_token;

  IF v_client IS NULL THEN
    RAISE EXCEPTION 'Invalid token or task';
  END IF;

  IF p_content IS NULL OR length(btrim(p_content)) = 0 THEN
    RAISE EXCEPTION 'Empty comment';
  END IF;

  RETURN QUERY
  INSERT INTO comments (task_id, content, is_internal, is_client, author_name)
  VALUES (p_task, btrim(p_content), FALSE, TRUE,
          COALESCE(NULLIF(btrim(p_author), ''), 'Client'))
  RETURNING comments.id, comments.content, comments.author_name,
            comments.is_client, comments.created_at;
END;
$$;

GRANT EXECUTE ON FUNCTION portal_get_client(TEXT)               TO anon;
GRANT EXECUTE ON FUNCTION portal_get_projects(TEXT)             TO anon;
GRANT EXECUTE ON FUNCTION portal_get_tasks(TEXT)                TO anon;
GRANT EXECUTE ON FUNCTION portal_get_comments(TEXT, UUID)       TO anon;
GRANT EXECUTE ON FUNCTION portal_add_comment(TEXT, UUID, TEXT, TEXT) TO anon;

-- ─── (E) Remove broken/dead history trigger function ───────
-- Referenced a non-existent tasks.updated_by column and was never attached.
-- History is recorded from the application layer instead.
DROP FUNCTION IF EXISTS record_task_history() CASCADE;
