'use client'

type Technique = {
  id: string
  name: string
  sanskrit_name: string | null
  duration_mins: number
}

export default function PranayamaPanel({
  techniques,
  onAdd,
  addedCount,
}: {
  techniques: Technique[]
  onAdd: (technique: Technique) => void
  addedCount: (techniqueId: string) => number
}) {
  return (
    <div className="flex flex-col gap-1.5 max-h-[50vh] overflow-y-auto pr-1">
      {techniques.map((technique) => {
        const timesAdded = addedCount(technique.id)

        return (
          <div
            key={technique.id}
            className="flex items-center gap-2 p-2 rounded-md hover:bg-secondary transition-colors cursor-pointer group"
            onClick={() => onAdd(technique)}
          >
            <div className="w-7 h-7 rounded bg-cyan-100 shrink-0 flex items-center justify-center text-sm">
              🌬️
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{technique.name}</div>
              <div className="text-xs text-muted-foreground truncate">
                {technique.sanskrit_name || `${technique.duration_mins} min`}
              </div>
            </div>
            {timesAdded > 0 && (
              <span className="text-xs text-muted-foreground shrink-0 bg-secondary px-1.5 py-0.5 rounded-full">
                ×{timesAdded}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
