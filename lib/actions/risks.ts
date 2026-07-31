'use server'

import { createClient } from '@/lib/supabase/server'
import { logProjectEvent } from './audit'
import { revalidatePath } from 'next/cache'
import { Risk, Project } from '../types'

export async function getRisks(projectId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('risks')
    .select(`
      *,
      owner:profiles!risks_owner_id_fkey(*)
    `)
    .eq('project_id', projectId)
    .order('risk_score', { ascending: false })

  if (error) {
    console.error('Error fetching risks:', error.message)
    return []
  }
  return data as Risk[]
}

export async function createRisk(formData: {
  project_id: string
  title: string
  description: string
  category: string
  probability: number
  impact: number
  owner_id: string
  mitigation_plan: string
  status: string
}) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('risks')
    .insert(formData)
    .select()
    .single()

  if (error) {
    console.error('Error creating risk:', error.message)
    throw new Error(error.message)
  }

  await logProjectEvent(
    formData.project_id,
    'risk_added',
    `Risk "${formData.title}" was logged (Severity: ${data.severity}, Score: ${data.risk_score})`,
    { risk_title: formData.title, severity: data.severity, risk_score: data.risk_score }
  )

  revalidatePath(`/projects/${formData.project_id}`)
  revalidatePath('/dashboard')
  return data as Risk
}

export async function updateRisk(id: string, projectId: string, formData: Partial<Risk>) {
  const supabase = createClient()
  const { data: currentRisk } = await supabase
    .from('risks')
    .select('*')
    .eq('id', id)
    .single()

  if (!currentRisk) throw new Error('Risk not found')

  const { data, error } = await supabase
    .from('risks')
    .update(formData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating risk:', error.message)
    throw new Error(error.message)
  }

  if (formData.status && formData.status !== currentRisk.status) {
    await logProjectEvent(
      projectId,
      'risk_status_changed',
      `Risk "${currentRisk.title}" status changed to "${formData.status}"`,
      { risk_title: currentRisk.title, from: currentRisk.status, to: formData.status }
    )
  }

  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/dashboard')
  return data as Risk
}

export async function deleteRisk(id: string, projectId: string) {
  const supabase = createClient()
  const { data: currentRisk } = await supabase
    .from('risks')
    .select('*')
    .eq('id', id)
    .single()

  if (!currentRisk) throw new Error('Risk not found')

  const { error } = await supabase
    .from('risks')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting risk:', error.message)
    throw new Error(error.message)
  }

  await logProjectEvent(
    projectId,
    'risk_deleted',
    `Risk "${currentRisk.title}" was removed from register`,
    { risk_title: currentRisk.title }
  )

  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/dashboard')
}

export async function getOpenRisksBySeverity() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('risks')
    .select(`
      *,
      project:projects!risks_project_id_fkey(*),
      owner:profiles!risks_owner_id_fkey(*)
    `)
    .neq('status', 'Closed')
    .order('risk_score', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error fetching open risks:', error.message)
    return []
  }
  return data as (Risk & { project: Project })[]
}
