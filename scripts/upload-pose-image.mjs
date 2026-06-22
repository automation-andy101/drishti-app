import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'node:path'
import fs from 'node:fs'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function uploadPoseImage(poseName, localFilePath) {
  const fileBuffer = fs.readFileSync(localFilePath)
  const fileName = `${poseName.toLowerCase().replace(/\s+/g, '-')}.png`

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('yoga-pose-images')
    .upload(fileName, fileBuffer, {
      contentType: 'image/png',
      upsert: true,
    })

  if (uploadError) {
    console.error('Upload error:', uploadError)
    return
  }

  const { data: urlData } = supabase.storage
    .from('yoga-pose-images')
    .getPublicUrl(fileName)

  const { error: updateError } = await supabase
    .from('poses')
    .update({ image_url: urlData.publicUrl })
    .eq('name', poseName)

  if (updateError) {
    console.error('Update error:', updateError)
    return
  }

  console.log(`✅ ${poseName} updated with image: ${urlData.publicUrl}`)
}

uploadPoseImage('Warrior II', 'scripts/pose-images/warrior-2.png')
