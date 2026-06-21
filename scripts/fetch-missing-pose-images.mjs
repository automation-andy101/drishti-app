import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'node:path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY

async function searchUnsplash(query) {
  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=squarish`,
    {
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
      },
    }
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Unsplash error (${res.status}): ${text}`)
  }

  const data = await res.json()
  return data.results?.[0]?.urls?.regular || null
}

// Slightly broader/alternate search terms for poses that failed last time
const fallbackQueries = {
  "Standing Forward Fold": "forward fold stretch yoga",
  "Warrior I": "warrior pose yoga",
  "Warrior II": "warrior 2 pose yoga",
  "Warrior III": "warrior balance yoga",
  "Extended Side Angle": "side angle stretch yoga",
  "Half Moon Pose": "half moon balance yoga",
  "Revolved Triangle": "triangle twist yoga",
  "Legs Up The Wall": "legs up wall relaxation",
  "Sphinx Pose": "sphinx stretch yoga",
}

async function main() {
  const { data: poses, error } = await supabase
    .from('poses')
    .select('id, name')
    .is('image_url', null)

  if (error) {
    console.error('Error fetching poses:', error)
    return
  }

  console.log(`Found ${poses.length} poses still missing images.`)

  for (const pose of poses) {
    const query = fallbackQueries[pose.name] || `${pose.name} yoga`
    console.log(`Searching: ${query}`)

    let imageUrl
    try {
      imageUrl = await searchUnsplash(query)
    } catch (err) {
      console.log(`  ❌ ${err.message}`)
      break // stop entirely if we hit the rate limit again
    }

    if (!imageUrl) {
      console.log(`  ⚠️  Still no image found for ${pose.name}`)
      await new Promise((resolve) => setTimeout(resolve, 1500))
      continue
    }

    const { error: updateError } = await supabase
      .from('poses')
      .update({ image_url: imageUrl })
      .eq('id', pose.id)

    if (updateError) {
      console.log(`  ❌ Failed to update ${pose.name}:`, updateError.message)
    } else {
      console.log(`  ✅ Updated ${pose.name}`)
    }

    await new Promise((resolve) => setTimeout(resolve, 1500))
  }

  console.log('Done!')
}

main()

// node scripts/fetch-missing-pose-images.mjs