import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NewProjectForm } from '@/components/projects/NewProjectForm'
import { Profile } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function NewProjectPage() {
  const supabase = createClient()
  
  // Enforce role check: Only PMO Admin and Project Manager can access this creation form page
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['pmo_admin', 'project_manager'].includes(profile.role)) {
    redirect('/projects')
  }

  // Fetch all users with 'project_manager' or 'pmo_admin' roles to populate the dropdown
  const { data: pms, error } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['project_manager', 'pmo_admin'])
    .order('full_name', { ascending: true })

  const projectManagers = (pms || []) as Profile[]

  return (
    <div className="space-y-6">
      <NewProjectForm projectManagers={projectManagers} />
    </div>
  )
}
