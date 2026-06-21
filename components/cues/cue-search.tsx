'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react'

type Pose = {
  id: string
  name: string
  sanskrit_name: string
  body_area: string[]
}

type Cue = {
  id: string
  text: string
  is_default: boolean
  created_by: string | null
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

export default function CueSearch({ poses, profileId }: { poses: Pose[]; profileId: string | null }) {
  const supabase = createClient()
  const [selectedPoseId, setSelectedPoseId] = useState<string>('')
  const [search, setSearch] = useState('')
  const [cues, setCues] = useState<Cue[]>([])
  const [loading, setLoading] = useState(false)
  const [newCueText, setNewCueText] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingCueId, setEditingCueId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')

  const filteredPoses = poses.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sanskrit_name?.toLowerCase().includes(search.toLowerCase())
  )

  const selectedPose = poses.find((p) => p.id === selectedPoseId)

  async function selectPose(poseId: string) {
    setSelectedPoseId(poseId)
    setLoading(true)

    const { data, error } = await supabase
      .from('cues')
      .select('*')
      .eq('pose_id', poseId)
      .order('is_default', { ascending: false })

    if (error) {
      console.error('Error loading cues:', error)
      setCues([])
    } else {
      setCues(data || [])
    }
    setLoading(false)
  }

  async function addNewCue() {
    const text = newCueText.trim()
    if (!text || !selectedPoseId || !profileId) return

    setSaving(true)

    const { data, error } = await supabase
      .from('cues')
      .insert({
        pose_id: selectedPoseId,
        text,
        is_default: false,
        created_by: profileId,
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding cue:', error)
      setSaving(false)
      return
    }

    setCues((prev) => [...prev, data])
    setNewCueText('')
    setSaving(false)
  }

  async function deleteCue(cueId: string) {
    const confirmed = window.confirm('Delete this cue permanently? It will be removed from your library and any sequences using it.')
    if (!confirmed) return

    // Clean up any sequence_pose_cues rows referencing this cue first
    await supabase.from('sequence_pose_cues').delete().eq('cue_id', cueId)

    const { error } = await supabase.from('cues').delete().eq('id', cueId)

    if (error) {
      console.error('Error deleting cue:', error)
      return
    }

    setCues((prev) => prev.filter((c) => c.id !== cueId))
  }

  function startEditingCue(cue: Cue) {
    setEditingCueId(cue.id)
    setEditDraft(cue.text)
  }

  async function saveEditedCue() {
    if (!editingCueId) return
    const trimmed = editDraft.trim()
    if (!trimmed) return

    const { error } = await supabase.from('cues').update({ text: trimmed }).eq('id', editingCueId)

    if (error) {
      console.error('Error editing cue:', error)
      return
    }

    setCues((prev) => prev.map((c) => (c.id === editingCueId ? { ...c, text: trimmed } : c)))
    setEditingCueId(null)
    setEditDraft('')
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-medium">Cue search</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Browse and add teaching cues for any pose in your library
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
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
              const isSelected = selectedPoseId === pose.id

              return (
                <button
                  key={pose.id}
                  onClick={() => selectPose(pose.id)}
                  className={`flex items-center gap-2 p-2 rounded-md transition-colors text-left ${
                    isSelected ? 'bg-secondary border border-primary' : 'hover:bg-secondary'
                  }`}
                >
                  <div className={`w-7 h-7 rounded ${color} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{pose.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{pose.sanskrit_name}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="lg:col-span-2">
          {!selectedPose ? (
            <div className="border rounded-lg p-12 text-center text-muted-foreground">
              <div className="text-3xl mb-2">💬</div>
              <p className="text-sm">Select a pose to see its teaching cues</p>
            </div>
          ) : loading ? (
            <div className="border rounded-lg p-12 text-center text-muted-foreground">
              <p className="text-sm">Loading cues...</p>
            </div>
          ) : (
            <div>
              <h2 className="font-medium mb-1">{selectedPose.name}</h2>
              <p className="text-sm text-muted-foreground mb-4">{selectedPose.sanskrit_name}</p>

              <div className="flex flex-col gap-2 mb-4">
                {cues.map((cue) => {
                  const isEditing = editingCueId === cue.id

                  return (
                    <div key={cue.id} className="border rounded-lg p-3 text-sm flex items-start justify-between gap-3">
                      {isEditing ? (
                        <>
                          <input
                            type="text"
                            value={editDraft}
                            onChange={(e) => setEditDraft(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveEditedCue()}
                            autoFocus
                            className="flex-1 text-sm px-2 py-1 border rounded-md bg-background"
                          />
                          <button onClick={saveEditedCue} className="text-green-600 hover:text-green-700 cursor-pointer shrink-0">
                            <Check size={16} />
                          </button>
                          <button onClick={() => setEditingCueId(null)} className="text-muted-foreground hover:text-foreground cursor-pointer shrink-0">
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1">
                            {cue.text}
                            {!cue.is_default && (
                              <span className="text-xs text-muted-foreground ml-2">· yours</span>
                            )}
                            {cue.is_default && (
                              <span className="text-xs text-muted-foreground ml-2">· default</span>
                            )}
                          </span>
                          {!cue.is_default && (
                            <div className="flex gap-2 shrink-0">
                              <button
                                onClick={() => startEditingCue(cue)}
                                className="text-muted-foreground hover:text-foreground cursor-pointer"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => deleteCue(cue.id)}
                                className="text-muted-foreground hover:text-red-500 cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="border-t pt-4">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                  Add a new cue for {selectedPose.name}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Write a teaching cue…"
                    value={newCueText}
                    onChange={(e) => setNewCueText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addNewCue()}
                    className="flex-1 text-sm px-3 py-2 border rounded-md bg-background"
                  />
                  <button
                    onClick={addNewCue}
                    disabled={saving || !newCueText.trim()}
                    className="px-4 py-2 cursor-pointer bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                  >
                    <Plus size={14} />
                    {saving ? 'Saving...' : 'Add'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}