'use server'

import { createClient } from '@/lib/supabase/server'
import { logProjectEvent } from './audit'
import { revalidatePath } from 'next/cache'
import { Stakeholder, Profile } from '../types'

export async function getStakeholders(projectId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('stakeholders')
    .select(`
      *,
      profile:profiles!stakeholders_user_id_fkey(*)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching stakeholders:', error.message)
    return []
  }
  return data as Stakeholder[]
}

export async function createStakeholder(formData: {
  project_id: string
  user_id: string
  raci_role: string
  notes: string
}) {
  const supabase = createClient()
  
  // Resolve user full_name for audit trail
  const { data: stakeholderProfile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', formData.user_id)
    .single()

  const { data, error } = await supabase
    .from('stakeholders')
    .insert(formData)
    .select()
    .single()

  if (error) {
    console.error('Error adding stakeholder:', error.message)
    throw new Error(error.message)
  }

  const name = stakeholderProfile?.full_name || 'Team member'
  await logProjectEvent(
    formData.project_id,
    'stakeholder_added',
    `Added ${name} as stakeholder in RACI role "${formData.raci_role}"`,
    { user_id: formData.user_id, stakeholder_name: name, role: formData.raci_role }
  )

  revalidatePath(`/projects/${formData.project_id}`)
  return data as Stakeholder
}

export async function deleteStakeholder(id: string, projectId: string) {
  const supabase = createClient()

  // Get current stakeholder details for the audit log
  const { data: currentStakeholder } = await supabase
    .from('stakeholders')
    .select(`
      *,
      profile:profiles!stakeholders_user_id_fkey(full_name)
    `)
    .eq('id', id)
    .single()

  if (!currentStakeholder) throw new Error('Stakeholder not found')

  const { error } = await supabase
    .from('stakeholders')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting stakeholder:', error.message)
    throw new Error(error.message)
  }

  const name = currentStakeholder.profile?.full_name || 'Team member'
  await logProjectEvent(
    projectId,
    'stakeholder_removed',
    `Removed ${name} from project stakeholders`,
    { user_id: currentStakeholder.user_id, stakeholder_name: name }
  )

  revalidatePath(`/projects/${projectId}`)
}
