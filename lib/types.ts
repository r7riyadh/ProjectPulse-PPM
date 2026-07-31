// Types for ProjectPulse

export type UserRole = 'pmo_admin' | 'project_manager' | 'team_member' | 'stakeholder';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  department: string;
  created_at: string;
  updated_at: string;
}

export type ProjectType = 'Infrastructure' | 'Software' | 'Security' | 'Compliance' | 'Migration' | 'Other';
export type ProjectPhase = 'Initiation' | 'Planning' | 'Execution' | 'Monitoring' | 'Closure';
export type ProjectHealth = 'On Track' | 'At Risk' | 'Off Track' | 'Completed' | 'On Hold' | 'Archived';
export type ProjectPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Project {
  id: string;
  project_number: string;
  name: string;
  description: string | null;
  type: ProjectType;
  phase: ProjectPhase;
  health_status: ProjectHealth;
  priority: ProjectPriority;
  sponsor: string | null;
  project_manager_id: string | null;
  planned_budget: number;
  actual_spend: number;
  start_date: string;
  end_date: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  project_manager?: Profile;
}

export type MilestoneStatus = 'Pending' | 'In Progress' | 'Completed' | 'Overdue';

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  due_date: string;
  owner_id: string | null;
  status: MilestoneStatus;
  created_at: string;
  updated_at: string;
  owner?: Profile;
}

export type RiskCategory = 'Technical' | 'Financial' | 'Resource' | 'Schedule' | 'Compliance' | 'Vendor' | 'Other';
export type RiskSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type RiskStatus = 'Open' | 'Mitigating' | 'Closed' | 'Accepted';

export interface Risk {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  category: RiskCategory;
  probability: number;
  impact: number;
  risk_score: number;
  severity: RiskSeverity;
  owner_id: string | null;
  mitigation_plan: string | null;
  status: RiskStatus;
  created_at: string;
  updated_at: string;
  owner?: Profile;
}

export type BudgetCategory = 'Hardware' | 'Software' | 'Labor' | 'Consulting' | 'Training' | 'Infrastructure' | 'Other';

export interface BudgetEntry {
  id: string;
  project_id: string;
  category: BudgetCategory;
  description: string | null;
  amount: number;
  entry_date: string;
  logged_by: string | null;
  created_at: string;
  logger?: Profile;
}

export type RACIRole = 'Responsible' | 'Accountable' | 'Consulted' | 'Informed';

export interface Stakeholder {
  id: string;
  project_id: string;
  user_id: string;
  raci_role: RACIRole;
  notes: string | null;
  created_at: string;
  profile?: Profile;
}

export type CRChangeType = 'Scope' | 'Budget' | 'Timeline' | 'Resource' | 'Other';
export type CRStatus = 'Submitted' | 'Under Review' | 'Approved' | 'Rejected';

export interface ChangeRequest {
  id: string;
  project_id: string;
  cr_number: string;
  title: string;
  description: string;
  change_type: CRChangeType;
  impact_summary: string | null;
  requested_by: string | null;
  reviewed_by: string | null;
  status: CRStatus;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  requester?: Profile;
  reviewer?: Profile;
}

export interface ProjectEvent {
  id: string;
  project_id: string;
  actor_id: string | null;
  event_type: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
  actor?: Profile;
}
