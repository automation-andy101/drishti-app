import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import SequenceBuilder from '@/components/sequences/sequence-builder'

export const dynamic = 'force-dynamic'

export default async function SequenceBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: sequence, error } = await supabase
    .from('sequences')
    .select('*')
    .eq('id', id)
    .single()

  const { data: sectionNotes } = await supabase
  .from('sequence_section_notes')
  .select('*')
  .eq('sequence_id', id)
  .order('order_num')

  if (error || !sequence) return notFound()

  const { data: sequencePoses } = await supabase
    .from('sequence_poses')
    .select('*, poses(*), sequence_pose_cues(*, cues(*))')
    .eq('sequence_id', id)
    .order('order_num')

  const { data: poses } = await supabase
    .from('poses')
    .select('*')
    .order('name')

  const { data: pranayamaTechniques } = await supabase
    .from('pranayama_techniques')
    .select('*')
    .order('name')

  const { data: sequencePranayama } = await supabase
    .from('sequence_pranayama')
    .select('*, pranayama_techniques(*), sequence_pranayama_cues(*, cues(*))')
    .eq('sequence_id', id)
    .order('order_num')

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user?.id)
    .single()

  return (
    <SequenceBuilder
      sequence={sequence}
      initialPoses={sequencePoses || []}
      poseLibrary={poses || []}
      pranayamaLibrary={pranayamaTechniques || []}
      initialPranayama={sequencePranayama || []}
      initialSectionNotes={sectionNotes || []}
      profileId={profile?.id || null}
    />
  )
}
