'use server'

import { createClient } from '@/lib/supabase/server'
import { logProjectEvent } from './audit'
import { revalidatePath } from 'next/cache'
import { Project, Profile } from '../types'

export async function getProjects() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      project_manager:profiles!projects_project_manager_id_fkey(*)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching projects:', error.message)
    return []
  }
  return data as Project[]
}

export async function getProjectById(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      project_manager:profiles!projects_project_manager_id_fkey(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error(`Error fetching project ${id}:`, error.message)
    return null
  }
  return data as Project
}

export async function createProject(formData: {
  name: string
  description: string
  type: string
  phase: string
  health_status: string
  priority: string
  sponsor: string
  project_manager_id: string
  planned_budget: number
  start_date: string
  end_date: string
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('projects')
    .insert({
      ...formData,
      created_by: user.id,
      actual_spend: 0
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating project:', error.message)
    throw new Error(error.message)
  }

  await logProjectEvent(
    data.id,
    'project_created',
    `Project "${data.name}" was initialized in phase "${data.phase}"`,
    { project_name: data.name, initial_phase: data.phase }
  )

  revalidatePath('/dashboard')
  revalidatePath('/projects')
  return data as Project
}

export async function updateProject(id: string, formData: Partial<Project>) {
  const supabase = createClient()
  const { data: currentProject } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (!currentProject) throw new Error('Project not found')

  const { data, error } = await supabase
    .from('projects')
    .update(formData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating project:', error.message)
    throw new Error(error.message)
  }

  // Auditing specific field changes
  if (formData.phase && formData.phase !== currentProject.phase) {
    await logProjectEvent(
      id,
      'phase_changed',
      `Project phase changed from "${currentProject.phase}" to "${formData.phase}"`,
      { from: currentProject.phase, to: formData.phase }
    )
  }

  if (formData.health_status && formData.health_status !== currentProject.health_status) {
    await logProjectEvent(
      id,
      'health_changed',
      `Project health status changed from "${currentProject.health_status}" to "${formData.health_status}"`,
      { from: currentProject.health_status, to: formData.health_status }
    )
  }

  revalidatePath('/dashboard')
  revalidatePath('/projects')
  revalidatePath(`/projects/${id}`)
  return data as Project
}

export async function getProjectEvents(projectId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('project_events')
    .select(`
      *,
      actor:profiles!project_events_actor_id_fkey(*)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching project events:', error.message)
    return []
  }
  return data as any[]
}

export async function getAllProfiles() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name', { ascending: true })

  if (error) {
    console.error('Error fetching all profiles:', error.message)
    return []
  }
  return data as Profile[]
}

export async function editProjectAction(id: string, formData: Partial<Project>) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: userProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!userProfile) throw new Error('User profile not found')

  const { data: project } = await supabase.from('projects').select('*').eq('id', id).single()
  if (!project) throw new Error('Project not found')

  const isAdmin = userProfile.role === 'pmo_admin'
  const isPM = userProfile.role === 'project_manager' && project.project_manager_id === user.id

  if (!isAdmin && !isPM) {
    throw new Error('Forbidden: You are not authorized to edit this project.')
  }

  const allowedFields: Partial<Project> = {}
  const changedFields: string[] = []

  const pmFields: (keyof Project)[] = ['name', 'description', 'sponsor', 'start_date', 'end_date', 'priority', 'type']
  const adminFields: (keyof Project)[] = [...pmFields, 'planned_budget', 'project_manager_id']
  const editableKeys = isAdmin ? adminFields : pmFields

  for (const key of editableKeys) {
    if (formData[key] !== undefined && formData[key] !== project[key]) {
      (allowedFields as any)[key] = formData[key]
      changedFields.push(key as string)
    }
  }

  if (changedFields.length === 0) {
    return project
  }

  const { data: updatedProject, error } = await supabase
    .from('projects')
    .update(allowedFields)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error in editProjectAction:', error.message)
    throw new Error(error.message)
  }

  await logProjectEvent(
    id,
    'project_edited',
    `Project edited. Changed fields: ${changedFields.join(', ')}`,
    { changed_fields: changedFields, actor_role: userProfile.role }
  )

  revalidatePath('/dashboard')
  revalidatePath('/projects')
  revalidatePath(`/projects/${id}`)
  return updatedProject as Project
}

export async function archiveProjectAction(id: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: userProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!userProfile) throw new Error('User profile not found')

  const { data: project } = await supabase.from('projects').select('*').eq('id', id).single()
  if (!project) throw new Error('Project not found')

  const isAdmin = userProfile.role === 'pmo_admin'
  const isPM = userProfile.role === 'project_manager' && project.project_manager_id === user.id

  if (!isAdmin && !isPM) {
    throw new Error('Forbidden: You are not authorized to archive this project.')
  }

  const { data: updatedProject, error } = await supabase
    .from('projects')
    .update({ health_status: 'Archived' })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error in archiveProjectAction:', error.message)
    throw new Error(error.message)
  }

  await logProjectEvent(
    id,
    'project_archived',
    `Project "${project.name}" was soft-deleted / archived.`,
    { actor_role: userProfile.role }
  )

  revalidatePath('/dashboard')
  revalidatePath('/projects')
  revalidatePath(`/projects/${id}`)
  return updatedProject as Project
}

export async function hardDeleteProjectAction(id: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: userProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!userProfile || userProfile.role !== 'pmo_admin') {
    throw new Error('Forbidden: PMO Admin access required.')
  }

  const { data: project } = await supabase.from('projects').select('*').eq('id', id).single()
  if (!project) throw new Error('Project not found')

  // Log event first before hard delete cascade
  await logProjectEvent(
    id,
    'project_deleted',
    `Project "${project.name}" was permanently deleted from the database.`,
    { project_name: project.name, actor_role: userProfile.role }
  )

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error in hardDeleteProjectAction:', error.message)
    throw new Error(error.message)
  }

  revalidatePath('/dashboard')
  revalidatePath('/projects')
}

