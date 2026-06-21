import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'node:path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function main() {
  // Find Boat Pose
  const { data: pose, error: findError } = await supabase
    .from('poses')
    .select('id, name, image_url')
    .eq('name', 'Boat Pose')
    .single()

  console.log('BEFORE update:', pose, findError)

  // Try to update it
  const { data: updated, error: updateError } = await supabase
    .from('poses')
    .update({ image_url: 'https://example.com/test-image.jpg' })
    .eq('id', pose.id)
    .select()

  console.log('UPDATE result:', updated, updateError)

  // Read it back immediately
  const { data: confirmed, error: confirmError } = await supabase
    .from('poses')
    .select('id, name, image_url')
    .eq('id', pose.id)
    .single()

  console.log('AFTER update (re-read):', confirmed, confirmError)
}

main()