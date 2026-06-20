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
  section: string | null
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

const DEFAULT_SECTIONS = ['Warm-up', 'Standing poses', 'Peak pose', 'Cool-down', 'Final relaxation']
const NO_SECTION = 'Unsorted'

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
  const [activeSection, setActiveSection] = useState<string>(NO_SECTION)
  const [customSectionInput, setCustomSectionInput] = useState('')
  const [showAddSection, setShowAddSection] = useState(false)

  const filteredPoses = poseLibrary.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sanskrit_name?.toLowerCase().includes(search.toLowerCase())
  )

  const usedSections = Array.from(
    new Set(sequencePoses.map((sp) => sp.section || NO_SECTION))
  )

  const orderedSections = [
    ...DEFAULT_SECTIONS.filter((s) => usedSections.includes(s)),
    ...usedSections.filter((s) => !DEFAULT_SECTIONS.includes(s) && s !== NO_SECTION),
    ...(usedSections.includes(NO_SECTION) ? [NO_SECTION] : []),
  ]

  const allSectionOptions = Array.from(
    new Set([...DEFAULT_SECTIONS, ...usedSections.filter((s) => s !== NO_SECTION)])
  )

  async function addPose(pose: Pose) {
    const maxOrder = sequencePoses.length > 0
      ? Math.max(...sequencePoses.map((sp) => sp.order_num))
      : 0
    const nextOrder = maxOrder + 1

    const sectionToUse = activeSection === NO_SECTION ? null : activeSection

    const { data, error } = await supabase
      .from('sequence_poses')
      .insert({
        sequence_id: sequence.id,
        pose_id: pose.id,
        order_num: nextOrder,
        breath_count: 5,
        section: sectionToUse,
      })
      .select('*, poses(*)')
      .single()

    if (error) {
      console.error('Insert error:', JSON.stringify(error, null, 2))
      return
    }

    setSequencePoses((prev) => [...prev, data])
  }

  async function removePose(sequencePoseId: string) {
    await supabase
      .from('sequence_poses')
      .delete()
      .eq('id', sequencePoseId)

    setSequencePoses((prev) => prev.filter((sp) => sp.id !== sequencePoseId))
  }

  async function updateSection(sequencePoseId: string, newSection: string) {
    const sectionToSave = newSection === NO_SECTION ? null : newSection

    const { error } = await supabase
      .from('sequence_poses')
      .update({ section: sectionToSave })
      .eq('id', sequencePoseId)

    if (error) {
      console.error('Update error:', JSON.stringify(error, null, 2))
      return
    }

    setSequencePoses((prev) =>
      prev.map((sp) =>
        sp.id === sequencePoseId ? { ...sp, section: sectionToSave } : sp
      )
    )
  }

  function addCustomSection() {
    const trimmed = customSectionInput.trim()
    if (!trimmed) return
    setActiveSection(trimmed)
    setCustomSectionInput('')
    setShowAddSection(false)
  }

  function formatLabel(str: string) {
    return str.replace('_', ' ').charAt(0) + str.replace('_', ' ').slice(1).toLowerCase()
  }

  return (
    <div>
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
            <div className="flex flex-col gap-6">
              {orderedSections.map((sectionName) => {
                const posesInSection = sequencePoses.filter(
                  (sp) => (sp.section || NO_SECTION) === sectionName
                )
                if (posesInSection.length === 0) return null

                return (
                  <div key={sectionName}>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                      {sectionName}
                      <span className="ml-2 text-muted-foreground/60 font-normal">
                        {posesInSection.length}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {posesInSection.map((sp) => {
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

                            <select
                              value={sp.section || NO_SECTION}
                              onChange={(e) => updateSection(sp.id, e.target.value)}
                              className="text-xs border rounded-md px-1.5 py-1 bg-background text-muted-foreground shrink-0 max-w-[110px]"
                            >
                              <option value={NO_SECTION}>Unsorted</option>
                              {allSectionOptions.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>

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
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-medium text-sm mb-3">Pose library</h2>

          <div className="mb-3">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
              Add poses to
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {DEFAULT_SECTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setActiveSection(s)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    activeSection === s
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'hover:bg-secondary'
                  }`}
                >
                  {s}
                </button>
              ))}
              {Array.from(new Set([
                ...usedSections.filter((s) => !DEFAULT_SECTIONS.includes(s) && s !== NO_SECTION),
                ...(activeSection !== NO_SECTION && !DEFAULT_SECTIONS.includes(activeSection) ? [activeSection] : []),
              ])).map((s) => (
                <button
                  key={s}
                  onClick={() => setActiveSection(s)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    activeSection === s
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'hover:bg-secondary'
                  }`}
                >
                  {s}
                </button>
              ))}
              <button
                onClick={() => setActiveSection(NO_SECTION)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  activeSection === NO_SECTION
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'hover:bg-secondary'
                }`}
              >
                Unsorted
              </button>
            </div>

            {!showAddSection ? (
              <button
                onClick={() => setShowAddSection(true)}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <Plus size={12} />
                Add custom section
              </button>
            ) : (
              <div className="flex gap-1.5">
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. Core work"
                  value={customSectionInput}
                  onChange={(e) => setCustomSectionInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomSection()}
                  className="flex-1 text-xs px-2 py-1 border rounded-md bg-background"
                />
                <button
                  onClick={addCustomSection}
                  className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded-md"
                >
                  Add
                </button>
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-2">
              New poses will be added to <span className="font-medium">{activeSection}</span>
            </p>
          </div>

          <input
            type="text"
            placeholder="Search poses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm px-3 py-2 border rounded-md mb-3 bg-background"
          />
          <div className="flex flex-col gap-1.5 max-h-[50vh] overflow-y-auto pr-1">
            {filteredPoses.map((pose) => {
              const primaryArea = pose.body_area?.[0] || 'BALANCE'
              const color = bodyAreaColors[primaryArea] || 'bg-gray-100'
              const timesAdded = sequencePoses.filter(
                (sp) => sp.poses.id === pose.id
              ).length

              return (
                <div
                  key={pose.id}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-secondary transition-colors cursor-pointer group"
                  onClick={() => addPose(pose)}
                >
                  <div className={`w-7 h-7 rounded ${color} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{pose.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {pose.sanskrit_name}
                    </div>
                  </div>
                  {timesAdded > 0 && (
                    <span className="text-xs text-muted-foreground shrink-0 bg-secondary px-1.5 py-0.5 rounded-full">
                      ×{timesAdded}
                    </span>
                  )}
                  <Plus
                    size={14}
                    className="text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0"
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
