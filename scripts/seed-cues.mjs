import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'node:path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const cues = [
  { pose: 'Extended Side Angle', text: 'Press your front knee gently into your tricep and open your chest toward the sky' },
  { pose: 'Half Moon Pose', text: 'Find a steady gaze point and root down through your standing foot before lifting' },
  { pose: 'Chair Pose', text: "Sit your hips back like there's a chair behind you, and keep your weight in your heels" },
  { pose: 'Cobra Pose', text: 'Press the tops of your feet down and lift your chest using your back muscles, not just your arms' },
  { pose: 'Upward Facing Dog', text: 'Roll over your toes, straighten your arms, and draw your shoulders away from your ears' },
  { pose: 'Camel Pose', text: 'Lead with your heart, keep your hips stacked over your knees, and only go as deep as feels safe' },
  { pose: 'Bridge Pose', text: 'Press into your feet to lift your hips, and interlace your hands beneath you if that feels good' },
  { pose: 'Wheel Pose', text: 'Press evenly through hands and feet, and let your head hang heavy as you lift' },
  { pose: 'Bow Pose', text: 'Kick your feet into your hands to lift your chest and thighs off the mat' },
  { pose: 'Pigeon Pose', text: 'Square your hips as best you can and fold forward only as far as feels open, not painful' },
  { pose: 'Low Lunge', text: 'Sink your hips forward and down, keeping your front knee tracking over your ankle' },
  { pose: 'Butterfly Pose', text: 'Let your knees soften toward the floor without forcing, and fold forward from your hips' },
  { pose: 'Happy Baby', text: 'Hold the outer edges of your feet and gently rock side to side' },
  { pose: 'Seated Spinal Twist', text: 'Lengthen your spine tall before you twist, leading with your chest not your shoulders' },
  { pose: 'Supine Twist', text: 'Let your knees fall to one side while keeping both shoulders grounded on the mat' },
  { pose: 'Legs Up The Wall', text: 'Let your arms rest open beside you and allow your breath to slow down' },
  { pose: 'Shoulder Stand', text: 'Support your lower back with your hands and stack your hips over your shoulders' },
  { pose: 'Crow Pose', text: 'Shift your weight forward into your hands before lifting your feet, and keep your gaze slightly forward' },
  { pose: 'Corpse Pose', text: 'Let your feet fall open, palms face up, and allow your whole body to be supported by the earth' },
  { pose: 'Plank Pose', text: 'Draw your navel toward your spine and keep a straight line from your head to your heels' },
  { pose: 'Boat Pose', text: 'Lift your chest and lengthen your spine rather than rounding through your lower back' },
  { pose: 'Side Plank', text: 'Stack your shoulder over your wrist and reach your top arm toward the sky' },
  { pose: 'Tree Pose', text: 'Press your foot into your standing leg and your standing leg back into your foot, like two magnets' },
  { pose: 'Eagle Pose', text: 'Wrap one arm under the other and sink your hips down as if sitting into a chair' },
  { pose: 'Dancer Pose', text: 'Kick your back foot into your hand as you hinge forward, keeping your standing leg strong' },
]

async function main() {
  console.log(`Seeding ${cues.length} cues...`)

  for (const cue of cues) {
    const { data: pose, error: poseError } = await supabase
      .from('poses')
      .select('id')
      .eq('name', cue.pose)
      .single()

    if (poseError || !pose) {
      console.log(`  ⚠️  Could not find pose: ${cue.pose}`)
      continue
    }

    const { data: existing } = await supabase
      .from('cues')
      .select('id')
      .eq('pose_id', pose.id)
      .eq('text', cue.text)
      .maybeSingle()

    if (existing) {
      console.log(`  ⏭️  Already exists: ${cue.pose}`)
      continue
    }

    const { error: insertError } = await supabase
      .from('cues')
      .insert({
        pose_id: pose.id,
        text: cue.text,
        is_default: true,
      })

    if (insertError) {
      console.log(`  ❌ Failed for ${cue.pose}:`, insertError.message)
    } else {
      console.log(`  ✅ Added cue for ${cue.pose}`)
    }
  }

  console.log('Done!')
}

main()
