import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SidebarLayout } from '@/components/shared/SidebarLayout'
import { TabSessionGuard } from '@/components/shared/TabSessionGuard'
import { Profile } from '@/lib/types'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profileRow) {
    // Session exists but profile is missing, force signout/re-login
    await supabase.auth.signOut()
    redirect('/login')
  }

  const profile = profileRow as Profile

  return (
    <TabSessionGuard>
      <SidebarLayout profile={profile}>{children}</SidebarLayout>
    </TabSessionGuard>
  )
}
