-- 02_functions_triggers.sql: PostgreSQL Functions, Triggers & Sequences

-- Sequence for project numbers
CREATE SEQUENCE IF NOT EXISTS public.project_number_seq START 1;

-- Trigger function to auto-generate PRJ-#####
CREATE OR REPLACE FUNCTION public.set_project_number()
RETURNS trigger AS $$
BEGIN
  IF new.project_number IS NULL THEN
    new.project_number := 'PRJ-' || lpad(nextval('public.project_number_seq')::text, 5, '0');
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER before_project_insert
  BEFORE INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_project_number();


-- Sequence for change request numbers
CREATE SEQUENCE IF NOT EXISTS public.cr_number_seq START 1;

-- Trigger function to auto-generate CR-#####
CREATE OR REPLACE FUNCTION public.set_cr_number()
RETURNS trigger AS $$
BEGIN
  IF new.cr_number IS NULL THEN
    new.cr_number := 'CR-' || lpad(nextval('public.cr_number_seq')::text, 5, '0');
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER before_cr_insert
  BEFORE INSERT ON public.change_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_cr_number();


-- Trigger function to sync profiles with auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, department)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'team_member'),
    coalesce(new.raw_user_meta_data->>'department', 'IT')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Trigger function to auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_milestones_updated_at BEFORE UPDATE ON public.milestones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_risks_updated_at BEFORE UPDATE ON public.risks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_change_requests_updated_at BEFORE UPDATE ON public.change_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- Trigger function to roll up budget entries actual spend to project actual_spend
CREATE OR REPLACE FUNCTION public.recompute_project_actual_spend()
RETURNS trigger AS $$
DECLARE
  p_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    p_id := old.project_id;
  ELSE
    p_id := new.project_id;
  END IF;

  UPDATE public.projects
  SET actual_spend = coalesce((
    SELECT sum(amount)
    FROM public.budget_entries
    WHERE project_id = p_id
  ), 0)
  WHERE id = p_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER budget_entry_change_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.budget_entries
  FOR EACH ROW EXECUTE FUNCTION public.recompute_project_actual_spend();


-- Trigger function to auto-update milestones to Overdue
CREATE OR REPLACE FUNCTION public.check_milestone_overdue()
RETURNS trigger AS $$
BEGIN
  IF new.due_date < CURRENT_DATE AND new.status <> 'Completed' THEN
    new.status := 'Overdue';
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER before_milestone_insert_update
  BEFORE INSERT OR UPDATE ON public.milestones
  FOR EACH ROW EXECUTE FUNCTION public.check_milestone_overdue();


-- Helper function auth_role() to read caller role
CREATE OR REPLACE FUNCTION public.auth_role()
RETURNS text AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = auth.uid();
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
