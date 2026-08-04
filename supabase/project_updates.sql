-- ============================================================
-- Project quick updates — lightweight notes on a project
-- (no task required). Run this once in the Supabase SQL editor.
-- ============================================================

CREATE TABLE IF NOT EXISTS project_updates (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  author_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_updates_project
  ON project_updates(project_id, created_at DESC);

ALTER TABLE project_updates ENABLE ROW LEVEL SECURITY;

-- Internal roles can read updates
CREATE POLICY "project_updates_select" ON project_updates FOR SELECT TO authenticated
  USING (get_my_role() IN ('super_admin','project_manager','sales','developer','tester'));

-- Authenticated users post as themselves
CREATE POLICY "project_updates_insert" ON project_updates FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid());

-- Authors can delete their own updates; admins / PMs can delete any
CREATE POLICY "project_updates_delete" ON project_updates FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR get_my_role() IN ('super_admin','project_manager'));
