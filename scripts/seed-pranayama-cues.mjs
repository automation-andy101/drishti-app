import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'node:path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const cues = [
  { technique: "Lion's breath", text: 'Inhale deeply, then exhale forcefully through the mouth with tongue out, making a roaring sound' },
  { technique: 'Three-part breath', text: 'Breathe into the belly first, then the ribs, then the upper chest' },
  { technique: 'Cooling breath', text: 'Curl the tongue lengthwise and inhale through it, then exhale through the nose' },
]

async function main() {
  for (const cue of cues) {
    const { data: technique, error: findError } = await supabase
      .from('pranayama_techniques')
      .select('id')
      .eq('name', cue.technique)
      .single()

    if (findError || !technique) {
      console.log(`⚠️  Could not find technique: ${cue.technique}`)
      continue
    }

    const { error: insertError } = await supabase
      .from('cues')
      .insert({
        pranayama_id: technique.id,
        text: cue.text,
        is_default: true,
      })

    if (insertError) {
      console.log(`❌ Failed for ${cue.technique}:`, insertError.message)
    } else {
      console.log(`✅ Added cue for ${cue.technique}`)
    }
  }
  console.log('Done!')
}

main()
