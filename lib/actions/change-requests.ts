'use server'

import { createClient } from '@/lib/supabase/server'
import { logProjectEvent } from './audit'
import { revalidatePath } from 'next/cache'
import { ChangeRequest } from '../types'

export async function getChangeRequests(projectId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('change_requests')
    .select(`
      *,
      requester:profiles!change_requests_requested_by_fkey(*),
      reviewer:profiles!change_requests_reviewed_by_fkey(*)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching change requests:', error.message)
    return []
  }
  return data as ChangeRequest[]
}

export async function createChangeRequest(formData: {
  project_id: string
  title: string
  description: string
  change_type: string
  impact_summary: string
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('change_requests')
    .insert({
      ...formData,
      requested_by: user.id,
      status: 'Submitted'
    })
    .select()
    .single()

  if (error) {
    console.error('Error submitting change request:', error.message)
    throw new Error(error.message)
  }

  await logProjectEvent(
    formData.project_id,
    'cr_submitted',
    `Submitted Change Request: "${formData.title}" (${formData.change_type})`,
    { title: formData.title, type: formData.change_type }
  )

  revalidatePath(`/projects/${formData.project_id}`)
  return data as ChangeRequest
}

export async function reviewChangeRequest(
  id: string,
  projectId: string,
  status: 'Approved' | 'Rejected',
  notes?: string
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: currentCR } = await supabase
    .from('change_requests')
    .select('*')
    .eq('id', id)
    .single()

  if (!currentCR) throw new Error('Change request not found')

  const { data, error } = await supabase
    .from('change_requests')
    .update({
      status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      impact_summary: notes ? `Impact summary: ${currentCR.impact_summary}. Review Notes: ${notes}` : currentCR.impact_summary
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error reviewing change request:', error.message)
    throw new Error(error.message)
  }

  const eventType = status === 'Approved' ? 'cr_approved' : 'cr_rejected'
  const actionText = status === 'Approved' ? 'approved' : 'rejected'
  
  await logProjectEvent(
    projectId,
    eventType,
    `Change Request ${currentCR.cr_number} ("${currentCR.title}") was ${actionText}`,
    { cr_number: currentCR.cr_number, title: currentCR.title, status, notes }
  )

  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/dashboard')
  return data as ChangeRequest;
}
export async function getRecentActivityFeed() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('project_events')
    .select(`
      *,
      project:projects!project_events_project_id_fkey(name),
      actor:profiles!project_events_actor_id_fkey(*)
    `)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error fetching recent activities:', error.message)
    return []
  }
  return data as any[]
}
