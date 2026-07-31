-- 03_policies.sql: Row-Level Security (RLS) Policies

-- Helper to check if a project is accessible to the current user
CREATE OR REPLACE FUNCTION public.is_project_accessible(p_id UUID)
RETURNS boolean AS $$
BEGIN
  -- PMO Admins have access to everything
  IF public.auth_role() = 'pmo_admin' THEN
    RETURN true;
  END IF;

  -- Project Managers have access to projects they manage, created, or are stakeholders in
  IF public.auth_role() = 'project_manager' THEN
    RETURN EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = p_id AND (p.project_manager_id = auth.uid() OR p.created_by = auth.uid())
    ) OR EXISTS (
      SELECT 1 FROM public.stakeholders s
      WHERE s.project_id = p_id AND s.user_id = auth.uid()
    );
  END IF;

  -- Team Members and Stakeholders have access to projects they are stakeholders in
  RETURN EXISTS (
    SELECT 1 FROM public.stakeholders s
    WHERE s.project_id = p_id AND s.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Helper to check if a project is writable by the current user
CREATE OR REPLACE FUNCTION public.is_project_writable(p_id UUID)
RETURNS boolean AS $$
BEGIN
  -- PMO Admins can modify everything
  IF public.auth_role() = 'pmo_admin' THEN
    RETURN true;
  END IF;

  -- Project Managers can modify projects they manage or created
  IF public.auth_role() = 'project_manager' THEN
    RETURN EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = p_id AND (p.project_manager_id = auth.uid() OR p.created_by = auth.uid())
    );
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =========================================================================
-- PROFILES POLICIES
-- =========================================================================
CREATE POLICY "Allow authenticated read of profiles" ON public.profiles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow users to update own profile, or PMO Admin to update any" ON public.profiles
    FOR UPDATE TO authenticated 
    USING (auth.uid() = id OR public.auth_role() = 'pmo_admin')
    WITH CHECK (auth.uid() = id OR public.auth_role() = 'pmo_admin');

CREATE POLICY "Allow PMO Admin to delete profile" ON public.profiles
    FOR DELETE TO authenticated USING (public.auth_role() = 'pmo_admin');


-- =========================================================================
-- PROJECTS POLICIES
-- =========================================================================
CREATE POLICY "Select projects based on accessibility" ON public.projects
    FOR SELECT TO authenticated USING (
        public.auth_role() = 'pmo_admin' 
        OR project_manager_id = auth.uid() 
        OR created_by = auth.uid() 
        OR EXISTS (SELECT 1 FROM public.stakeholders s WHERE s.project_id = id AND s.user_id = auth.uid())
    );

CREATE POLICY "Insert projects for admins and managers" ON public.projects
    FOR INSERT TO authenticated WITH CHECK (public.auth_role() IN ('pmo_admin', 'project_manager'));

CREATE POLICY "Update projects for admins and owners" ON public.projects
    FOR UPDATE TO authenticated USING (
        public.auth_role() = 'pmo_admin' 
        OR project_manager_id = auth.uid() 
        OR created_by = auth.uid()
    );

CREATE POLICY "Delete projects for PMO Admin only" ON public.projects
    FOR DELETE TO authenticated USING (public.auth_role() = 'pmo_admin');


-- =========================================================================
-- MILESTONES POLICIES
-- =========================================================================
CREATE POLICY "Select milestones on accessible projects" ON public.milestones
    FOR SELECT TO authenticated USING (public.is_project_accessible(project_id));

CREATE POLICY "Insert milestones on writable projects" ON public.milestones
    FOR INSERT TO authenticated WITH CHECK (public.is_project_writable(project_id));

CREATE POLICY "Update milestones" ON public.milestones
    FOR UPDATE TO authenticated USING (
        public.is_project_writable(project_id) 
        OR (public.auth_role() = 'team_member' AND owner_id = auth.uid())
    );

CREATE POLICY "Delete milestones on writable projects" ON public.milestones
    FOR DELETE TO authenticated USING (public.is_project_writable(project_id));


-- =========================================================================
-- RISKS POLICIES
-- =========================================================================
CREATE POLICY "Select risks on accessible projects" ON public.risks
    FOR SELECT TO authenticated USING (public.is_project_accessible(project_id));

CREATE POLICY "Insert risks on writable projects" ON public.risks
    FOR INSERT TO authenticated WITH CHECK (public.is_project_writable(project_id));

CREATE POLICY "Update risks on writable projects" ON public.risks
    FOR UPDATE TO authenticated USING (public.is_project_writable(project_id));

CREATE POLICY "Delete risks on writable projects" ON public.risks
    FOR DELETE TO authenticated USING (public.is_project_writable(project_id));


-- =========================================================================
-- BUDGET ENTRIES POLICIES
-- =========================================================================
CREATE POLICY "Select budget entries on accessible projects" ON public.budget_entries
    FOR SELECT TO authenticated USING (public.is_project_accessible(project_id));

CREATE POLICY "Insert budget entries on writable projects" ON public.budget_entries
    FOR INSERT TO authenticated WITH CHECK (public.is_project_writable(project_id));

CREATE POLICY "Update budget entries on writable projects" ON public.budget_entries
    FOR UPDATE TO authenticated USING (public.is_project_writable(project_id));

CREATE POLICY "Delete budget entries on writable projects" ON public.budget_entries
    FOR DELETE TO authenticated USING (public.is_project_writable(project_id));


-- =========================================================================
-- STAKEHOLDERS POLICIES
-- =========================================================================
CREATE POLICY "Select stakeholders on accessible projects" ON public.stakeholders
    FOR SELECT TO authenticated USING (public.is_project_accessible(project_id));

CREATE POLICY "Insert stakeholders on writable projects" ON public.stakeholders
    FOR INSERT TO authenticated WITH CHECK (public.is_project_writable(project_id));

CREATE POLICY "Update stakeholders on writable projects" ON public.stakeholders
    FOR UPDATE TO authenticated USING (public.is_project_writable(project_id));

CREATE POLICY "Delete stakeholders - PMO Admin only" ON public.stakeholders
    FOR DELETE TO authenticated USING (public.auth_role() = 'pmo_admin');


-- =========================================================================
-- CHANGE REQUESTS POLICIES
-- =========================================================================
CREATE POLICY "Select change requests on accessible projects" ON public.change_requests
    FOR SELECT TO authenticated USING (public.is_project_accessible(project_id));

-- Anyone with access to the project can submit a CR
CREATE POLICY "Insert change requests on accessible projects" ON public.change_requests
    FOR INSERT TO authenticated WITH CHECK (public.is_project_accessible(project_id));

-- PMs and Admins can update/review CRs
CREATE POLICY "Update change requests on writable projects" ON public.change_requests
    FOR UPDATE TO authenticated USING (public.is_project_writable(project_id));

CREATE POLICY "Delete change requests - PMO Admin only" ON public.change_requests
    FOR DELETE TO authenticated USING (public.auth_role() = 'pmo_admin');


-- =========================================================================
-- PROJECT EVENTS POLICIES
-- =========================================================================
CREATE POLICY "Select project events on accessible projects" ON public.project_events
    FOR SELECT TO authenticated USING (public.is_project_accessible(project_id));

CREATE POLICY "Insert project events on accessible projects" ON public.project_events
    FOR INSERT TO authenticated WITH CHECK (public.is_project_accessible(project_id));
