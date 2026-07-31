'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { resetAndSeedDatabase } from '@/lib/seedData'
import { revalidatePath } from 'next/cache'
import { Profile } from '../types'

export async function getUsers() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name', { ascending: true })

  if (error) {
    console.error('Error fetching users:', error.message)
    return []
  }
  return data as Profile[]
}

export async function createUser(formData: {
  fullName: string
  email: string
  password: string
  role: 'pmo_admin' | 'project_manager' | 'team_member' | 'stakeholder'
  department?: string
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Check admin permission
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'pmo_admin') {
    throw new Error('Forbidden: PMO Admin access required')
  }

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Create Auth User
  const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
    email: formData.email,
    password: formData.password,
    email_confirm: true,
    user_metadata: { full_name: formData.fullName }
  })

  if (authError) {
    console.error('Error creating auth user:', authError.message)
    throw new Error(authError.message)
  }

  if (!authData?.user) {
    throw new Error('Failed to create auth user object')
  }

  // Create Profile mapping
  const { error: profileError } = await serviceClient
    .from('profiles')
    .upsert({
      id: authData.user.id,
      full_name: formData.fullName,
      email: formData.email,
      role: formData.role,
      department: formData.department || null
    })

  if (profileError) {
    console.error('Error creating user profile:', profileError.message)
    // Transaction Rollback: Clean up orphaned Auth User
    await serviceClient.auth.admin.deleteUser(authData.user.id)
    throw new Error(profileError.message)
  }

  revalidatePath('/admin')
  revalidatePath('/dashboard')
  revalidatePath('/projects')
}

export async function updateUserRole(userId: string, role: string, department: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'pmo_admin') {
    throw new Error('Forbidden: PMO Admin access required')
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role, department })
    .eq('id', userId)

  if (error) {
    console.error('Error updating user role:', error.message)
    throw new Error(error.message)
  }

  revalidatePath('/admin')
  revalidatePath('/dashboard')
  revalidatePath('/projects')
}

export async function deleteUser(userId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'pmo_admin') {
    throw new Error('Forbidden: PMO Admin access required')
  }

  // Self-deletion guard
  if (user.id === userId) {
    throw new Error('Forbidden: You cannot delete your own account.')
  }

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Deleting the auth.user row triggers PostgreSQL cascade, cleaning up profiles and related references
  const { error } = await serviceClient.auth.admin.deleteUser(userId)

  if (error) {
    console.error('Error deleting user from auth:', error.message)
    throw new Error(error.message)
  }

  revalidatePath('/admin')
  revalidatePath('/dashboard')
  revalidatePath('/projects')
}

export async function resetDatabaseAction() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'pmo_admin') {
    throw new Error('Forbidden: PMO Admin access required')
  }

  try {
    await resetAndSeedDatabase()
  } catch (err: any) {
    console.error('Error during action database reset:', err.message)
    throw new Error(err.message)
  }

  revalidatePath('/admin')
  revalidatePath('/dashboard')
  revalidatePath('/projects')
}
