import { getProjects } from '@/lib/actions/projects'
import { createClient } from '@/lib/supabase/server'
import { ProjectRegistryClient } from '@/components/projects/ProjectRegistryClient'
import { Profile } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function ProjectsPage() {
  const projects = await getProjects()
  
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let currentProfile: Profile | null = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    currentProfile = data as Profile
  }

  return (
    <div className="space-y-6">
      {currentProfile && (
        <ProjectRegistryClient projects={projects} currentProfile={currentProfile} />
      )}
    </div>
  )
}
