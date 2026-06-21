import { createClient } from '@/lib/supabase/server'
import CueSearch from '@/components/cues/cue-search'

export const dynamic = 'force-dynamic'

export default async function CueSearchPage() {
  const supabase = await createClient()

  const { data: poses } = await supabase
    .from('poses')
    .select('id, name, sanskrit_name, body_area')
    .order('name')

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user?.id)
    .single()

  return <CueSearch poses={poses || []} profileId={profile?.id || null} />
}