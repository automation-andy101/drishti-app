import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/sidebar'
import Navbar from '@/components/layout/navbar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 ml-56">
          {children}
        </main>
      </div>
    </div>
  )
}
