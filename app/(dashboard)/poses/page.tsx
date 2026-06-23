import { createClient } from '@/lib/supabase/server'
import PoseLibrary from '@/components/poses/pose-library'

export const dynamic = 'force-dynamic'

export default async function PosesPage() {
  const supabase = await createClient()

  const { data: poses, error } = await supabase
    .from('poses')
    .select('*')
    .order('name')

  if (error) {
    console.error(error)
    return <div>Error loading poses</div>
  }

  return <PoseLibrary poses={poses || []} />
}