import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminPoseManager from '@/components/admin/admin-pose-manager'

export const dynamic = 'force-dynamic'

export default async function AdminPosesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()

  if (!profile?.is_admin) {
    redirect('/')
  }

  const { data: poses } = await supabase
    .from('poses')
    .select('*')
    .order('name')

  return <AdminPoseManager initialPoses={poses || []} />
}
