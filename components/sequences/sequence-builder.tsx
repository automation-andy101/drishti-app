'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Trash2, GripVertical, Plus, Play } from 'lucide-react'

type Pose = {
  id: string
  name: string
  sanskrit_name: string
  difficulty: string
  body_area: string[]
  styles: string[]
}

type SequencePose = {
  id: string
  order_num: number
  notes: string | null
  breath_count: number | null
  poses: Pose
}

type Sequence = {
  id: string
  title: string
  style: string
  length_mins: number
  level: string
  peak_pose: string | null
}

const bodyAreaColors: Record<string, string> = {
  HIPS: 'bg-purple-100',
  HAMSTRINGS: 'bg-blue-100',
  BACKBENDS: 'bg-orange-100',
  CORE: 'bg-yellow-100',
  SHOULDERS: 'bg-green-100',
  INVERSIONS: 'bg-pink-100',
  TWISTS: 'bg-teal-100',
  BALANCE: 'bg-indigo-100',
  CHEST: 'bg-red-100',
  FORWARD_FOLDS: 'bg-emerald-100',
}

export default function SequenceBuilder({
  sequence,
  initialPoses,
  poseLibrary,
}: {
  sequence: Sequence
  initialPoses: SequencePose[]
  poseLibrary: Pose[]
}) {
  const router = useRouter()
  const supabase = createClient()
  const [sequencePoses, setSequencePoses] = useState<SequencePose[]>(initialPoses)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const filteredPoses = poseLibrary.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sanskrit_name?.toLowerCase().includes(search.toLowerCase())
  )

  async function addPose(pose: Pose) {
    const nextOrder = sequencePoses.length + 1

    const { data, error } = await supabase
      .from('sequence_poses')
      .insert({
        sequence_id: sequence.id,
        pose_id: pose.id,
        order_num: nextOrder,
        breath_count: 5,
      })
      .select('*, poses(*)')
      .single()

    if (error) {
      console.error(error)
      return
    }

    setSequencePoses([...sequencePoses, data])
  }

  async function removePose(sequencePoseId: string) {
    await supabase
      .from('sequence_poses')
      .delete()
      .eq('id', sequencePoseId)

    const updated = sequencePoses
      .filter((sp) => sp.id !== sequencePoseId)
      .map((sp, i) => ({ ...sp, order_num: i + 1 }))

    setSequencePoses(updated)
  }

  function formatLabel(str: string) {
    return str.replace('_', ' ').charAt(0) + str.replace('_', ' ').slice(1).toLowerCase()
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-medium">{sequence.title}</h1>
          <div className="flex gap-3 text-sm text-muted-foreground mt-1">
            <span>{formatLabel(sequence.style)}</span>
            <span>·</span>
            <span>{sequence.length_mins} min</span>
            <span>·</span>
            <span>{formatLabel(sequence.level)}</span>
            {sequence.peak_pose && (
              <>
                <span>·</span>
                <span>🎯 {sequence.peak_pose}</span>
              </>
            )}
          </div>
        </div>
        <Button
          onClick={() => router.push(`/sequences/${sequence.id}/play`)}
          size="sm"
          className="flex items-center gap-2 shrink-0"
        >
          <Play size={14} />
          Start class
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sequence list */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-sm">
              Sequence — {sequencePoses.length} poses
            </h2>
          </div>

          {sequencePoses.length === 0 ? (
            <div className="border rounded-lg p-8 text-center text-muted-foreground">
              <div className="text-3xl mb-2">🧘</div>
              <p className="text-sm">Add poses from the library →</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {sequencePoses.map((sp) => {
                const primaryArea = sp.poses.body_area?.[0] || 'BALANCE'
                const color = bodyAreaColors[primaryArea] || 'bg-gray-100'

                return (
                  <div
                    key={sp.id}
                    className="flex items-center gap-3 border rounded-lg p-3 bg-background"
                  >
                    <GripVertical size={16} className="text-muted-foreground shrink-0" />
                    <div className={`w-8 h-8 rounded-md ${color} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {sp.poses.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {sp.poses.sanskrit_name} · {sp.breath_count} breaths
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      #{sp.order_num}
                    </span>
                    <button
                      onClick={() => removePose(sp.id)}
                      className="text-muted-foreground hover:text-red-500 transition-colors shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Pose library */}
        <div>
          <h2 className="font-medium text-sm mb-3">Pose library</h2>
          <input
            type="text"
            placeholder="Search poses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm px-3 py-2 border rounded-md mb-3 bg-background"
          />
          <div className="flex flex-col gap-1.5 max-h-[60vh] overflow-y-auto pr-1">
            {filteredPoses.map((pose) => {
              const primaryArea = pose.body_area?.[0] || 'BALANCE'
              const color = bodyAreaColors[primaryArea] || 'bg-gray-100'
              const alreadyAdded = sequencePoses.some(
                (sp) => sp.poses.id === pose.id
              )

              return (
                <div
                  key={pose.id}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-secondary transition-colors cursor-pointer group"
                  onClick={() => !alreadyAdded && addPose(pose)}
                >
                  <div className={`w-7 h-7 rounded ${color} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{pose.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {pose.sanskrit_name}
                    </div>
                  </div>
                  {alreadyAdded ? (
                    <span className="text-xs text-muted-foreground shrink-0">✓</span>
                  ) : (
                    <Plus
                      size={14}
                      className="text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0"
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}