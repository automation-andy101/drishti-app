'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import PranayamaPanel from './pranayama-panel'
import PranayamaRow from './pranayama-row'
import { Trash2, GripVertical, Plus, Play, MessageSquare, ChevronDown, ChevronUp, Pencil, Check, X, Printer } from 'lucide-react'

type Pose = {
  id: string
  name: string
  sanskrit_name: string
  difficulty: string
  body_area: string[]
  styles: string[]
}

type Cue = {
  id: string
  pose_id: string
  text: string
  is_default: boolean
  created_by: string | null
}

type SequencePoseCue = {
  id: string
  sequence_pose_id: string
  cue_id: string | null
  custom_text: string | null
  order_num: number
  cues: Cue | null
}

type SequencePose = {
  id: string
  order_num: number
  notes: string | null
  breath_count: number | null
  section: string | null
  poses: Pose
  sequence_pose_cues: SequencePoseCue[]
}

type Sequence = {
  id: string
  title: string
  style: string
  length_mins: number
  level: string
  peak_pose: string | null
}

type SectionNote = {
  id: string
  section: string
  text: string
  order_num: number
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

const DEFAULT_SECTIONS = ['Introduction', 'Pranayama', 'Warm-up', 'Standing poses', 'Peak pose', 'Cool-down', 'Final relaxation']
const NO_SECTION = 'Unsorted'

type PranayamaTechnique = {
  id: string
  name: string
  sanskrit_name: string | null
  duration_mins: number
}

type SequencePranayamaCue = {
  id: string
  cue_id: string | null
  custom_text: string | null
  cues: { id: string; text: string; is_default: boolean; created_by: string | null } | null
}

type SequencePranayamaItem = {
  id: string
  order_num: number
  duration_mins: number | null
  pranayama_techniques: PranayamaTechnique
  sequence_pranayama_cues: SequencePranayamaCue[]
}

export default function SequenceBuilder({
  sequence,
  initialPoses,
  poseLibrary,
  pranayamaLibrary,
  initialPranayama,
  initialSectionNotes,
  profileId,
}: {
  sequence: Sequence
  initialPoses: SequencePose[]
  poseLibrary: Pose[]
  pranayamaLibrary: PranayamaTechnique[]
  initialPranayama: SequencePranayamaItem[]
  initialSectionNotes: SectionNote[]
  profileId: string | null
}) {
  const router = useRouter()
  const supabase = createClient()
  const [sequencePoses, setSequencePoses] = useState<SequencePose[]>(initialPoses)
  const [search, setSearch] = useState('')
  const [activeSection, setActiveSection] = useState<string>(NO_SECTION)
  const [customSectionInput, setCustomSectionInput] = useState('')
  const [showAddSection, setShowAddSection] = useState(false)
  const [openCuePicker, setOpenCuePicker] = useState<string | null>(null)
  const [cueLibraries, setCueLibraries] = useState<Record<string, Cue[]>>({})
  const [newCueDrafts, setNewCueDrafts] = useState<Record<string, string>>({})
  const [editingCueId, setEditingCueId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [pranayamaItems, setPranayamaItems] = useState<SequencePranayamaItem[]>(initialPranayama)
  const [sectionNotes, setSectionNotes] = useState<SectionNote[]>(initialSectionNotes)
  const [newNoteDrafts, setNewNoteDrafts] = useState<Record<string, string>>({})

  async function addSectionNote(sectionName: string) {
    const text = newNoteDrafts[sectionName]?.trim()
    if (!text) return

    const notesInSection = sectionNotes.filter((n) => n.section === sectionName)
    const nextOrder = notesInSection.length

    const { data, error } = await supabase
      .from('sequence_section_notes')
      .insert({ sequence_id: sequence.id, section: sectionName, text, order_num: nextOrder })
      .select()
      .single()

    if (error) {
      console.error('Error adding note:', error)
      return
    }

    setSectionNotes((prev) => [...prev, data])
    setNewNoteDrafts((prev) => ({ ...prev, [sectionName]: '' }))
  }

  async function removeSectionNote(noteId: string) {
    await supabase.from('sequence_section_notes').delete().eq('id', noteId)
    setSectionNotes((prev) => prev.filter((n) => n.id !== noteId))
  }

  const filteredPoses = poseLibrary.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sanskrit_name?.toLowerCase().includes(search.toLowerCase())
  )

  const usedSections = Array.from(new Set(sequencePoses.map((sp) => sp.section || NO_SECTION)))

  const orderedSections = [
    ...DEFAULT_SECTIONS.filter((s) => usedSections.includes(s) || s === activeSection),
    ...usedSections.filter((s) => !DEFAULT_SECTIONS.includes(s) && s !== NO_SECTION),
    ...(activeSection !== NO_SECTION && !DEFAULT_SECTIONS.includes(activeSection) ? [activeSection] : []),
    ...(usedSections.includes(NO_SECTION) ? [NO_SECTION] : []),
  ]

  const allSectionOptions = Array.from(
    new Set([...DEFAULT_SECTIONS, ...usedSections.filter((s) => s !== NO_SECTION)])
  )

  async function addPose(pose: Pose) {
    const maxOrder = sequencePoses.length > 0 ? Math.max(...sequencePoses.map((sp) => sp.order_num)) : 0
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
      .select('*, poses(*), sequence_pose_cues(*, cues(*))')
      .single()

    if (error) {
      console.error('Insert error:', error)
      return
    }

    setSequencePoses((prev) => [...prev, { ...data, sequence_pose_cues: data.sequence_pose_cues || [] }])
  }

  async function addPranayama(technique: PranayamaTechnique) {
    const maxOrder = pranayamaItems.length > 0 ? Math.max(...pranayamaItems.map((p) => p.order_num)) : 0

    const { data, error } = await supabase
      .from('sequence_pranayama')
      .insert({
        sequence_id: sequence.id,
        pranayama_id: technique.id,
        order_num: maxOrder + 1,
        duration_mins: technique.duration_mins,
      })
      .select('*, pranayama_techniques(*), sequence_pranayama_cues(*, cues(*))')
      .single()

    if (error) {
      console.error('Error adding pranayama:', error)
      return
    }

    setPranayamaItems((prev) => [...prev, { ...data, sequence_pranayama_cues: data.sequence_pranayama_cues || [] }])
  }

  async function removePranayama(id: string) {
    await supabase.from('sequence_pranayama').delete().eq('id', id)
    setPranayamaItems((prev) => prev.filter((p) => p.id !== id))
  }

  function updatePranayamaCues(id: string, updatedCues: SequencePranayamaCue[]) {
    setPranayamaItems((prev) => prev.map((p) => (p.id === id ? { ...p, sequence_pranayama_cues: updatedCues } : p)))
  }

  function pranayamaAddedCount(techniqueId: string) {
    return pranayamaItems.filter((p) => p.pranayama_techniques.id === techniqueId).length
  }

  async function removePose(sequencePoseId: string) {
    await supabase.from('sequence_poses').delete().eq('id', sequencePoseId)
    setSequencePoses((prev) => prev.filter((sp) => sp.id !== sequencePoseId))
  }

  async function updateSection(sequencePoseId: string, newSection: string) {
    const sectionToSave = newSection === NO_SECTION ? null : newSection
    const { error } = await supabase.from('sequence_poses').update({ section: sectionToSave }).eq('id', sequencePoseId)
    if (error) {
      console.error('Update error:', error)
      return
    }
    setSequencePoses((prev) => prev.map((sp) => (sp.id === sequencePoseId ? { ...sp, section: sectionToSave } : sp)))
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

  async function loadCuesForPose(poseId: string) {
    if (cueLibraries[poseId]) return
    const { data, error } = await supabase
      .from('cues')
      .select('*')
      .eq('pose_id', poseId)
      .order('is_default', { ascending: false })
    if (error) {
      console.error('Error loading cues:', error)
      return
    }
    setCueLibraries((prev) => ({ ...prev, [poseId]: data || [] }))
  }

  function toggleCuePicker(sequencePoseId: string, poseId: string) {
    if (openCuePicker === sequencePoseId) {
      setOpenCuePicker(null)
    } else {
      setOpenCuePicker(sequencePoseId)
      loadCuesForPose(poseId)
    }
  }

  async function toggleLibraryCue(sp: SequencePose, cue: Cue) {
    const existing = (sp.sequence_pose_cues || []).find((spc) => spc.cue_id === cue.id)

    if (existing) {
      const { error } = await supabase.from('sequence_pose_cues').delete().eq('id', existing.id)
      if (error) {
        console.error('Error removing cue:', error)
        return
      }
      setSequencePoses((prev) =>
        prev.map((s) =>
          s.id === sp.id
            ? { ...s, sequence_pose_cues: (s.sequence_pose_cues || []).filter((spc) => spc.id !== existing.id) }
            : s
        )
      )
    } else {
      const nextOrder = (sp.sequence_pose_cues || []).length
      const { data, error } = await supabase
        .from('sequence_pose_cues')
        .insert({ sequence_pose_id: sp.id, cue_id: cue.id, order_num: nextOrder })
        .select('*, cues(*)')
        .single()
      if (error) {
        console.error('Error adding cue:', error)
        return
      }
      setSequencePoses((prev) =>
        prev.map((s) =>
          s.id === sp.id ? { ...s, sequence_pose_cues: [...(s.sequence_pose_cues || []), data] } : s
        )
      )
    }
  }

  async function addNewCue(sp: SequencePose) {
    const text = newCueDrafts[sp.id]?.trim()
    if (!text) return

    let savedCue: Cue | null = null
    if (profileId) {
      const { data: newCue, error: cueError } = await supabase
        .from('cues')
        .insert({ pose_id: sp.poses.id, text, is_default: false, created_by: profileId })
        .select()
        .single()
      if (cueError) {
        console.error('Error saving cue:', cueError)
        return
      }
      savedCue = newCue
      setCueLibraries((prev) => ({ ...prev, [sp.poses.id]: [...(prev[sp.poses.id] || []), newCue] }))
    }

    const nextOrder = (sp.sequence_pose_cues || []).length
    const { data, error } = await supabase
      .from('sequence_pose_cues')
      .insert({
        sequence_pose_id: sp.id,
        cue_id: savedCue?.id || null,
        custom_text: savedCue ? null : text,
        order_num: nextOrder,
      })
      .select('*, cues(*)')
      .single()

    if (error) {
      console.error('Error attaching new cue:', error)
      return
    }

    setSequencePoses((prev) =>
      prev.map((s) => (s.id === sp.id ? { ...s, sequence_pose_cues: [...(s.sequence_pose_cues || []), data] } : s))
    )
    setNewCueDrafts((prev) => ({ ...prev, [sp.id]: '' }))
  }

  function startEditingCue(cue: Cue) {
    setEditingCueId(cue.id)
    setEditDraft(cue.text)
  }

  async function saveEditedCue(poseId: string) {
    if (!editingCueId) return
    const trimmed = editDraft.trim()
    if (!trimmed) return

    const { error } = await supabase.from('cues').update({ text: trimmed }).eq('id', editingCueId)
    if (error) {
      console.error('Error editing cue:', error)
      return
    }

    setCueLibraries((prev) => ({
      ...prev,
      [poseId]: (prev[poseId] || []).map((c) => (c.id === editingCueId ? { ...c, text: trimmed } : c)),
    }))

    setSequencePoses((prev) =>
      prev.map((sp) => ({
        ...sp,
        sequence_pose_cues: (sp.sequence_pose_cues || []).map((spc) =>
          spc.cue_id === editingCueId && spc.cues ? { ...spc, cues: { ...spc.cues, text: trimmed } } : spc
        ),
      }))
    )

    setEditingCueId(null)
    setEditDraft('')
  }

  async function deleteCueFromLibrary(cue: Cue, poseId: string) {
    const confirmed = window.confirm('Delete this cue permanently from your library?')
    if (!confirmed) return

    await supabase.from('sequence_pose_cues').delete().eq('cue_id', cue.id)

    const { error } = await supabase.from('cues').delete().eq('id', cue.id)

    if (error) {
      console.error('Error deleting cue:', error)
      return
    }

    setCueLibraries((prev) => ({
      ...prev,
      [poseId]: (prev[poseId] || []).filter((c) => c.id !== cue.id),
    }))

    setSequencePoses((prev) =>
      prev.map((sp) => ({
        ...sp,
        sequence_pose_cues: (sp.sequence_pose_cues || []).filter((spc) => spc.cue_id !== cue.id),
      }))
    )
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
        <div className="flex gap-2 shrink-0">
          <Button
            onClick={() => router.push(`/sequences/${sequence.id}/print`)}
            size="sm"
            variant="outline"
            className="flex items-center gap-2"
          >
            <Printer size={14} />
            Print
          </Button>
          <Button onClick={() => router.push(`/sequences/${sequence.id}/play`)} size="sm" className="flex items-center gap-2">
            <Play size={14} />
            Start class
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-sm">Sequence — {sequencePoses.length} poses</h2>
          </div>

          <div className="flex flex-col gap-6">
            {orderedSections.map((sectionName) => {
              if (sectionName === 'Introduction') {
                const notesInSection = sectionNotes.filter((n) => n.section === sectionName)
                const isActiveEmpty = notesInSection.length === 0 && sectionName === activeSection
                if (notesInSection.length === 0 && !isActiveEmpty) return null

                return (
                  <div key={sectionName}>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                      {sectionName}
                      <span className="text-muted-foreground/60 font-normal">{notesInSection.length}</span>
                      {isActiveEmpty && <span className="text-primary font-normal normal-case">← adding here</span>}
                    </div>
                    <div className="flex flex-col gap-2 mb-2">
                      {notesInSection.map((note) => (
                        <div key={note.id} className="border rounded-lg p-3 bg-background flex items-start justify-between gap-3">
                          <p className="text-sm flex-1">{note.text}</p>
                          <button
                            onClick={() => removeSectionNote(note.id)}
                            className="text-muted-foreground hover:text-red-500 transition-colors shrink-0 cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Welcome everyone, my name is..."
                        value={newNoteDrafts[sectionName] || ''}
                        onChange={(e) => setNewNoteDrafts((prev) => ({ ...prev, [sectionName]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && addSectionNote(sectionName)}
                        className="flex-1 text-sm px-3 py-2 border rounded-md bg-background"
                      />
                      <button
                        onClick={() => addSectionNote(sectionName)}
                        className="text-sm px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )
              }

              if (sectionName === 'Pranayama') {
                const isActiveEmpty = pranayamaItems.length === 0 && sectionName === activeSection
                if (pranayamaItems.length === 0 && !isActiveEmpty) return null

                return (
                  <div key={sectionName}>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                      {sectionName}
                      <span className="text-muted-foreground/60 font-normal">{pranayamaItems.length}</span>
                      {isActiveEmpty && <span className="text-primary font-normal normal-case">← adding here</span>}
                    </div>
                    {pranayamaItems.length === 0 ? (
                      <div className="border border-dashed rounded-lg p-4 text-center text-muted-foreground text-xs">
                        Pick a breathing technique from the panel to add it here
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {pranayamaItems
                          .sort((a, b) => a.order_num - b.order_num)
                          .map((item) => (
                            <PranayamaRow
                              key={item.id}
                              item={item}
                              profileId={profileId}
                              onRemove={removePranayama}
                              onUpdate={updatePranayamaCues}
                            />
                          ))}
                      </div>
                    )}
                  </div>
                )
              }

              const posesInSection = sequencePoses.filter(
                (sp) => (sp.section || NO_SECTION) === sectionName
              )

              const isActiveEmpty = posesInSection.length === 0 && sectionName === activeSection

              if (posesInSection.length === 0 && !isActiveEmpty) return null

              return (
                <div key={sectionName}>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                    {sectionName}
                    <span className="text-muted-foreground/60 font-normal">
                      {posesInSection.length}
                    </span>
                    {isActiveEmpty && (
                      <span className="text-primary font-normal normal-case">← adding here</span>
                    )}
                  </div>
                  {posesInSection.length === 0 ? (
                    <div className="border border-dashed rounded-lg p-4 text-center text-muted-foreground text-xs">
                      Pick a pose from the library to add it here
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {posesInSection.map((sp) => {
                        const primaryArea = sp.poses.body_area?.[0] || 'BALANCE'
                        const color = bodyAreaColors[primaryArea] || 'bg-gray-100'
                        const cuePickerOpen = openCuePicker === sp.id
                        const stackedCues = sp.sequence_pose_cues || []
                        const fullCueLibrary = cueLibraries[sp.poses.id] || []
                        const checkedCueIds = new Set(stackedCues.map((spc) => spc.cue_id).filter(Boolean))

                        return (
                          <div key={sp.id} className="border rounded-lg bg-background overflow-hidden">
                            <div className="flex items-center gap-3 p-3">
                              <GripVertical size={16} className="text-muted-foreground shrink-0" />
                              <div className={`w-8 h-8 rounded-md ${color} shrink-0`} />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">{sp.poses.name}</div>
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

                              <span className="text-xs text-muted-foreground shrink-0">#{sp.order_num}</span>
                              <button onClick={() => removePose(sp.id)} className="text-muted-foreground hover:text-red-500 transition-colors shrink-0">
                                <Trash2 size={14} />
                              </button>
                            </div>

                            <div className="border-t bg-secondary/40">
                              <button
                                onClick={() => toggleCuePicker(sp.id, sp.poses.id)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-secondary/70 transition-colors"
                              >
                                <MessageSquare size={13} className="text-muted-foreground shrink-0" />
                                {stackedCues.length > 0 ? (
                                  <span className="flex-1 text-foreground">
                                    {stackedCues.length} cue{stackedCues.length > 1 ? 's' : ''} added
                                  </span>
                                ) : (
                                  <span className="flex-1 text-muted-foreground">Add teaching cues…</span>
                                )}
                                {cuePickerOpen ? <ChevronUp size={13} className="text-muted-foreground shrink-0" /> : <ChevronDown size={13} className="text-muted-foreground shrink-0" />}
                              </button>

                              {cuePickerOpen && (
                                <div className="px-3 pb-3 pt-1">
                                  <div className="flex flex-col gap-1 mb-2">
                                    {fullCueLibrary.map((cue) => {
                                      const isChecked = checkedCueIds.has(cue.id)
                                      const isEditing = editingCueId === cue.id

                                      return (
                                        <div
                                          key={cue.id}
                                          className={`flex items-start gap-2 text-xs px-2.5 py-1.5 rounded-md ${
                                            isChecked ? 'bg-green-50' : ''
                                          }`}
                                        >
                                          {isEditing ? (
                                            <>
                                              <input
                                                type="text"
                                                value={editDraft}
                                                onChange={(e) => setEditDraft(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && saveEditedCue(sp.poses.id)}
                                                autoFocus
                                                className="flex-1 text-xs px-1.5 py-1 border rounded-md bg-background"
                                              />
                                              <button onClick={() => saveEditedCue(sp.poses.id)} className="text-green-600 shrink-0">
                                                <Check size={14} />
                                              </button>
                                              <button onClick={() => setEditingCueId(null)} className="text-muted-foreground shrink-0">
                                                <X size={14} />
                                              </button>
                                            </>
                                          ) : (
                                            <>
                                              <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => toggleLibraryCue(sp, cue)}
                                                className="mt-0.5 shrink-0"
                                              />
                                              <label
                                                onClick={() => toggleLibraryCue(sp, cue)}
                                                className="flex-1 cursor-pointer"
                                              >
                                                {cue.text}
                                                {!cue.is_default && <span className="text-muted-foreground ml-1">· yours</span>}
                                              </label>
                                              {!cue.is_default && (
                                                <div className="flex gap-1 shrink-0">
                                                  <button
                                                    onClick={() => startEditingCue(cue)}
                                                    className="text-muted-foreground hover:text-foreground"
                                                  >
                                                    <Pencil size={12} />
                                                  </button>
                                                  <button
                                                    onClick={() => deleteCueFromLibrary(cue, sp.poses.id)}
                                                    className="text-muted-foreground hover:text-red-500"
                                                  >
                                                    <Trash2 size={12} />
                                                  </button>
                                                </div>
                                              )}
                                            </>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>

                                  <div className="flex gap-1.5">
                                    <input
                                      type="text"
                                      placeholder="Write your own cue…"
                                      value={newCueDrafts[sp.id] || ''}
                                      onChange={(e) => setNewCueDrafts((prev) => ({ ...prev, [sp.id]: e.target.value }))}
                                      onKeyDown={(e) => e.key === 'Enter' && addNewCue(sp)}
                                      className="flex-1 text-xs px-2 py-1.5 border rounded-md bg-background"
                                    />
                                    <button
                                      onClick={() => addNewCue(sp)}
                                      className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-md shrink-0"
                                    >
                                      Add
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <div>
            <h2 className="font-medium text-sm mb-3">
              {activeSection === 'Pranayama' ? 'Breathing techniques' : 'Pose library'}
            </h2>

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
                      activeSection === s ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-secondary'
                    }`}
                  >
                    {s}
                  </button>
                ))}
                {Array.from(
                  new Set([
                    ...usedSections.filter((s) => !DEFAULT_SECTIONS.includes(s) && s !== NO_SECTION),
                    ...(activeSection !== NO_SECTION && !DEFAULT_SECTIONS.includes(activeSection) ? [activeSection] : []),
                  ])
                ).map((s) => (
                  <button
                    key={s}
                    onClick={() => setActiveSection(s)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      activeSection === s ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-secondary'
                    }`}
                  >
                    {s}
                  </button>
                ))}
                <button
                  onClick={() => setActiveSection(NO_SECTION)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    activeSection === NO_SECTION ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-secondary'
                  }`}
                >
                  Unsorted
                </button>
              </div>

              {!showAddSection ? (
                <button onClick={() => setShowAddSection(true)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
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
                  <button onClick={addCustomSection} className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded-md">
                    Add
                  </button>
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-2">
                New poses will be added to <span className="font-medium">{activeSection}</span>
              </p>
            </div>

            {activeSection === 'Pranayama' ? (
              <PranayamaPanel
                techniques={pranayamaLibrary}
                onAdd={addPranayama}
                addedCount={pranayamaAddedCount}
              />
            ) : (
              <>
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
                    const timesAdded = sequencePoses.filter((sp) => sp.poses.id === pose.id).length

                    return (
                      <div
                        key={pose.id}
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-secondary transition-colors cursor-pointer group"
                        onClick={() => addPose(pose)}
                      >
                        <div className={`w-7 h-7 rounded ${color} shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{pose.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{pose.sanskrit_name}</div>
                        </div>
                        {timesAdded > 0 && (
                          <span className="text-xs text-muted-foreground shrink-0 bg-secondary px-1.5 py-0.5 rounded-full">×{timesAdded}</span>
                        )}
                        <Plus size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0" />
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
