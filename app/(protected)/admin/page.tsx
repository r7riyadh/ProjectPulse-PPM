import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUsers } from '@/lib/actions/admin'
import { getProjects } from '@/lib/actions/projects'
import { AdminConsoleClient } from '@/components/admin/AdminConsoleClient'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check if role is pmo_admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'pmo_admin') {
    redirect('/dashboard')
  }

  const [users, projects] = await Promise.all([
    getUsers(),
    getProjects()
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-1">
        <h2 className="text-2xl font-extrabold tracking-tight text-text-primary">
          Admin Console
        </h2>
        <p className="text-xs text-text-secondary">
          Governance control panel for managing users, projects, and demo database resets.
        </p>
      </div>

      <AdminConsoleClient users={users} projects={projects} currentUserId={user.id} />
    </div>
  )
}
