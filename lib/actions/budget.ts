'use server'

import { createClient } from '@/lib/supabase/server'
import { logProjectEvent } from './audit'
import { revalidatePath } from 'next/cache'
import { BudgetEntry } from '../types'

export async function getBudgetEntries(projectId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('budget_entries')
    .select(`
      *,
      logger:profiles!budget_entries_logged_by_fkey(*)
    `)
    .eq('project_id', projectId)
    .order('entry_date', { ascending: false })

  if (error) {
    console.error('Error fetching budget entries:', error.message)
    return []
  }
  return data as BudgetEntry[]
}

export async function createBudgetEntry(formData: {
  project_id: string
  category: string
  description: string
  amount: number
  entry_date: string
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('budget_entries')
    .insert({
      ...formData,
      logged_by: user.id
    })
    .select()
    .single()

  if (error) {
    console.error('Error logging expense:', error.message)
    throw new Error(error.message)
  }

  await logProjectEvent(
    formData.project_id,
    'budget_logged',
    `Logged expense of $${formData.amount.toLocaleString()} for "${formData.description}" in "${formData.category}"`,
    { amount: formData.amount, category: formData.category, description: formData.description }
  )

  revalidatePath(`/projects/${formData.project_id}`)
  revalidatePath('/dashboard')
  return data as BudgetEntry
}

export async function deleteBudgetEntry(id: string, projectId: string) {
  const supabase = createClient()
  const { data: currentEntry } = await supabase
    .from('budget_entries')
    .select('*')
    .eq('id', id)
    .single()

  if (!currentEntry) throw new Error('Budget entry not found')

  const { error } = await supabase
    .from('budget_entries')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting budget entry:', error.message)
    throw new Error(error.message)
  }

  await logProjectEvent(
    projectId,
    'budget_removed',
    `Removed expense of $${currentEntry.amount.toLocaleString()} for "${currentEntry.description}"`,
    { amount: currentEntry.amount, category: currentEntry.category, description: currentEntry.description }
  )

  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/dashboard')
}
