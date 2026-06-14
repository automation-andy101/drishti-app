'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const STYLES = ['VINYASA', 'HATHA', 'ASHTANGA', 'YIN', 'RESTORATIVE', 'POWER', 'KUNDALINI']
const LEVELS = ['ALL_LEVELS', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED']
const FOCUS_AREAS = ['HIPS', 'HAMSTRINGS', 'BACKBENDS', 'CORE', 'SHOULDERS', 'INVERSIONS', 'TWISTS', 'BALANCE', 'CHEST', 'FORWARD_FOLDS']

function formatLabel(str: string) {
  return str.replace('_', ' ').charAt(0) + str.replace('_', ' ').slice(1).toLowerCase()
}

export default function NewSequenceForm() {
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [style, setStyle] = useState('')
  const [lengthMins, setLengthMins] = useState(60)
  const [level, setLevel] = useState('ALL_LEVELS')
  const [focusArea, setFocusArea] = useState('')
  const [peakPose, setPeakPose] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!title) return setError('Please add a class name')
    if (!style) return setError('Please select a style')

    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')

    // Get or create profile
    let { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({ user_id: user.id })
        .select('id')
        .single()
      profile = newProfile
    }

    if (!profile) {
      setError('Could not create profile')
      setLoading(false)
      return
    }

    const { data: sequence, error: seqError } = await supabase
      .from('sequences')
      .insert({
        title,
        description: description || null,
        style,
        length_mins: lengthMins,
        level,
        focus_area: focusArea || null,
        peak_pose: peakPose || null,
        profile_id: profile.id,
      })
      .select('id')
      .single()

    if (seqError) {
      setError(seqError.message)
      setLoading(false)
      return
    }

    router.push(`/sequences/${sequence.id}`)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div className="flex flex-col gap-2">
        <Label>Class name</Label>
        <Input
          placeholder="e.g. Morning vinyasa flow"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-2">
        <Label>Description <span className="text-muted-foreground">(optional)</span></Label>
        <Input
          placeholder="e.g. A energising morning flow for all levels"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* Style */}
      <div className="flex flex-col gap-2">
        <Label>Style</Label>
        <div className="flex flex-wrap gap-2">
          {STYLES.map((s) => (
            <button
              key={s}
              onClick={() => setStyle(s)}
              className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                style === s
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'hover:bg-secondary'
              }`}
            >
              {formatLabel(s)}
            </button>
          ))}
        </div>
      </div>

      {/* Length */}
      <div className="flex flex-col gap-2">
        <Label>Class length — <span className="font-medium">{lengthMins} minutes</span></Label>
        <input
          type="range"
          min={15}
          max={120}
          step={15}
          value={lengthMins}
          onChange={(e) => setLengthMins(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>15 min</span>
          <span>120 min</span>
        </div>
      </div>

      {/* Level */}
      <div className="flex flex-col gap-2">
        <Label>Level</Label>
        <div className="flex flex-wrap gap-2">
          {LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                level === l
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'hover:bg-secondary'
              }`}
            >
              {formatLabel(l)}
            </button>
          ))}
        </div>
      </div>

      {/* Focus area */}
      <div className="flex flex-col gap-2">
        <Label>Focus area <span className="text-muted-foreground">(optional)</span></Label>
        <div className="flex flex-wrap gap-2">
          {FOCUS_AREAS.map((area) => (
            <button
              key={area}
              onClick={() => setFocusArea(focusArea === area ? '' : area)}
              className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                focusArea === area
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'hover:bg-secondary'
              }`}
            >
              {formatLabel(area)}
            </button>
          ))}
        </div>
      </div>

      {/* Peak pose */}
      <div className="flex flex-col gap-2">
        <Label>Peak pose <span className="text-muted-foreground">(optional)</span></Label>
        <Input
          placeholder="e.g. Wheel pose, Warrior III…"
          value={peakPose}
          onChange={(e) => setPeakPose(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          The sequence will build toward this pose
        </p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1"
        >
          {loading ? 'Creating...' : 'Build sequence →'}
        </Button>
      </div>
    </div>
  )
}
