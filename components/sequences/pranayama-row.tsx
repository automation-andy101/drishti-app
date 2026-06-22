'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trash2, MessageSquare, ChevronDown, ChevronUp, Pencil, Check, X } from 'lucide-react'

type Cue = {
  id: string
  text: string
  is_default: boolean
  created_by: string | null
}

type SequencePranayamaCue = {
  id: string
  cue_id: string | null
  custom_text: string | null
  cues: Cue | null
}

type SequencePranayama = {
  id: string
  order_num: number
  duration_mins: number | null
  pranayama_techniques: {
    id: string
    name: string
    sanskrit_name: string | null
  }
  sequence_pranayama_cues: SequencePranayamaCue[]
}

export default function PranayamaRow({
  item,
  profileId,
  onRemove,
  onUpdate,
}: {
  item: SequencePranayama
  profileId: string | null
  onRemove: (id: string) => void
  onUpdate: (id: string, updatedCues: SequencePranayamaCue[]) => void
}) {
  const supabase = createClient()
  const [cuePickerOpen, setCuePickerOpen] = useState(false)
  const [cueLibrary, setCueLibrary] = useState<Cue[] | null>(null)
  const [newCueText, setNewCueText] = useState('')
  const [editingCueId, setEditingCueId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')

  const stackedCues = item.sequence_pranayama_cues || []
  const checkedCueIds = new Set(stackedCues.map((c) => c.cue_id).filter(Boolean))

  async function loadCues() {
    if (cueLibrary) return
    const { data } = await supabase
      .from('cues')
      .select('*')
      .eq('pranayama_id', item.pranayama_techniques.id)
      .order('is_default', { ascending: false })
    setCueLibrary(data || [])
  }

  function togglePicker() {
    setCuePickerOpen((open) => !open)
    if (!cuePickerOpen) loadCues()
  }

  async function toggleCue(cue: Cue) {
    const existing = stackedCues.find((c) => c.cue_id === cue.id)
    if (existing) {
      await supabase.from('sequence_pranayama_cues').delete().eq('id', existing.id)
      onUpdate(item.id, stackedCues.filter((c) => c.id !== existing.id))
    } else {
      const { data } = await supabase
        .from('sequence_pranayama_cues')
        .insert({ sequence_pranayama_id: item.id, cue_id: cue.id, order_num: stackedCues.length })
        .select('*, cues(*)')
        .single()
      if (data) onUpdate(item.id, [...stackedCues, data])
    }
  }

  async function addNewCue() {
    const text = newCueText.trim()
    if (!text) return

    let savedCue: Cue | null = null
    if (profileId) {
      const { data } = await supabase
        .from('cues')
        .insert({ pranayama_id: item.pranayama_techniques.id, text, is_default: false, created_by: profileId })
        .select()
        .single()
      savedCue = data
      if (savedCue) setCueLibrary((prev) => [...(prev || []), savedCue!])
    }

    const { data } = await supabase
      .from('sequence_pranayama_cues')
      .insert({
        sequence_pranayama_id: item.id,
        cue_id: savedCue?.id || null,
        custom_text: savedCue ? null : text,
        order_num: stackedCues.length,
      })
      .select('*, cues(*)')
      .single()

    if (data) onUpdate(item.id, [...stackedCues, data])
    setNewCueText('')
  }

  function startEdit(cue: Cue) {
    setEditingCueId(cue.id)
    setEditDraft(cue.text)
  }

  async function saveEdit() {
    if (!editingCueId) return
    const trimmed = editDraft.trim()
    if (!trimmed) return

    await supabase.from('cues').update({ text: trimmed }).eq('id', editingCueId)
    setCueLibrary((prev) => (prev || []).map((c) => (c.id === editingCueId ? { ...c, text: trimmed } : c)))
    onUpdate(
      item.id,
      stackedCues.map((c) => (c.cue_id === editingCueId && c.cues ? { ...c, cues: { ...c.cues, text: trimmed } } : c))
    )
    setEditingCueId(null)
    setEditDraft('')
  }

  async function deleteCue(cue: Cue) {
    const confirmed = window.confirm('Delete this cue permanently from your library?')
    if (!confirmed) return

    await supabase.from('sequence_pranayama_cues').delete().eq('cue_id', cue.id)
    await supabase.from('cues').delete().eq('id', cue.id)

    setCueLibrary((prev) => (prev || []).filter((c) => c.id !== cue.id))
    onUpdate(item.id, stackedCues.filter((c) => c.cue_id !== cue.id))
  }

  return (
    <div className="border rounded-lg bg-background overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        <div className="w-8 h-8 rounded-md bg-cyan-100 shrink-0 flex items-center justify-center text-sm">
          🌬️
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{item.pranayama_techniques.name}</div>
          <div className="text-xs text-muted-foreground">
            {item.pranayama_techniques.sanskrit_name} · {item.duration_mins || 3} min
          </div>
        </div>
        <span className="text-xs text-muted-foreground shrink-0">#{item.order_num}</span>
        <button onClick={() => onRemove(item.id)} className="text-muted-foreground hover:text-red-500 transition-colors shrink-0 cursor-pointer">
          <Trash2 size={14} />
        </button>
      </div>

      <div className="border-t bg-secondary/40">
        <button
          onClick={togglePicker}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-secondary/70 transition-colors cursor-pointer"
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
              {(cueLibrary || []).map((cue) => {
                const isChecked = checkedCueIds.has(cue.id)
                const isEditing = editingCueId === cue.id

                return (
                  <div key={cue.id} className={`flex items-start gap-2 text-xs px-2.5 py-1.5 rounded-md ${isChecked ? 'bg-green-50' : ''}`}>
                    {isEditing ? (
                      <>
                        <input
                          type="text"
                          value={editDraft}
                          onChange={(e) => setEditDraft(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          autoFocus
                          className="flex-1 text-xs px-1.5 py-1 border rounded-md bg-background"
                        />
                        <button onClick={saveEdit} className="text-green-600 shrink-0 cursor-pointer">
                          <Check size={14} />
                        </button>
                        <button onClick={() => setEditingCueId(null)} className="text-muted-foreground shrink-0 cursor-pointer">
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <input type="checkbox" checked={isChecked} onChange={() => toggleCue(cue)} className="mt-0.5 shrink-0 cursor-pointer" />
                        <label onClick={() => toggleCue(cue)} className="flex-1 cursor-pointer">
                          {cue.text}
                          {!cue.is_default && <span className="text-muted-foreground ml-1">· yours</span>}
                        </label>
                        {!cue.is_default && (
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => startEdit(cue)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                              <Pencil size={12} />
                            </button>
                            <button onClick={() => deleteCue(cue)} className="text-muted-foreground hover:text-red-500 cursor-pointer">
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
                value={newCueText}
                onChange={(e) => setNewCueText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addNewCue()}
                className="flex-1 text-xs px-2 py-1.5 border rounded-md bg-background"
              />
              <button onClick={addNewCue} className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-md shrink-0 cursor-pointer">
                Add
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
