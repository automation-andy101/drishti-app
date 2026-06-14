import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import SequenceBuilder from '@/components/sequences/sequence-builder'

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

  if (error || !sequence) return notFound()

  const { data: sequencePoses } = await supabase
    .from('sequence_poses')
    .select('*, poses(*)')
    .eq('sequence_id', id)
    .order('order_num')

  const { data: poses } = await supabase
    .from('poses')
    .select('*')
    .order('name')

  return (
    <SequenceBuilder
      sequence={sequence}
      initialPoses={sequencePoses || []}
      poseLibrary={poses || []}
    />
  )
}