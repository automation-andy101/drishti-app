import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PrintView from '@/components/sequences/print-view'

export const dynamic = 'force-dynamic'

export default async function PrintSequencePage({
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
    .select('*, poses(*), sequence_pose_cues(*, cues(*))')
    .eq('sequence_id', id)
    .order('order_num')

  return <PrintView sequence={sequence} poses={sequencePoses || []} />
}