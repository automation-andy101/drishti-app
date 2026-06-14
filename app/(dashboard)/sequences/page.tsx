import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const styleColors: Record<string, string> = {
  VINYASA: 'bg-green-100 text-green-700',
  HATHA: 'bg-blue-100 text-blue-700',
  ASHTANGA: 'bg-orange-100 text-orange-700',
  YIN: 'bg-purple-100 text-purple-700',
  RESTORATIVE: 'bg-pink-100 text-pink-700',
  POWER: 'bg-red-100 text-red-700',
  KUNDALINI: 'bg-yellow-100 text-yellow-700',
}

export default async function SequencesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: sequences, error } = await supabase
    .from('sequences')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
    return <div>Error loading sequences</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium">Sequences</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {sequences.length} sequences
          </p>
        </div>
        <Link
          href="/sequences/new"
          className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium"
        >
          + New sequence
        </Link>
      </div>

      {sequences.length === 0 ? (
        <div className="border rounded-lg p-12 text-center">
          <div className="text-4xl mb-3">🌱</div>
          <h2 className="font-medium mb-1">No sequences yet</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first yoga class sequence
          </p>
          <Link
            href="/sequences/new"
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium"
          >
            + New sequence
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sequences.map((sequence) => (
            <Link
              key={sequence.id}
              href={`/sequences/${sequence.id}`}
              className="border rounded-lg p-4 hover:border-primary transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium">{sequence.title}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styleColors[sequence.style] || 'bg-gray-100 text-gray-700'}`}>
                  {sequence.style.charAt(0) + sequence.style.slice(1).toLowerCase()}
                </span>
              </div>
              {sequence.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {sequence.description}
                </p>
              )}
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span>⏱ {sequence.length_mins} min</span>
                <span>·</span>
                <span>📊 {sequence.level.replace('_', ' ').toLowerCase()}</span>
                {sequence.peak_pose && (
                  <>
                    <span>·</span>
                    <span>🎯 {sequence.peak_pose}</span>
                  </>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
