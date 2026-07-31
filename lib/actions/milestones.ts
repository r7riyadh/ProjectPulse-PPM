'use server'

import { createClient } from '@/lib/supabase/server'
import { logProjectEvent } from './audit'
import { revalidatePath } from 'next/cache'
import { Milestone, Project } from '../types'

export async function getMilestones(projectId: string) {
  const supabase = createClient()
  
  // Run an update query to ensure overdue milestones are updated dynamically on load
  await supabase
    .from('milestones')
    .update({ status: 'Overdue' })
    .eq('project_id', projectId)
    .lt('due_date', new Date().toISOString().split('T')[0])
    .neq('status', 'Completed')
    .neq('status', 'Overdue')

  const { data, error } = await supabase
    .from('milestones')
    .select(`
      *,
      owner:profiles!milestones_owner_id_fkey(*)
    `)
    .eq('project_id', projectId)
    .order('due_date', { ascending: true })

  if (error) {
    console.error('Error fetching milestones:', error.message)
    return []
  }
  return data as Milestone[]
}

export async function createMilestone(formData: {
  project_id: string
  title: string
  description: string
  due_date: string
  owner_id: string
  status: string
}) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('milestones')
    .insert(formData)
    .select()
    .single()

  if (error) {
    console.error('Error creating milestone:', error.message)
    throw new Error(error.message)
  }

  await logProjectEvent(
    formData.project_id,
    'milestone_added',
    `Milestone "${formData.title}" was added (Due: ${formData.due_date})`,
    { milestone_title: formData.title, due_date: formData.due_date }
  )

  revalidatePath(`/projects/${formData.project_id}`)
  revalidatePath('/dashboard')
  return data as Milestone
}

export async function updateMilestone(id: string, projectId: string, formData: Partial<Milestone>) {
  const supabase = createClient()
  
  const { data: currentMilestone } = await supabase
    .from('milestones')
    .select('*')
    .eq('id', id)
    .single()

  if (!currentMilestone) throw new Error('Milestone not found')

  const { data, error } = await supabase
    .from('milestones')
    .update(formData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating milestone:', error.message)
    throw new Error(error.message)
  }

  if (formData.status && formData.status !== currentMilestone.status) {
    let eventType = 'milestone_updated'
    let description = `Milestone "${currentMilestone.title}" status changed to "${formData.status}"`

    if (formData.status === 'Completed') {
      eventType = 'milestone_completed'
      description = `Milestone "${currentMilestone.title}" was completed`
    }

    await logProjectEvent(projectId, eventType, description, {
      milestone_title: currentMilestone.title,
      from_status: currentMilestone.status,
      to_status: formData.status
    })
  }

  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/dashboard')
  return data as Milestone
}

export async function deleteMilestone(id: string, projectId: string) {
  const supabase = createClient()
  
  const { data: currentMilestone } = await supabase
    .from('milestones')
    .select('*')
    .eq('id', id)
    .single()

  if (!currentMilestone) throw new Error('Milestone not found')

  const { error } = await supabase
    .from('milestones')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting milestone:', error.message)
    throw new Error(error.message)
  }

  await logProjectEvent(
    projectId,
    'milestone_deleted',
    `Milestone "${currentMilestone.title}" was removed`,
    { milestone_title: currentMilestone.title }
  )

  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/dashboard')
}
export async function getOverdueMilestonesWatchlist() {
  const supabase = createClient()
  
  // Update overdue state for all projects first
  await supabase
    .from('milestones')
    .update({ status: 'Overdue' })
    .lt('due_date', new Date().toISOString().split('T')[0])
    .neq('status', 'Completed')
    .neq('status', 'Overdue')

  const { data, error } = await supabase
    .from('milestones')
    .select(`
      *,
      project:projects!milestones_project_id_fkey(*),
      owner:profiles!milestones_owner_id_fkey(*)
    `)
    .eq('status', 'Overdue')
    .order('due_date', { ascending: true })

  if (error) {
    console.error('Error fetching overdue milestones watchlist:', error.message)
    return []
  }
  return data as (Milestone & { project: Project })[]
}
