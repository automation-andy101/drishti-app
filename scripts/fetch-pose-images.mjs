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

async function main() {
  // Only do the FIRST 2 poses as a controlled test
  const { data: poses, error } = await supabase
    .from('poses')
    .select('id, name')
    .is('image_url', null)

  if (error) {
    console.error('Error fetching poses:', error)
    return
  }

  console.log(`Testing with ${poses.length} poses...`)

  for (const pose of poses) {
    const query = `${pose.name} yoga pose`
    console.log(`\nSearching: ${query}`)

    let imageUrl
    try {
      imageUrl = await searchUnsplash(query)
    } catch (err) {
      console.log(`  ❌ Unsplash error: ${err.message}`)
      continue
    }

    console.log(`  Found URL: ${imageUrl}`)

    if (!imageUrl) {
      console.log(`  ⚠️  No image found for ${pose.name}`)
      continue
    }

    const { data: updateData, error: updateError } = await supabase
      .from('poses')
      .update({ image_url: imageUrl })
      .eq('id', pose.id)
      .select()

    console.log(`  Update result:`, updateData, updateError)

    // Immediately re-read to confirm
    const { data: reread } = await supabase
      .from('poses')
      .select('id, name, image_url')
      .eq('id', pose.id)
      .single()

    console.log(`  Re-read confirms:`, reread)

    await new Promise((resolve) => setTimeout(resolve, 1500))
  }

  console.log('\nDone!')
}

main()