import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user?.id)
    .single()

  let sequences: any[] = []
  let sequenceCount = 0
  let savedPoseCuesCount = 0

  if (profile) {
    const { data: seqData, count } = await supabase
      .from('sequences')
      .select('*', { count: 'exact' })
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(3)

    sequences = seqData || []
    sequenceCount = count || 0

    const { count: cueCount } = await supabase
      .from('cues')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', profile.id)

    savedPoseCuesCount = cueCount || 0
  }

  const styleColors: Record<string, string> = {
    VINYASA: 'bg-green-100 text-green-700',
    HATHA: 'bg-blue-100 text-blue-700',
    ASHTANGA: 'bg-orange-100 text-orange-700',
    YIN: 'bg-purple-100 text-purple-700',
    RESTORATIVE: 'bg-pink-100 text-pink-700',
    POWER: 'bg-red-100 text-red-700',
    KUNDALINI: 'bg-yellow-100 text-yellow-700',
  }

  function formatLabel(str: string) {
    return str.replace('_', ' ').charAt(0) + str.replace('_', ' ').slice(1).toLowerCase()
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-medium">Good morning 🧘</h1>
        <p className="text-muted-foreground mt-1">{user?.email}</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Sequences</div>
          <div className="text-3xl font-medium">{sequenceCount}</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Classes taught</div>
          <div className="text-3xl font-medium">0</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Saved cues</div>
          <div className="text-3xl font-medium">{savedPoseCuesCount}</div>
        </div>
      </div>

      {sequences.length === 0 ? (
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
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-sm">Recent sequences</h2>
            <Link href="/sequences" className="text-sm text-muted-foreground hover:text-foreground">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sequences.map((sequence) => (
              <Link
                key={sequence.id}
                href={`/sequences/${sequence.id}`}
                className="border rounded-lg p-4 hover:border-primary transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium">{sequence.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styleColors[sequence.style] || 'bg-gray-100 text-gray-700'}`}>
                    {formatLabel(sequence.style)}
                  </span>
                </div>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span>⏱ {sequence.length_mins} min</span>
                  <span>·</span>
                  <span>📊 {formatLabel(sequence.level)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}