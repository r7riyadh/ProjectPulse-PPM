import { createClient } from '@/lib/supabase/server'

export async function logProjectEvent(
  projectId: string,
  eventType: string,
  description: string,
  metadata: Record<string, unknown> = {}
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return;

  await supabase.from('project_events').insert({
    project_id: projectId,
    actor_id: user.id,
    event_type: eventType,
    description,
    metadata
  })
}
