'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react'

type Pose = {
  id: string
  name: string
  sanskrit_name: string | null
  description: string | null
  difficulty: string
  body_area: string[]
  styles: string[]
  breath_count: number | null
  image_url: string | null
}

const DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']
const STYLES = ['VINYASA', 'HATHA', 'ASHTANGA', 'YIN', 'RESTORATIVE', 'POWER', 'KUNDALINI']
const BODY_AREAS = ['HIPS', 'HAMSTRINGS', 'BACKBENDS', 'CORE', 'SHOULDERS', 'INVERSIONS', 'TWISTS', 'BALANCE', 'CHEST', 'FORWARD_FOLDS']

export default function AdminPoseManager({ initialPoses }: { initialPoses: Pose[] }) {
  const supabase = createClient()
  const [poses, setPoses] = useState<Pose[]>(initialPoses)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [sanskritName, setSanskritName] = useState('')
  const [description, setDescription] = useState('')
  const [difficulty, setDifficulty] = useState('BEGINNER')
  const [selectedStyles, setSelectedStyles] = useState<string[]>([])
  const [selectedAreas, setSelectedAreas] = useState<string[]>([])
  const [breathCount, setBreathCount] = useState(5)
  const [imageUrl, setImageUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function resetForm() {
    setName('')
    setSanskritName('')
    setDescription('')
    setDifficulty('BEGINNER')
    setSelectedStyles([])
    setSelectedAreas([])
    setBreathCount(5)
    setImageUrl('')
    setEditingId(null)
    setError(null)
  }

  function startEdit(pose: Pose) {
    setEditingId(pose.id)
    setName(pose.name)
    setSanskritName(pose.sanskrit_name || '')
    setDescription(pose.description || '')
    setDifficulty(pose.difficulty)
    setSelectedStyles(pose.styles || [])
    setSelectedAreas(pose.body_area || [])
    setBreathCount(pose.breath_count || 5)
    setImageUrl(pose.image_url || '')
    setShowForm(true)
  }

  function toggleStyle(style: string) {
    setSelectedStyles((prev) => (prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]))
  }

  function toggleArea(area: string) {
    setSelectedAreas((prev) => (prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]))
  }

  async function savePose() {
    if (!name.trim()) {
      setError('Pose name is required')
      return
    }

    setSaving(true)
    setError(null)

    const payload = {
      name: name.trim(),
      sanskrit_name: sanskritName.trim() || null,
      description: description.trim() || null,
      difficulty,
      styles: selectedStyles,
      body_area: selectedAreas,
      breath_count: breathCount,
      image_url: imageUrl.trim() || null,
    }

    if (editingId) {
      const { data, error: updateError } = await supabase
        .from('poses')
        .update(payload)
        .eq('id', editingId)
        .select()
        .single()

      if (updateError) {
        setError(updateError.message)
        setSaving(false)
        return
      }

      setPoses((prev) => prev.map((p) => (p.id === editingId ? data : p)).sort((a, b) => a.name.localeCompare(b.name)))
    } else {
      const { data, error: insertError } = await supabase
        .from('poses')
        .insert(payload)
        .select()
        .single()

      if (insertError) {
        setError(insertError.message)
        setSaving(false)
        return
      }

      setPoses((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    }

    setSaving(false)
    setShowForm(false)
    resetForm()
  }

  async function deletePose(id: string) {
    const confirmed = window.confirm('Delete this pose permanently? This will also remove it from any sequences and delete its cues.')
    if (!confirmed) return

    const { error: deleteError } = await supabase.from('poses').delete().eq('id', id)

    if (deleteError) {
      alert('Error deleting pose: ' + deleteError.message)
      return
    }

    setPoses((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium">Pose library admin</h1>
          <p className="text-muted-foreground text-sm mt-1">{poses.length} poses</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowForm(!showForm)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium cursor-pointer"
        >
          <Plus size={16} />
          {showForm ? 'Cancel' : 'New pose'}
        </button>
      </div>

      {showForm && (
        <div className="border rounded-lg p-5 mb-6 bg-secondary/30">
          <h2 className="font-medium mb-4">{editingId ? 'Edit pose' : 'New pose'}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Warrior I"
                className="text-sm px-3 py-2 border rounded-md bg-background"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Sanskrit name</label>
              <input
                type="text"
                value={sanskritName}
                onChange={(e) => setSanskritName(e.target.value)}
                placeholder="e.g. Virabhadrasana I"
                className="text-sm px-3 py-2 border rounded-md bg-background"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 mb-4">
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A short description of the pose..."
              rows={2}
              className="text-sm px-3 py-2 border rounded-md bg-background resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="text-sm px-3 py-2 border rounded-md bg-background"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Default breath count</label>
              <input
                type="number"
                value={breathCount}
                onChange={(e) => setBreathCount(Number(e.target.value))}
                min={1}
                className="text-sm px-3 py-2 border rounded-md bg-background"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 mb-4">
            <label className="text-xs font-medium text-muted-foreground">Image URL</label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="text-sm px-3 py-2 border rounded-md bg-background"
            />
          </div>

          <div className="mb-4">
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Styles</label>
            <div className="flex flex-wrap gap-1.5">
              {STYLES.map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => toggleStyle(style)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                    selectedStyles.includes(style) ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-secondary'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Body areas</label>
            <div className="flex flex-wrap gap-1.5">
              {BODY_AREAS.map((area) => (
                <button
                  key={area}
                  type="button"
                  onClick={() => toggleArea(area)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                    selectedAreas.includes(area) ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-secondary'
                  }`}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

          <button
            onClick={savePose}
            disabled={saving}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Saving...' : editingId ? 'Save changes' : 'Create pose'}
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {poses.map((pose) => (
          <div key={pose.id} className="border rounded-lg p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-secondary shrink-0 overflow-hidden flex items-center justify-center">
              {pose.image_url ? (
                <img src={pose.image_url} alt={pose.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg">🧘</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{pose.name}</div>
              <div className="text-xs text-muted-foreground">{pose.sanskrit_name}</div>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground shrink-0">
              {pose.difficulty}
            </span>
            <button
              onClick={() => startEdit(pose)}
              className="text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => deletePose(pose.id)}
              className="text-muted-foreground hover:text-red-500 cursor-pointer shrink-0"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
