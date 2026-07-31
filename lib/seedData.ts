import { createClient } from '@supabase/supabase-js'

export async function resetAndSeedDatabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase URL or Service Role Key environment variables are missing.')
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  console.log('Starting database reset & seeding...')

  // 1. Clean up existing demo users from auth
  const { data: usersData, error: listUsersError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 100
  })

  if (listUsersError) {
    throw new Error(`Failed to list users: ${listUsersError.message}`)
  }

  const demoEmails = [
    'admin@projectpulse.demo',
    'pm@projectpulse.demo',
    'member@projectpulse.demo',
    'stakeholder@projectpulse.demo'
  ]

  const demoUsersToDelete = usersData.users.filter(u => demoEmails.includes(u.email || ''))
  for (const u of demoUsersToDelete) {
    console.log(`Deleting existing demo user: ${u.email}`)
    await supabase.auth.admin.deleteUser(u.id)
  }

  // 2. Clean up projects (which cascades to milestones, risks, budgets, stakeholders, CRs, events)
  console.log('Truncating tables...')
  const { error: truncateError } = await supabase.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (truncateError) {
    throw new Error(`Failed to truncate projects: ${truncateError.message}`)
  }

  // Also truncate profiles directly (just in case there are orphaned non-auth profiles)
  await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  // 3. Create the 4 demo users in auth.users
  console.log('Creating demo users...')
  const roles = [
    { email: 'admin@projectpulse.demo', full_name: 'PMO Admin User', role: 'pmo_admin', department: 'PMO' },
    { email: 'pm@projectpulse.demo', full_name: 'Project Manager User', role: 'project_manager', department: 'Enterprise PMO' },
    { email: 'member@projectpulse.demo', full_name: 'Team Member User', role: 'team_member', department: 'Software Engineering' },
    { email: 'stakeholder@projectpulse.demo', full_name: 'Stakeholder User', role: 'stakeholder', department: 'Executive Board' }
  ]

  const createdProfiles: Record<string, any> = {}

  for (const r of roles) {
    const { data: userData, error: createUserError } = await supabase.auth.admin.createUser({
      email: r.email,
      password: 'ProjectPulse!2026',
      email_confirm: true,
      user_metadata: {
        full_name: r.full_name,
        role: r.role,
        department: r.department
      }
    })

    if (createUserError) {
      throw new Error(`Failed to create user ${r.email}: ${createUserError.message}`)
    }

    const userId = userData.user.id
    console.log(`Created auth user ${r.email} with ID: ${userId}`)

    // Profiles are created via trigger. Let's wait a moment and fetch/verify
    const { data: profileRow } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    createdProfiles[r.role] = profileRow || { id: userId, ...r }
  }

  const adminId = createdProfiles['pmo_admin'].id
  const pmId = createdProfiles['project_manager'].id
  const memberId = createdProfiles['team_member'].id
  const stakeholderId = createdProfiles['stakeholder'].id

  // 4. Seed the 5 projects
  console.log('Seeding projects...')
  const projectsData = [
    {
      name: 'ERP System Migration',
      description: 'Migrating legacy ERP database nodes to SAP S/4HANA Cloud infrastructure to streamline global supply chain and inventory logs.',
      type: 'Migration',
      phase: 'Execution',
      health_status: 'At Risk',
      priority: 'Critical',
      sponsor: 'Chief Financial Officer (CFO)',
      project_manager_id: pmId,
      planned_budget: 250000.00,
      start_date: '2026-01-10',
      end_date: '2026-11-30',
      created_by: adminId
    },
    {
      name: 'Zero Trust Network Implementation',
      description: 'Deploying security boundary assertions, multi-factor authentication policies, and endpoint health validation across all remote developer endpoints.',
      type: 'Security',
      phase: 'Planning',
      health_status: 'On Track',
      priority: 'High',
      sponsor: 'Chief Information Security Officer (CISO)',
      project_manager_id: pmId,
      planned_budget: 180000.00,
      start_date: '2026-03-01',
      end_date: '2026-12-15',
      created_by: pmId
    },
    {
      name: 'HR Self-Service Portal',
      description: 'Developing a modern Next.js client application for employee benefits, direct deposit updates, and PTO bookings directly integrated with Workday API endpoints.',
      type: 'Software',
      phase: 'Initiation',
      health_status: 'On Track',
      priority: 'Medium',
      sponsor: 'VP of Human Resources',
      project_manager_id: pmId,
      planned_budget: 95000.00,
      start_date: '2026-06-01',
      end_date: '2026-12-31',
      created_by: pmId
    },
    {
      name: 'Data Center Consolidation',
      description: 'Decommissioning regional hardware racks in Texas and Frankfurt, migrating critical nodes into single high-availability virtualization clusters in AWS us-east-1.',
      type: 'Infrastructure',
      phase: 'Monitoring',
      health_status: 'Off Track',
      priority: 'Critical',
      sponsor: 'VP of Cloud Operations',
      project_manager_id: pmId,
      planned_budget: 420000.00,
      start_date: '2025-08-15',
      end_date: '2026-09-30',
      created_by: adminId
    },
    {
      name: 'ISO 27001 Compliance Rollout',
      description: 'Conducting risk evaluations, mapping physical security credentials, and standardizing incident playbooks to qualify for ISO 27001 corporate audit certificates.',
      type: 'Compliance',
      phase: 'Execution',
      health_status: 'At Risk',
      priority: 'Medium',
      sponsor: 'Head of Internal Compliance',
      project_manager_id: pmId,
      planned_budget: 75000.00,
      start_date: '2026-02-15',
      end_date: '2026-10-31',
      created_by: pmId
    }
  ]

  const seededProjects: any[] = []

  for (const p of projectsData) {
    const { data: projectRow, error: pError } = await supabase
      .from('projects')
      .insert(p)
      .select()
      .single()

    if (pError) {
      throw new Error(`Failed to insert project "${p.name}": ${pError.message}`)
    }
    seededProjects.push(projectRow)
    console.log(`Seeded project: ${projectRow.name} (${projectRow.project_number})`)
  }

  // Helper map to find projects by index
  const erp = seededProjects[0]
  const zeroTrust = seededProjects[1]
  const hrPortal = seededProjects[2]
  const dataCenter = seededProjects[3]
  const compliance = seededProjects[4]

  // 5. Seed RACI Stakeholders
  console.log('Seeding RACI stakeholders...')
  const stakeholdersData = [
    // ERP
    { project_id: erp.id, user_id: adminId, raci_role: 'Accountable', notes: 'Sponsors resource allocation approvals.' },
    { project_id: erp.id, user_id: pmId, raci_role: 'Responsible', notes: 'Manages day-to-day execution timeline.' },
    { project_id: erp.id, user_id: memberId, raci_role: 'Responsible', notes: 'Database engineer handling migration scripts.' },
    { project_id: erp.id, user_id: stakeholderId, raci_role: 'Consulted', notes: 'CFO representing finance stakeholder team.' },

    // Zero Trust
    { project_id: zeroTrust.id, user_id: pmId, raci_role: 'Accountable', notes: 'CISO liaison and PM.' },
    { project_id: zeroTrust.id, user_id: memberId, raci_role: 'Responsible', notes: 'Security engineer installing agent policies.' },
    { project_id: zeroTrust.id, user_id: stakeholderId, raci_role: 'Informed', notes: 'Weekly status brief reports sent.' },

    // HR Portal
    { project_id: hrPortal.id, user_id: pmId, raci_role: 'Responsible', notes: 'Manages app delivery milestone dates.' },
    { project_id: hrPortal.id, user_id: memberId, raci_role: 'Responsible', notes: 'Lead full-stack UI coder.' },
    { project_id: hrPortal.id, user_id: adminId, raci_role: 'Consulted', notes: 'Reviews SSO infrastructure alignment.' },

    // Data Center
    { project_id: dataCenter.id, user_id: adminId, raci_role: 'Accountable', notes: 'Overall program sponsor.' },
    { project_id: dataCenter.id, user_id: pmId, raci_role: 'Responsible', notes: 'Coordinates third-party physical logistics.' },
    { project_id: dataCenter.id, user_id: memberId, raci_role: 'Responsible', notes: 'Cloud architect routing network tunnels.' },
    { project_id: dataCenter.id, user_id: stakeholderId, raci_role: 'Consulted', notes: 'Regional VP representative.' },

    // Compliance
    { project_id: compliance.id, user_id: pmId, raci_role: 'Accountable', notes: 'Compliance lead.' },
    { project_id: compliance.id, user_id: memberId, raci_role: 'Responsible', notes: 'Gathers audit logs and logs rules.' }
  ]

  for (const s of stakeholdersData) {
    await supabase.from('stakeholders').insert(s)
  }

  // 6. Seed Milestones
  console.log('Seeding Milestones...')
  const milestonesData = [
    // ERP (Execution, At Risk)
    { project_id: erp.id, title: 'Define Schema Constraints', description: 'Review legacy tables and mapping constraints.', due_date: '2026-02-15', owner_id: memberId, status: 'Completed' },
    { project_id: erp.id, title: 'Database Replication Setup', description: 'Setup data replication pipes from DB2 nodes.', due_date: '2026-05-10', owner_id: memberId, status: 'Completed' },
    { project_id: erp.id, title: 'Integrate Supply Chain Modules', description: 'Configure custom warehouse triggers.', due_date: '2026-07-20', owner_id: memberId, status: 'Overdue' },
    { project_id: erp.id, title: 'User Acceptance Testing (UAT)', description: 'Finance dept signs off on billing tests.', due_date: '2026-09-15', owner_id: pmId, status: 'In Progress' },
    { project_id: erp.id, title: 'Cutover & Final Deployment', description: 'Weekend legacy shutdown and primary dns switch.', due_date: '2026-11-20', owner_id: pmId, status: 'Pending' },

    // Zero Trust (Planning)
    { project_id: zeroTrust.id, title: 'Identity Provider Federation', description: 'Connect Active Directory clusters.', due_date: '2026-04-10', owner_id: memberId, status: 'Completed' },
    { project_id: zeroTrust.id, title: 'Draft Security Policies', description: 'Approve posture check parameters.', due_date: '2026-08-30', owner_id: pmId, status: 'In Progress' },
    { project_id: zeroTrust.id, title: 'Pilot Group Enrollment', description: 'Enroll 50 security analysts and engineers.', due_date: '2026-10-15', owner_id: memberId, status: 'Pending' },

    // HR Portal (Initiation)
    { project_id: hrPortal.id, title: 'Establish Design Mockups', description: 'Approve Figma wireframes for the personal info page.', due_date: '2026-06-25', owner_id: pmId, status: 'Completed' },
    { project_id: hrPortal.id, title: 'Initialize App Shell Boilerplate', description: 'Push initial Next.js repository with tailwind styling.', due_date: '2026-08-15', owner_id: memberId, status: 'In Progress' },
    { project_id: hrPortal.id, title: 'Auth Service Hookup', description: 'Wire profiles table and role assertion variables.', due_date: '2026-09-30', owner_id: memberId, status: 'Pending' },

    // Data Center (Monitoring, Off Track)
    { project_id: dataCenter.id, title: 'Frankfurt Virtualization Test', description: 'Simulate high volume storage replication.', due_date: '2025-10-10', owner_id: memberId, status: 'Completed' },
    { project_id: dataCenter.id, title: 'Migrate Frankfurt Core', description: 'Physical shipping of data arrays.', due_date: '2026-02-15', owner_id: memberId, status: 'Completed' },
    { project_id: dataCenter.id, title: 'Texas Warehouse Demolish', description: 'Tear down cages and decommission routers.', due_date: '2026-06-15', owner_id: pmId, status: 'Overdue' },
    { project_id: dataCenter.id, title: 'Final DNS Switchover', description: 'Reroute remaining dynamic proxy IPs.', due_date: '2026-09-01', owner_id: memberId, status: 'In Progress' },

    // Compliance (Execution, At Risk)
    { project_id: compliance.id, title: 'Policy Mapping Assessment', description: 'Map policies to controls index catalog.', due_date: '2026-04-01', owner_id: pmId, status: 'Completed' },
    { project_id: compliance.id, title: 'Employee Security Awareness Training', description: 'Pass 95% threshold of training compliance.', due_date: '2026-07-15', owner_id: pmId, status: 'Overdue' },
    { project_id: compliance.id, title: 'Internal Audit Review', description: 'Perform compliance mock walkthrough.', due_date: '2026-09-10', owner_id: memberId, status: 'Pending' }
  ]

  for (const m of milestonesData) {
    await supabase.from('milestones').insert(m)
  }

  // 7. Seed Risks
  console.log('Seeding Risks...')
  const risksData = [
    // ERP
    { project_id: erp.id, title: 'Database Schema Lock Conflict', description: 'Legacy triggers might lock core tables, crashing live sales pipelines.', category: 'Technical', probability: 4, impact: 5, owner_id: memberId, mitigation_plan: 'Execute tests on read-replicas first during midnight windows.', status: 'Mitigating' },
    { project_id: erp.id, title: 'SAP Licensing Cost Expansion', description: 'Additional developer users might exceed original contract quotes.', category: 'Financial', probability: 3, impact: 3, owner_id: pmId, mitigation_plan: 'Review user roles and deactivate inactive employee profiles.', status: 'Open' },

    // Zero Trust
    { project_id: zeroTrust.id, title: 'Developer Posture Check Friction', description: 'Old developer OS environments might fail criteria, blocking pull request lines.', category: 'Resource', probability: 5, impact: 3, owner_id: memberId, mitigation_plan: 'Offer sandbox VMs to code in and establish a support helpdesk line.', status: 'Mitigating' },

    // HR Portal
    { project_id: hrPortal.id, title: 'Workday API Schema Shift', description: 'Workday upgrade might break profile field maps.', category: 'Vendor', probability: 2, impact: 4, owner_id: pmId, mitigation_plan: 'Subscribe to Workday developer notifications and lock SDK API version.', status: 'Accepted' },

    // Data Center
    { project_id: dataCenter.id, title: 'Transit Hardware Damage', description: 'Physical shipping of memory cache modules could trigger micro-cracks.', category: 'Infrastructure', probability: 3, impact: 5, owner_id: pmId, mitigation_plan: 'Dual replicate critical logs before sending modules, buy premium insurance.', status: 'Open' },
    { project_id: dataCenter.id, title: 'Bandwidth Overages on AWS Import', description: 'Ingress of multiple Terabytes of logs could incur unexpected billing cards.', category: 'Financial', probability: 4, impact: 4, owner_id: adminId, mitigation_plan: 'Negotiate bulk data ingress billing exception program directly with AWS.', status: 'Mitigating' }
  ]

  for (const r of risksData) {
    await supabase.from('risks').insert(r)
  }

  // 8. Seed Budget Entries
  console.log('Seeding Budget Entries...')
  const budgetsData = [
    // ERP
    { project_id: erp.id, category: 'Consulting', description: 'SAP Professional Services integration audit', amount: 85000.00, entry_date: '2026-02-10', logged_by: pmId },
    { project_id: erp.id, category: 'Software', description: 'SAP S/4 HANA instance license fee', amount: 110000.00, entry_date: '2026-03-01', logged_by: adminId },
    { project_id: erp.id, category: 'Labor', description: 'Contract DBA replication engineer', amount: 35000.00, entry_date: '2026-05-15', logged_by: pmId },

    // Zero Trust
    { project_id: zeroTrust.id, category: 'Software', description: 'Okta Enterprise tenant tokens', amount: 45000.00, entry_date: '2026-03-10', logged_by: pmId },
    { project_id: zeroTrust.id, category: 'Hardware', description: 'YubiKeys for engineering staff', amount: 12000.00, entry_date: '2026-04-05', logged_by: pmId },

    // HR Portal
    { project_id: hrPortal.id, category: 'Consulting', description: 'Design mockups and wireframes external UI agency', amount: 15000.00, entry_date: '2026-06-15', logged_by: pmId },

    // Data Center
    { project_id: dataCenter.id, category: 'Infrastructure', description: 'AWS Snowball high bandwidth transport arrays rent', amount: 48000.00, entry_date: '2025-09-01', logged_by: adminId },
    { project_id: dataCenter.id, category: 'Consulting', description: 'Migration logistics coordinator service fee', amount: 95000.00, entry_date: '2025-10-15', logged_by: pmId },
    { project_id: dataCenter.id, category: 'Labor', description: 'Weekend deployment overtime compensation', amount: 72000.00, entry_date: '2026-02-20', logged_by: pmId },
    { project_id: dataCenter.id, category: 'Software', description: 'Cloud Endure replication manager license', amount: 190000.00, entry_date: '2026-03-10', logged_by: adminId },

    // Compliance
    { project_id: compliance.id, category: 'Training', description: 'SecOps awareness mock tests licensing', amount: 18000.00, entry_date: '2026-03-15', logged_by: pmId },
    { project_id: compliance.id, category: 'Consulting', description: 'Pre-audit security assessor retainer fee', amount: 35000.00, entry_date: '2026-05-01', logged_by: pmId }
  ]

  for (const b of budgetsData) {
    await supabase.from('budget_entries').insert(b)
  }

  // 9. Seed Change Requests
  console.log('Seeding Change Requests...')
  const crsData = [
    // ERP
    { project_id: erp.id, title: 'Extend Database Lock Testing Range', description: 'Requesting 2 additional weeks of replication tests on mock schemas.', change_type: 'Timeline', impact_summary: 'Pushes database integration milestone by 14 days; no budget adjustment.', requested_by: memberId, status: 'Approved', reviewed_by: adminId, reviewed_at: '2026-05-18T10:00:00Z' },
    { project_id: erp.id, title: 'SAP Supply Chain API Extension', description: 'Require external consulting labor to parse custom XML schemas from logistics servers.', change_type: 'Budget', impact_summary: 'Needs $35,000 extra budget to cover consultants.', requested_by: pmId, status: 'Submitted' },

    // Zero Trust
    { project_id: zeroTrust.id, title: 'Hardware Token Vendor Switch', description: 'Okta MFA tokens are out of stock. Switching back to backup tokens from secondary vendor.', change_type: 'Resource', impact_summary: 'No budget or timeline changes. Identical security capability.', requested_by: pmId, status: 'Approved', reviewed_by: pmId, reviewed_at: '2026-04-12T14:30:00Z' },

    // Data Center
    { project_id: dataCenter.id, title: 'Texas Facility Exit Extension', description: 'Texas landlord requires physical clearance before power cells are shut down.', change_type: 'Scope', impact_summary: 'Forces 3 additional weeks of logistics storage rent, causing a $45,000 budget deficit.', requested_by: pmId, status: 'Rejected', reviewed_by: adminId, reviewed_at: '2026-03-01T09:00:00Z' }
  ]

  for (const cr of crsData) {
    await supabase.from('change_requests').insert(cr as any)
  }

  // 10. Seed Audit Events (project_events)
  console.log('Seeding Audit Events...')
  const eventsData = [
    { project_id: erp.id, actor_id: adminId, event_type: 'project_created', description: 'Project "ERP System Migration" was initialized in phase "Initiation"', metadata: {} },
    { project_id: erp.id, actor_id: pmId, event_type: 'milestone_completed', description: 'Milestone "Define Schema Constraints" was completed', metadata: {} },
    { project_id: erp.id, actor_id: adminId, event_type: 'budget_logged', description: 'Logged expense of $110,000 for "SAP S/4 HANA instance license fee" in "Software"', metadata: {} },
    { project_id: erp.id, actor_id: adminId, event_type: 'cr_approved', description: 'Change Request CR-00001 ("Extend Database Lock Testing Range") was approved', metadata: {} },

    { project_id: zeroTrust.id, actor_id: pmId, event_type: 'project_created', description: 'Project "Zero Trust Network Implementation" was initialized in phase "Planning"', metadata: {} },
    { project_id: zeroTrust.id, actor_id: pmId, event_type: 'risk_added', description: 'Risk "Developer Posture Check Friction" was logged', metadata: {} },

    { project_id: hrPortal.id, actor_id: pmId, event_type: 'project_created', description: 'Project "HR Self-Service Portal" was initialized in phase "Initiation"', metadata: {} },
    
    { project_id: dataCenter.id, actor_id: adminId, event_type: 'project_created', description: 'Project "Data Center Consolidation" was initialized in phase "Initiation"', metadata: {} },
    { project_id: dataCenter.id, actor_id: pmId, event_type: 'phase_changed', description: 'Project phase changed from "Initiation" to "Monitoring"', metadata: {} },
    { project_id: dataCenter.id, actor_id: adminId, event_type: 'cr_rejected', description: 'Change Request CR-00004 ("Texas Facility Exit Extension") was rejected', metadata: {} }
  ]

  for (const e of eventsData) {
    await supabase.from('project_events').insert(e)
  }

  console.log('Database seeding successfully finished!')
}
