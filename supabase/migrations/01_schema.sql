-- 01_schema.sql: Define Core PPM Tables

-- Create profiles table linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    role TEXT CHECK (role IN ('pmo_admin', 'project_manager', 'team_member', 'stakeholder')),
    department TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS) on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_number TEXT UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK (type IN ('Infrastructure', 'Software', 'Security', 'Compliance', 'Migration', 'Other')),
    phase TEXT CHECK (phase IN ('Initiation', 'Planning', 'Execution', 'Monitoring', 'Closure')),
    health_status TEXT CHECK (health_status IN ('On Track', 'At Risk', 'Off Track', 'Completed', 'On Hold', 'Archived')),
    priority TEXT CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    sponsor TEXT,
    project_manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    planned_budget NUMERIC(15,2) NOT NULL,
    actual_spend NUMERIC(15,2) DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create milestones table
CREATE TABLE IF NOT EXISTS public.milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Overdue')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

-- Create risks table
CREATE TABLE IF NOT EXISTS public.risks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT CHECK (category IN ('Technical', 'Financial', 'Resource', 'Schedule', 'Compliance', 'Vendor', 'Other')),
    probability INTEGER CHECK (probability BETWEEN 1 AND 5),
    impact INTEGER CHECK (impact BETWEEN 1 AND 5),
    risk_score INTEGER GENERATED ALWAYS AS (probability * impact) STORED,
    severity TEXT GENERATED ALWAYS AS (
        CASE 
            WHEN (probability * impact) <= 4 THEN 'Low'
            WHEN (probability * impact) <= 9 THEN 'Medium'
            WHEN (probability * impact) <= 16 THEN 'High'
            ELSE 'Critical'
        END
    ) STORED,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    mitigation_plan TEXT,
    status TEXT CHECK (status IN ('Open', 'Mitigating', 'Closed', 'Accepted')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.risks ENABLE ROW LEVEL SECURITY;

-- Create budget entries table
CREATE TABLE IF NOT EXISTS public.budget_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    category TEXT CHECK (category IN ('Hardware', 'Software', 'Labor', 'Consulting', 'Training', 'Infrastructure', 'Other')),
    description TEXT,
    amount NUMERIC(15,2) NOT NULL,
    entry_date DATE NOT NULL,
    logged_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.budget_entries ENABLE ROW LEVEL SECURITY;

-- Create stakeholders table
CREATE TABLE IF NOT EXISTS public.stakeholders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    raci_role TEXT CHECK (raci_role IN ('Responsible', 'Accountable', 'Consulted', 'Informed')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(project_id, user_id)
);

ALTER TABLE public.stakeholders ENABLE ROW LEVEL SECURITY;

-- Create change requests table
CREATE TABLE IF NOT EXISTS public.change_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    cr_number TEXT UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    change_type TEXT CHECK (change_type IN ('Scope', 'Budget', 'Timeline', 'Resource', 'Other')),
    impact_summary TEXT,
    requested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT CHECK (status IN ('Submitted', 'Under Review', 'Approved', 'Rejected')),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.change_requests ENABLE ROW LEVEL SECURITY;

-- Create project events table (Audit Trail)
CREATE TABLE IF NOT EXISTS public.project_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    event_type TEXT,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.project_events ENABLE ROW LEVEL SECURITY;
