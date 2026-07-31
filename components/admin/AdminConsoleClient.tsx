'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ShieldAlert, 
  RefreshCw, 
  Loader2, 
  Users, 
  UserMinus, 
  UserCheck, 
  Search, 
  Plus,
  Trash2,
  Briefcase,
  Lock
} from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/Dialog'
import { createUser, updateUserRole, deleteUser, resetDatabaseAction } from '@/lib/actions/admin'
import { hardDeleteProjectAction } from '@/lib/actions/projects'
import { Profile, Project } from '@/lib/types'
import { toast, Toaster } from 'sonner'
import confetti from 'canvas-confetti'

interface AdminConsoleClientProps {
  users: Profile[]
  projects?: Project[]
  currentUserId: string
}

export function AdminConsoleClient({ users, projects = [], currentUserId }: AdminConsoleClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [projectSearch, setProjectSearch] = useState('')

  // Create user form state
  const [createUserOpen, setCreateUserOpen] = useState(false)
  const [newFullName, setNewFullName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState<'pmo_admin' | 'project_manager' | 'team_member' | 'stakeholder'>('team_member')
  const [newDept, setNewDept] = useState('')
  const [createLoading, setCreateLoading] = useState(false)

  // Map user id to local edits
  const [roles, setRoles] = useState<Record<string, string>>({})
  const [departments, setDepartments] = useState<Record<string, string>>({})

  // Admin Project deletion states
  const [selectedProjToDelete, setSelectedProjToDelete] = useState<Project | null>(null)
  const [isProjectDeleteOpen, setIsProjectDeleteOpen] = useState(false)
  const [projectDeleteNameInput, setProjectDeleteNameInput] = useState('')
  const [projectDeleteLoading, setProjectDeleteLoading] = useState(false)

  const handleRoleChange = (userId: string, val: string) => {
    setRoles(prev => ({ ...prev, [userId]: val }))
  }

  const handleDeptChange = (userId: string, val: string) => {
    setDepartments(prev => ({ ...prev, [userId]: val }))
  }

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFullName || !newEmail || !newPassword) {
      toast.error('Please fill in all required fields.')
      return
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long.')
      return
    }

    setCreateLoading(true)
    try {
      await createUser({
        fullName: newFullName,
        email: newEmail,
        password: newPassword,
        role: newRole,
        department: newDept || undefined
      })
      toast.success(`User ${newFullName} created successfully`)
      setCreateUserOpen(false)
      setNewFullName('')
      setNewEmail('')
      setNewPassword('')
      setNewRole('team_member')
      setNewDept('')
      router.refresh()
    } catch (err: any) {
      toast.error(`Creation failed: ${err.message}`)
    } finally {
      setCreateLoading(false)
    }
  }

  const handleUpdateUser = async (user: Profile) => {
    const updatedRole = roles[user.id] || user.role
    const updatedDept = departments[user.id] || user.department || ''

    setLoading(true)
    try {
      await updateUserRole(user.id, updatedRole, updatedDept)
      toast.success(`Updated role and department for ${user.full_name}`)
      router.refresh()
    } catch (err: any) {
      toast.error(`Update failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (user: Profile) => {
    if (user.id === currentUserId) {
      toast.error('You cannot delete your own active PMO Admin session.')
      return
    }
    
    if (!confirm(`Are you sure you want to permanently delete user "${user.full_name}"? This will cascade delete their stakeholders role mappings.`)) {
      return
    }

    setLoading(true)
    try {
      await deleteUser(user.id)
      toast.success(`Deleted user ${user.full_name}`)
      router.refresh()
    } catch (err: any) {
      toast.error(`Deletion failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const triggerProjectDelete = (project: Project) => {
    setSelectedProjToDelete(project)
    setProjectDeleteNameInput('')
    setIsProjectDeleteOpen(true)
  }

  const handleAdminHardDeleteProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProjToDelete) return

    if (projectDeleteNameInput !== selectedProjToDelete.name) {
      toast.error('Project name mismatch. Confirmation failed.')
      return
    }

    setProjectDeleteLoading(true)
    try {
      await hardDeleteProjectAction(selectedProjToDelete.id)
      toast.success(`Project "${selectedProjToDelete.name}" permanently deleted`)
      setIsProjectDeleteOpen(false)
      setSelectedProjToDelete(null)
      router.refresh()
    } catch (err: any) {
      toast.error(`Deletion failed: ${err.message}`)
    } finally {
      setProjectDeleteLoading(false)
    }
  }

  const handleResetDemoEnvironment = async () => {
    if (!confirm('Are you sure you want to reset the demo environment? All custom projects, milestones, budget entries, stakeholders, change requests, and events will be deleted and recreated with original seed values.')) {
      return
    }

    setResetLoading(true)
    try {
      await resetDatabaseAction()
      
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      })

      toast.success('Demo environment successfully reset and reseeded!')
      router.refresh()
    } catch (err: any) {
      toast.error(`Database reset failed: ${err.message}`)
    } finally {
      setResetLoading(false)
    }
  }

  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.department || '').toLowerCase().includes(search.toLowerCase())
  )

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
    p.project_number.toLowerCase().includes(projectSearch.toLowerCase()) ||
    (p.project_manager?.full_name || '').toLowerCase().includes(projectSearch.toLowerCase())
  )

  const getRoleBadgeProps = (role: string) => {
    switch (role) {
      case 'pmo_admin':
        return { variant: 'purple' as const, label: 'PMO Admin' }
      case 'project_manager':
        return { variant: 'info' as const, label: 'Project PM' }
      case 'team_member':
        return { variant: 'success' as const, label: 'Team Member' }
      case 'stakeholder':
        return { variant: 'outline' as const, label: 'Stakeholder' }
      default:
        return { variant: 'default' as const, label: role }
    }
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <Toaster position="top-right" theme="light" richColors />
      
      {/* 1. Demo Reset Controls */}
      <Card className="border-off-track/20 bg-off-track/5">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-off-track flex items-center space-x-2">
              <ShieldAlert className="h-5 w-5" />
              <span>Demo Environment Control Center</span>
            </CardTitle>
            <CardDescription className="text-text-secondary mt-0.5">
              Reset the sandbox PostgreSQL database back to standard mock portfolio logs.
            </CardDescription>
          </div>
          <RefreshCw className="h-5 w-5 text-off-track" />
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-text-secondary leading-relaxed">
            Clicking reset triggers a complete truncation of the active database tables (cascading through milestones, risks, stakeholders, and expenses), deletes custom authentication test profiles, and recreates the 5 canonical demo projects with a complete set of seed entries.
          </p>

          <button
            onClick={handleResetDemoEnvironment}
            disabled={resetLoading || loading}
            className="inline-flex items-center space-x-2 bg-off-track hover:bg-off-track/90 text-white px-5 py-2.5 rounded-lg text-xs font-semibold font-mono tracking-wider uppercase transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            {resetLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Reseed Execution in Progress...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 animate-spin-slow" />
                <span>Reset Demo Environment</span>
              </>
            )}
          </button>
        </CardContent>
      </Card>

      {/* 2. User Administration Panel */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle>User Governance & RBAC Roles</CardTitle>
            <CardDescription>Adjust system role assignments and corporate departments.</CardDescription>
          </div>
          
          <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
            <DialogTrigger asChild>
              <button className="bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg text-xs font-semibold font-mono tracking-wider uppercase transition-all shadow-md cursor-pointer flex items-center space-x-1.5">
                <Plus className="h-4 w-4" />
                <span>Create User</span>
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New User Account</DialogTitle>
                <DialogDescription>
                  Creates a security credential profile in Supabase Auth and seeds their default database profile.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUserSubmit} className="space-y-4 pt-4">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-text-secondary uppercase tracking-widest block">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-text-secondary uppercase tracking-widest block">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="jane.doe@company.com"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-text-secondary uppercase tracking-widest block">Password * (min 8 chars)</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-text-secondary uppercase tracking-widest block">RBAC Role *</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="pmo_admin">PMO Admin (Full Control)</option>
                    <option value="project_manager">Project Manager (CRUD Own)</option>
                    <option value="team_member">Team Member (Read & Update Milestones)</option>
                    <option value="stakeholder">Stakeholder (Read Only)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-text-secondary uppercase tracking-widest block">Department (Optional)</label>
                  <input
                    type="text"
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    placeholder="e.g. IT, Security, Finance"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <DialogFooter className="pt-4 border-t border-border/40 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setCreateUserOpen(false)}
                    className="px-4 py-2 border border-border bg-surface hover:bg-surface-raised rounded-lg text-xs font-semibold font-mono tracking-wider uppercase transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-xs font-semibold font-mono tracking-wider uppercase transition-all shadow-md flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {createLoading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>Create User</span>
                      </>
                    )}
                  </button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        
        <CardContent className="space-y-4">
          
          {/* Search bar */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user profiles..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-surface-raised text-xs text-text-primary focus:outline-none focus:border-primary placeholder:text-text-muted transition-all"
            />
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto border border-border/60 rounded-lg">
            <table className="w-full border-collapse text-left text-xs min-w-[800px]">
              <thead>
                <tr className="border-b border-border bg-surface/50 text-text-muted font-mono uppercase text-[10px]">
                  <th className="p-3">Full Name</th>
                  <th className="p-3">Corporate Email</th>
                  <th className="p-3">Role Badge</th>
                  <th className="p-3">Department (Edit)</th>
                  <th className="p-3">Created Date</th>
                  <th className="p-3">Change Role</th>
                  <th className="p-3 text-center">Save / Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredUsers.map((u) => {
                  const localRole = roles[u.id] || u.role
                  const localDept = departments[u.id] !== undefined ? departments[u.id] : (u.department || '')
                  const isSelf = u.id === currentUserId
                  const badgeProps = getRoleBadgeProps(u.role)
                  
                  return (
                    <tr key={u.id} className="hover:bg-surface-raised/40 transition-colors">
                      <td className="p-3 font-bold text-text-primary">
                        {u.full_name} {isSelf && <span className="text-[10px] text-primary font-mono ml-1">(YOU)</span>}
                      </td>
                      <td className="p-3 text-text-muted font-mono">{u.email}</td>
                      <td className="p-3">
                        <StatusBadge status={u.role} type="role" />
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={localDept}
                          onChange={(e) => handleDeptChange(u.id, e.target.value)}
                          disabled={loading}
                          placeholder="e.g. Finance"
                          className="px-2 py-1 rounded border border-border bg-surface text-xs text-text-primary focus:outline-none focus:border-primary disabled:opacity-50 transition-all font-mono w-32"
                        />
                      </td>
                      <td className="p-3 text-text-muted font-mono">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                      </td>
                      <td className="p-3">
                        <select
                          value={localRole}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          disabled={loading || isSelf}
                          className="px-2 py-1 bg-surface border border-border text-xs rounded text-text-primary focus:outline-none focus:border-primary disabled:opacity-50 font-mono"
                        >
                          <option value="pmo_admin">pmo_admin</option>
                          <option value="project_manager">project_manager</option>
                          <option value="team_member">team_member</option>
                          <option value="stakeholder">stakeholder</option>
                        </select>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleUpdateUser(u)}
                            disabled={loading}
                            className="p-1.5 rounded hover:bg-surface border border-transparent hover:border-border text-on-track hover:text-on-track transition-colors cursor-pointer"
                            title="Save Changes"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u)}
                            disabled={loading || isSelf}
                            className="p-1.5 rounded hover:bg-surface border border-transparent hover:border-border text-text-muted hover:text-off-track transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Delete User"
                          >
                            <UserMinus className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

        </CardContent>
      </Card>

      {/* 3. Project Administration & Hard Delete Governance */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4 border-b border-border/40 pb-4">
          <div>
            <CardTitle>Project Portfolio Governance (Hard Delete)</CardTitle>
            <CardDescription>Permanently destroy project entries and clean related records.</CardDescription>
          </div>
          <Briefcase className="h-5 w-5 text-off-track animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
            <input
              type="text"
              value={projectSearch}
              onChange={(e) => setProjectSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-surface-raised text-xs text-text-primary focus:outline-none focus:border-primary placeholder:text-text-muted transition-all"
            />
          </div>

          <div className="overflow-x-auto border border-border/60 rounded-lg">
            <table className="w-full border-collapse text-left text-xs min-w-[800px]">
              <thead>
                <tr className="border-b border-border bg-surface/50 text-text-muted font-mono uppercase text-[10px]">
                  <th className="p-3">Project Code</th>
                  <th className="p-3">Project Name</th>
                  <th className="p-3">Project Manager</th>
                  <th className="p-3">Phase Gate</th>
                  <th className="p-3">Health Status</th>
                  <th className="p-3 text-center">Hard Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((p) => (
                    <tr key={p.id} className="hover:bg-surface-raised/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-text-secondary">{p.project_number}</td>
                      <td className="p-3 font-bold text-text-primary">{p.name}</td>
                      <td className="p-3 text-text-secondary">
                        {p.project_manager?.full_name || 'Unassigned'}
                      </td>
                      <td className="p-3 font-semibold text-text-secondary">{p.phase}</td>
                      <td className="p-3">
                        <StatusBadge status={p.health_status} type="health" />
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => triggerProjectDelete(p)}
                          className="p-1.5 rounded hover:bg-surface border border-transparent hover:border-border text-text-muted hover:text-off-track transition-colors cursor-pointer"
                          title="Delete Project"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-text-muted">
                      No active projects located under query guidelines.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 4. Danger Hard Delete Modal (Admin Console) */}
      <Dialog open={isProjectDeleteOpen} onOpenChange={setIsProjectDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-off-track">
              <ShieldAlert className="h-5 w-5" />
              <span>Confirm Permanent Project Destruction</span>
            </DialogTitle>
            <DialogDescription>
              This is a cascade database cleanup procedure.
            </DialogDescription>
          </DialogHeader>

          {selectedProjToDelete && (
            <form onSubmit={handleAdminHardDeleteProject} className="space-y-4 pt-2">
              <div className="p-3.5 rounded-lg border border-off-track/30 bg-off-track/5 text-xs text-off-track leading-relaxed space-y-1">
                <p className="font-bold">⚠️ CRITICAL WARNING BANNER:</p>
                <p>This action cannot be undone. All milestones, risks, budget entries, stakeholders, change requests, and activity logs linked to project <span className="font-extrabold font-mono">"{selectedProjToDelete.project_number}"</span> will be permanently deleted.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-text-secondary font-mono uppercase tracking-wider">
                  Type <span className="font-bold text-text-primary">"{selectedProjToDelete.name}"</span> to confirm:
                </label>
                <input
                  type="text"
                  required
                  value={projectDeleteNameInput}
                  onChange={(e) => setProjectDeleteNameInput(e.target.value)}
                  placeholder="Type project name exactly..."
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-off-track font-bold transition-all"
                />
              </div>

              <DialogFooter className="pt-4 border-t border-border/40 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsProjectDeleteOpen(false)
                    setSelectedProjToDelete(null)
                  }}
                  className="px-4 py-2 border border-border bg-surface hover:bg-surface-raised rounded-lg text-xs font-semibold font-mono tracking-wider uppercase transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={projectDeleteLoading || projectDeleteNameInput !== selectedProjToDelete.name}
                  className="bg-off-track hover:bg-off-track/90 text-white px-4 py-2 rounded-lg text-xs font-semibold font-mono tracking-wider uppercase transition-all flex items-center space-x-1.5 cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {projectDeleteLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete Permanently</span>
                    </>
                  )}
                </button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

    </div>
  )
}
