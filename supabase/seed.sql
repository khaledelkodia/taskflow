-- ============================================================
-- TaskFlow — Seed Data (Demo)
-- ============================================================
-- Run AFTER schema.sql
-- Create auth users first via Supabase Dashboard or Auth API,
-- then reference their UUIDs below.

-- ─── DEMO PROFILES (replace UUIDs with real auth.users IDs) ─
-- These are inserted by the trigger automatically on user signup.
-- Manually patch roles here if needed:
-- UPDATE profiles SET role = 'super_admin' WHERE email = 'admin@taskflow.io';
-- UPDATE profiles SET role = 'project_manager' WHERE email = 'pm@taskflow.io';
-- UPDATE profiles SET role = 'developer' WHERE email = 'dev@taskflow.io';
-- UPDATE profiles SET role = 'sales' WHERE email = 'sales@taskflow.io';
-- UPDATE profiles SET role = 'tester' WHERE email = 'tester@taskflow.io';

-- For demo purposes with a known admin UUID:
-- Replace 'ADMIN_UUID' with the actual UUID from auth.users

DO $$
DECLARE
  admin_id    UUID;
  pm_id       UUID;
  dev_id      UUID;
  sales_id    UUID;
  tester_id   UUID;
  client1_id  UUID := uuid_generate_v4();
  client2_id  UUID := uuid_generate_v4();
  client3_id  UUID := uuid_generate_v4();
  proj1_id    UUID := uuid_generate_v4();
  proj2_id    UUID := uuid_generate_v4();
  proj3_id    UUID := uuid_generate_v4();
  task1_id    UUID := uuid_generate_v4();
  task2_id    UUID := uuid_generate_v4();
  task3_id    UUID := uuid_generate_v4();
  task4_id    UUID := uuid_generate_v4();
  task5_id    UUID := uuid_generate_v4();
