import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import StudentMode from '@/components/sequences/student-mode'

export default async function PlaySequencePage({
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

  if (!sequencePoses || sequencePoses.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-3">🧘</div>
        <h2 className="font-medium mb-1">No poses in this sequence yet</h2>
        <p className="text-sm text-muted-foreground">
          Go back and add some poses before starting the class
        </p>
      </div>
    )
  }

  return <StudentMode sequence={sequence} poses={sequencePoses} />
}