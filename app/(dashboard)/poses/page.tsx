import { createClient } from '@/lib/supabase/server'

const bodyAreaConfig: Record<string, { color: string; emoji: string }> = {
  HIPS: { color: 'bg-purple-100', emoji: '🦋' },
  HAMSTRINGS: { color: 'bg-blue-100', emoji: '🦵' },
  BACKBENDS: { color: 'bg-orange-100', emoji: '🌈' },
  CORE: { color: 'bg-yellow-100', emoji: '⚡' },
  SHOULDERS: { color: 'bg-green-100', emoji: '💪' },
  INVERSIONS: { color: 'bg-pink-100', emoji: '🙃' },
  TWISTS: { color: 'bg-teal-100', emoji: '🌀' },
  BALANCE: { color: 'bg-indigo-100', emoji: '🌳' },
  CHEST: { color: 'bg-red-100', emoji: '❤️' },
  FORWARD_FOLDS: { color: 'bg-emerald-100', emoji: '🌿' },
}

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium">Pose library</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {poses.length} poses available
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-6">
        {['All', 'Beginner', 'Intermediate', 'Advanced'].map((level) => (
          <span
            key={level}
            className="px-3 py-1 rounded-full border text-sm cursor-pointer hover:bg-secondary"
          >
            {level}
          </span>
        ))}
      </div>

      {/* Pose grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {poses.map((pose) => {
          const primaryArea = pose.body_area?.[0] || 'BALANCE'
          const config = bodyAreaConfig[primaryArea] || { color: 'bg-gray-100', emoji: '🧘' }

          return (
            <div
              key={pose.id}
              className="border rounded-lg overflow-hidden hover:border-primary transition-colors cursor-pointer"
            >
              {/* Image placeholder */}
              <div className={`${pose.image_url ? 'bg-white' : config.color} h-52 flex items-center justify-center overflow-hidden`}>
                {pose.image_url ? (
                  <img
                    src={pose.image_url}
                    alt={pose.name}
                    className="h-full w-full object-contain p-2"
                  />
                ) : (
                  <span className="text-5xl">{config.emoji}</span>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <h3 className="font-medium">{pose.name}</h3>
                    <p className="text-xs text-muted-foreground italic">
                      {pose.sanskrit_name}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    pose.difficulty === 'BEGINNER'
                      ? 'bg-green-100 text-green-700'
                      : pose.difficulty === 'INTERMEDIATE'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {pose.difficulty.charAt(0) + pose.difficulty.slice(1).toLowerCase()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {pose.description}
                </p>
                <div className="flex gap-1 flex-wrap">
                  {pose.body_area?.map((area: string) => (
                    <span
                      key={area}
                      className="text-xs px-2 py-0.5 bg-secondary rounded-full"
                    >
                      {area.replace('_', ' ').toLowerCase()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
