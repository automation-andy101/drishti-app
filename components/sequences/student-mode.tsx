'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Pause, Play, X } from 'lucide-react'

type Pose = {
  id: string
  name: string
  sanskrit_name: string
  description: string
  body_area: string[]
}

type SequencePose = {
  id: string
  order_num: number
  breath_count: number | null
  poses: Pose
}

type Sequence = {
  id: string
  title: string
  length_mins: number
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

const SECONDS_PER_BREATH = 4

export default function StudentMode({
  sequence,
  poses,
}: {
  sequence: Sequence
  poses: SequencePose[]
}) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const current = poses[currentIndex]
  const next = poses[currentIndex + 1]
  const poseSeconds = (current.breath_count || 5) * SECONDS_PER_BREATH

  // Reset timer when pose changes
  useEffect(() => {
    setSecondsLeft(poseSeconds)
  }, [currentIndex, poseSeconds])

  // Countdown
  useEffect(() => {
    if (paused) return

    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (currentIndex < poses.length - 1) {
            setCurrentIndex((i) => i + 1)
          }
          return poseSeconds
        }
        return s - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [paused, currentIndex, poseSeconds, poses.length])

  function goNext() {
    if (currentIndex < poses.length - 1) setCurrentIndex(currentIndex + 1)
  }

  function goPrev() {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1)
  }

  // Total time remaining
  const remainingPoses = poses.slice(currentIndex + 1)
  const remainingSeconds =
    secondsLeft +
    remainingPoses.reduce((sum, p) => sum + (p.breath_count || 5) * SECONDS_PER_BREATH, 0)
  const remainingMins = Math.ceil(remainingSeconds / 60)

  const primaryArea = current.poses.body_area?.[0] || 'BALANCE'
  const color = bodyAreaColors[primaryArea] || 'bg-gray-100'

  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60

  return (
    <div className="max-w-lg mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push(`/sequences/${sequence.id}`)}
          className="text-muted-foreground hover:text-foreground"
        >
          <X size={20} />
        </button>
        <span className="text-sm text-muted-foreground">
          Pose {currentIndex + 1} of {poses.length} · {remainingMins} min left
        </span>
        <button
          onClick={() => setPaused(!paused)}
          className="text-muted-foreground hover:text-foreground"
        >
          {paused ? <Play size={20} /> : <Pause size={20} />}
        </button>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 mb-8">
        {poses.map((_, i) => (
          <div
            key={i}
            className={`h-1 w-8 rounded-full ${
              i <= currentIndex ? 'bg-primary' : 'bg-secondary'
            }`}
          />
        ))}
      </div>

      {/* Pose display */}
      <div className="text-center mb-8">
        <div className={`w-28 h-28 rounded-2xl ${color} mx-auto mb-4 flex items-center justify-center text-5xl`}>
          🧘
        </div>
        <h2 className="text-xl font-medium mb-1">{current.poses.name}</h2>
        <p className="text-sm text-muted-foreground mb-3">
          {current.poses.sanskrit_name}
        </p>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          {current.poses.description}
        </p>
      </div>

      {/* Timer */}
      <div className="flex items-center justify-center gap-8 mb-8">
        <div className="text-center">
          <div className="text-2xl font-medium text-primary">
            {current.breath_count || 5}
          </div>
          <div className="text-xs text-muted-foreground">breaths</div>
        </div>
        <div className="w-24 h-24 rounded-full border-2 border-secondary flex items-center justify-center relative">
          <div
            className="absolute inset-0 rounded-full border-2 border-primary"
            style={{
              clipPath: `inset(0 ${100 - (secondsLeft / poseSeconds) * 100}% 0 0)`,
            }}
          />
          <span className="text-lg font-medium">
            {mins}:{secs.toString().padStart(2, '0')}
          </span>
        </div>
        <div className="text-center text-muted-foreground">
          <div className="text-lg">🌬️</div>
          <div className="text-xs mt-0.5">breathe</div>
        </div>
      </div>

      {/* Nav buttons */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="flex-1 flex items-center justify-center gap-1 py-2.5 border rounded-md text-sm disabled:opacity-40"
        >
          <ChevronLeft size={16} />
          Prev
        </button>
        <button
          onClick={goNext}
          disabled={currentIndex === poses.length - 1}
          className="flex-[2] flex items-center justify-center gap-1 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-40"
        >
          Next pose
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Up next */}
      {next && (
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Up next
          </div>
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <div className={`w-8 h-8 rounded ${bodyAreaColors[next.poses.body_area?.[0]] || 'bg-gray-100'} shrink-0`} />
            <div className="text-sm">
              <div className="font-medium">{next.poses.name}</div>
              <div className="text-xs text-muted-foreground">{next.poses.sanskrit_name}</div>
            </div>
          </div>
        </div>
      )}

      {currentIndex === poses.length - 1 && secondsLeft === 0 && (
        <div className="text-center py-6">
          <div className="text-3xl mb-2">🙏</div>
          <p className="font-medium">Namaste — class complete</p>
        </div>
      )}
    </div>
  )
}