BEGIN
  -- Get first super_admin (must exist)
  SELECT id INTO admin_id FROM profiles WHERE role = 'super_admin' LIMIT 1;
  SELECT id INTO pm_id    FROM profiles WHERE role = 'project_manager' LIMIT 1;
  SELECT id INTO dev_id   FROM profiles WHERE role = 'developer' LIMIT 1;
  SELECT id INTO sales_id FROM profiles WHERE role = 'sales' LIMIT 1;
  SELECT id INTO tester_id FROM profiles WHERE role = 'tester' LIMIT 1;

  IF admin_id IS NULL THEN
    RAISE NOTICE 'No admin user found. Seed skipped. Create users first.';
    RETURN;
  END IF;

  -- ─── CLIENTS ─────────────────────────────────────────────
  INSERT INTO clients (id, company_name, contact_person, phone, email, status, notes, created_by) VALUES
    (client1_id, 'Nexus Technologies',  'Ahmed Al-Rashid',   '+966 50 123 4567', 'ahmed@nexustech.sa',   'active',   'Key enterprise client. Prefers weekly status calls.',    COALESCE(sales_id, admin_id)),
    (client2_id, 'Orbit Digital',       'Sarah Johnson',      '+1 415 987 6543',  'sarah@orbitdigital.com','active',  'Fast-growing startup. Agile team, very responsive.',      COALESCE(sales_id, admin_id)),
    (client3_id, 'Gulf Ventures LLC',   'Mohammed Al-Khalil', '+971 55 888 0011', 'mkhalil@gulfventures.ae','prospect','Under evaluation phase. Potential long-term contract.',  COALESCE(sales_id, admin_id));

  -- ─── PROJECTS ────────────────────────────────────────────
  INSERT INTO projects (id, name, client_id, description, status, created_by) VALUES
    (proj1_id, 'ERP Integration Phase 1',    client1_id, 'Full ERP system integration with existing SAP infrastructure.',   'active',    COALESCE(pm_id, admin_id)),
    (proj2_id, 'Mobile App — Customer Portal', client2_id, 'Cross-platform mobile app for end customers to track orders.', 'active',    COALESCE(pm_id, admin_id)),
    (proj3_id, 'Website Redesign 2025',      client1_id, 'Complete redesign of corporate website with new brand identity.', 'on_hold',   COALESCE(pm_id, admin_id));

  -- ─── TASKS ───────────────────────────────────────────────
  INSERT INTO tasks (id, title, description, client_id, project_id, type, priority, status, assigned_to, created_by, estimated_hours, actual_hours, due_date) VALUES
    (task1_id,
     'Fix payment gateway timeout on checkout',
     'Users are experiencing 30s timeouts when processing payments via Stripe. Occurs under high load. Needs investigation and fix.',
     client1_id, proj1_id, 'bug', 'critical', 'in_progress',
     COALESCE(dev_id, admin_id), COALESCE(pm_id, admin_id),
     8, 3.5, NOW() + INTERVAL '2 days'),

    (task2_id,
     'Add dashboard analytics module',
     'Build a comprehensive analytics dashboard showing KPIs, revenue trends, and user activity metrics.',
     client2_id, proj2_id, 'feature', 'high', 'assigned',
     COALESCE(dev_id, admin_id), COALESCE(pm_id, admin_id),
     40, NULL, NOW() + INTERVAL '14 days'),

    (task3_id,
     'Database query optimization for reports',
     'Monthly report generation is taking over 45 seconds. Identify slow queries and add proper indexes.',
     client1_id, proj1_id, 'database', 'high', 'testing',
     COALESCE(dev_id, admin_id), COALESCE(pm_id, admin_id),
     12, 11, NOW() + INTERVAL '1 day'),

    (task4_id,
     'Redesign user onboarding flow',
     'Current onboarding has 60% drop-off rate. Redesign to be more intuitive with progressive disclosure.',
     client2_id, proj2_id, 'ui_ux', 'medium', 'waiting_client_feedback',
     NULL, COALESCE(pm_id, admin_id),
     20, 22, NOW() - INTERVAL '2 days'),

    (task5_id,
     'Setup CI/CD pipeline for production',
     'Configure GitHub Actions for automated testing, building, and deployment to AWS ECS.',
     client1_id, proj1_id, 'infrastructure', 'medium', 'completed',
     COALESCE(dev_id, admin_id), COALESCE(pm_id, admin_id),
     16, 14, NOW() - INTERVAL '7 days');

  -- ─── COMMENTS ────────────────────────────────────────────
  INSERT INTO comments (task_id, content, is_internal, author_id, author_name, author_role) VALUES
    (task1_id, 'Initial investigation shows the issue is in the Stripe webhook handler. Adding retry logic.', TRUE,  COALESCE(dev_id, admin_id),   'Alex Developer',   'developer'),
    (task1_id, 'We are actively working on this issue. Expected fix by end of week.',                        FALSE, COALESCE(pm_id, admin_id),    'Sarah PM',          'project_manager'),
    (task3_id, 'Profiling shows N+1 queries in the report aggregation. Adding CTEs and composite indexes.', TRUE,  COALESCE(dev_id, admin_id),   'Alex Developer',   'developer'),
    (task3_id, 'Testing completed successfully. All reports now load under 2 seconds.',                     TRUE,  COALESCE(tester_id, admin_id),'Tom Tester',        'tester'),
    (task4_id, 'Client has reviewed the new designs. Awaiting formal approval from stakeholders.',          FALSE, COALESCE(pm_id, admin_id),    'Sarah PM',          'project_manager');

  -- ─── HISTORY ─────────────────────────────────────────────
  INSERT INTO task_history (task_id, field_changed, old_value, new_value, changed_by, changed_by_name) VALUES
    (task1_id, 'status',   'new',       'assigned',    COALESCE(pm_id, admin_id), 'Sarah PM'),
    (task1_id, 'status',   'assigned',  'in_progress', COALESCE(dev_id, admin_id),'Alex Developer'),
    (task1_id, 'priority', 'high',      'critical',    COALESCE(pm_id, admin_id), 'Sarah PM'),
    (task3_id, 'status',   'new',       'in_progress', COALESCE(dev_id, admin_id),'Alex Developer'),
    (task3_id, 'status',   'in_progress','development_completed', COALESCE(dev_id, admin_id),'Alex Developer'),
    (task3_id, 'status',   'development_completed','testing', COALESCE(pm_id, admin_id),'Sarah PM'),
    (task5_id, 'status',   'new',       'completed',   COALESCE(dev_id, admin_id),'Alex Developer');

END $$;
