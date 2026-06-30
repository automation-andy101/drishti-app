import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'node:path'
import fs from 'node:fs'
import sharp from 'sharp'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function uploadPoseImage(poseName, localFilePath) {
  if (!fs.existsSync(localFilePath)) {
    console.log(`⚠️  File not found: ${localFilePath}`)
    return
  }

  // Resize to a max width of 600px and compress to reduce file size significantly
  const resizedBuffer = await sharp(localFilePath)
    .resize({ width: 600, withoutEnlargement: true })
    .png({ quality: 80, compressionLevel: 9 })
    .toBuffer()

  const fileName = `${poseName.toLowerCase().replace(/\s+/g, '-')}.png`

  const { error: uploadError } = await supabase.storage
    .from('yoga-pose-images')
    .upload(fileName, resizedBuffer, {
      contentType: 'image/png',
      upsert: true,
    })

  if (uploadError) {
    console.error(`❌ Upload error for ${poseName}:`, uploadError.message)
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
    console.error(`❌ DB update error for ${poseName}:`, updateError.message)
    return
  }

  const originalSize = fs.statSync(localFilePath).size
  console.log(`✅ ${poseName} updated (${(originalSize / 1024).toFixed(0)}KB → ${(resizedBuffer.length / 1024).toFixed(0)}KB)`)
}

const batch = [
  ['Boat Pose', 'scripts/pose-images/boat.png'],
  ['Bow Pose', 'scripts/pose-images/bow.png'],
  ['Bridge Pose', 'scripts/pose-images/bridge.png'],
  ['Butterfly Pose', 'scripts/pose-images/butterfly.png'],
  ['Camel Pose', 'scripts/pose-images/camel.png'],
  ['Chair Pose', 'scripts/pose-images/chair.png'],
  ["Child's Pose", 'scripts/pose-images/child.png'],
  ['Cobra Pose', 'scripts/pose-images/cobra.png'],
  ['Corpse Pose', 'scripts/pose-images/corpse.png'],
  ['Cat-Cow', 'scripts/pose-images/cat.png'],
  ['Crow Pose', 'scripts/pose-images/crow.png'],
  ['Dancer Pose', 'scripts/pose-images/dancer.png'],
  ['Downward Facing Dog', 'scripts/pose-images/downward-dog.png'],
  ['Dragon Pose', 'scripts/pose-images/dragon.png'],
  ['Eagle Pose', 'scripts/pose-images/eagle.png'],
  ['Extended Side Angle', 'scripts/pose-images/extended-side-angle.png'],
  ['Half Moon Pose', 'scripts/pose-images/half-moon.png'],
  ['Happy Baby', 'scripts/pose-images/happy-baby.png'],
  ['Headstand', 'scripts/pose-images/headstand.png'],
  ['Legs Up The Wall', 'scripts/pose-images/legs-up-wall.png'],
  ['Lizard Pose', 'scripts/pose-images/lizard.png'],
  ['Low Lunge', 'scripts/pose-images/low-lunge.png'],
  ['Mountain Pose', 'scripts/pose-images/mountain.png'],
  ['Pigeon Pose', 'scripts/pose-images/pigeon-pose.png'],
  ['Plank Pose', 'scripts/pose-images/plank.png'],
  ['Revolved Triangle', 'scripts/pose-images/revolved-triangle.png'],
  ['Seated Spinal Twist', 'scripts/pose-images/seated-twist.png'],
  ['Shoulder Stand', 'scripts/pose-images/shoulder-stand.png'],
  ['Side Plank', 'scripts/pose-images/side-plank.png'],
  ['Sleeping Swan', 'scripts/pose-images/sleeping-swan.png'],
  ['Sphinx Pose', 'scripts/pose-images/spinx.png'],
  ['Standing Forward Fold', 'scripts/pose-images/standing-foward-fold.png'],
  ['Supine Twist', 'scripts/pose-images/supine-twist.png'],
  ['Tree Pose', 'scripts/pose-images/tree.png'],
  ['Triangle Pose', 'scripts/pose-images/triangle.png'],
  ['Upward Facing Dog', 'scripts/pose-images/upward-facing-dog.png'],
  ['Warrior I', 'scripts/pose-images/warrior-1.png'],
  ['Warrior II', 'scripts/pose-images/warrior-2.png'],
  ['Warrior III', 'scripts/pose-images/warrior-3.png'],
  ['Wheel Pose', 'scripts/pose-images/wheel.png'],
]

async function main() {
  for (const [poseName, filePath] of batch) {
    await uploadPoseImage(poseName, filePath)
  }
  console.log('Done!')
}

main()