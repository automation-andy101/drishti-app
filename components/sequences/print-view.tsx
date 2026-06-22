'use client'

import { useRouter } from 'next/navigation'
import { Printer, ArrowLeft } from 'lucide-react'

type Cue = {
  text: string
}

type SequencePoseCue = {
  id: string
  custom_text: string | null
  cues: Cue | null
}

type Pose = {
  name: string
  sanskrit_name: string
  image_url: string | null
}

type SequencePose = {
  id: string
  order_num: number
  breath_count: number | null
  section: string | null
  poses: Pose
  sequence_pose_cues: SequencePoseCue[]
}

type Sequence = {
  id: string
  title: string
  description: string | null
  style: string
  length_mins: number
  level: string
  peak_pose: string | null
}

const NO_SECTION = 'Unsorted'

function formatLabel(str: string) {
  return str.replace('_', ' ').charAt(0) + str.replace('_', ' ').slice(1).toLowerCase()
}

export default function PrintView({ sequence, poses }: { sequence: Sequence; poses: SequencePose[] }) {
  const router = useRouter()

  const usedSections = Array.from(new Set(poses.map((p) => p.section || NO_SECTION)))

  return (
    <div>
      <div className="print:hidden flex items-center justify-between mb-6 sticky top-0 bg-background py-3 border-b z-10">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium cursor-pointer"
        >
          <Printer size={16} />
          Print / Save as PDF
        </button>
      </div>

      <div className="max-w-2xl mx-auto print:max-w-full">
        {/* Title block */}
        <div className="border-b-2 border-foreground pb-4 mb-6 print:text-black">
          <h1 className="text-3xl font-medium mb-1">{sequence.title}</h1>
          {sequence.description && (
            <p className="text-muted-foreground print:text-gray-700 mb-3">{sequence.description}</p>
          )}
          <div className="flex gap-3 text-sm text-muted-foreground print:text-gray-700">
            <span className="font-medium">{formatLabel(sequence.style)}</span>
            <span>·</span>
            <span>{sequence.length_mins} min</span>
            <span>·</span>
            <span>{formatLabel(sequence.level)}</span>
            {sequence.peak_pose && (
              <>
                <span>·</span>
                <span>Peak pose: {sequence.peak_pose}</span>
              </>
            )}
          </div>
        </div>

        {usedSections.map((sectionName) => {
          const posesInSection = poses
            .filter((p) => (p.section || NO_SECTION) === sectionName)
            .sort((a, b) => a.order_num - b.order_num)

          if (posesInSection.length === 0) return null

          return (
            <div key={sectionName} className="mb-8 break-inside-avoid">
              <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground print:text-gray-500 mb-3 pb-1 border-b">
                {sectionName}
              </h2>
              <div className="flex flex-col gap-4">
                {posesInSection.map((sp) => (
                  <div key={sp.id} className="flex gap-3 pb-4 border-b border-dashed break-inside-avoid">
                    {/* Pose image or fallback */}
                    <div className="w-16 h-16 rounded-lg bg-secondary print:bg-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
                      {sp.poses.image_url ? (
                        <img
                          src={sp.poses.image_url}
                          alt={sp.poses.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl">🧘</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="font-medium">
                          <span className="text-muted-foreground print:text-gray-500 mr-1.5">{sp.order_num}.</span>
                          {sp.poses.name}
                        </h3>
                        <span className="text-xs text-muted-foreground print:text-gray-500 shrink-0 italic">
                          {sp.poses.sanskrit_name}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground print:text-gray-500 mb-1.5">
                        {sp.breath_count} breaths
                      </div>
                      {sp.sequence_pose_cues && sp.sequence_pose_cues.length > 0 && (
                        <ul className="text-sm text-muted-foreground print:text-gray-700 list-disc list-inside space-y-0.5">
                          {sp.sequence_pose_cues.map((spc) => (
                            <li key={spc.id}>{spc.cues?.text || spc.custom_text}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        <div className="text-center text-xs text-muted-foreground print:text-gray-400 mt-8 pt-4 border-t">
          🧘 Drishti
        </div>
      </div>
    </div>
  )
}
