import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="pt-14">
      <div className="mb-8">
        <h1 className="text-2xl font-medium">Good morning 🧘</h1>
        <p className="text-muted-foreground mt-1">{user?.email}</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Sequences</div>
          <div className="text-3xl font-medium">0</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Classes taught</div>
          <div className="text-3xl font-medium">0</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Saved poses</div>
          <div className="text-3xl font-medium">0</div>
        </div>
      </div>

      <div className="border rounded-lg p-6 text-center">
        <div className="text-4xl mb-3">🌱</div>
        <h2 className="font-medium mb-1">Create your first sequence</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Build a yoga class by choosing a style, length and poses
        </p>
        <Link
            href="/sequences/new"
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium"
        >
            + New sequence
        </Link>
      </div>
    </div>
  )
}