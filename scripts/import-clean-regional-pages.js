import { createClient } from '@sanity/client'
import fs from 'fs'

const client = createClient({
  dataset: 'development-clean', // New clean dataset
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'gm67v7rk',
  apiVersion: '2023-01-01',
  useCdn: false,
  token: process.env.SANITY_API_READ_TOKEN
})

console.log('📥 Importing regional community pages to clean dataset...')

// Read the exported regional pages
const filename = 'regional-pages-backup-2025-09-26T07-30-37-557Z.json'

if (!fs.existsSync(filename)) {
  console.error(`❌ Backup file not found: ${filename}`)
  process.exit(1)
}

const regionalPages = JSON.parse(fs.readFileSync(filename, 'utf8'))
console.log(`📊 Found ${regionalPages.length} regional pages to import`)

// Function to clean any potential code blocks (just in case)
const cleanDocument = (doc) => {
  const cleanObj = (obj) => {
    if (!obj || typeof obj !== 'object') return obj

    if (Array.isArray(obj)) {
      // Filter out any code blocks and recursively clean
      return obj
        .filter(item => !(item && typeof item === 'object' && item._type === 'code'))
        .map(item => cleanObj(item))
    }

    // For objects, recursively clean all properties
    const cleaned = {}
    for (const [key, value] of Object.entries(obj)) {
      // Skip any fields that are code blocks
      if (value && typeof value === 'object' && value._type === 'code') {
        console.log(`   🧹 Removed code block from ${key}`)
        continue
      }
      cleaned[key] = cleanObj(value)
    }
    return cleaned
  }

  return cleanObj(doc)
}

// Import each page
const importPages = async () => {
  console.log('🔄 Starting import process...')

  for (let i = 0; i < regionalPages.length; i++) {
    const page = regionalPages[i]
    console.log(`   Importing page ${i + 1}/${regionalPages.length}: ${page.title || page._id}`)

    try {
      // Clean the document
      const cleanedPage = cleanDocument(page)

      // Import to new dataset
      await client.createOrReplace(cleanedPage)
      console.log(`   ✅ Successfully imported`)
    } catch (error) {
      console.error(`   ❌ Failed to import:`, error.message)
    }
  }

  console.log('✅ Import completed!')

  // Verify the import
  const count = await client.fetch('count(*)')
  console.log(`📊 Clean dataset now has ${count} documents`)

  return count
}

importPages().then(() => {
  console.log('\n🎉 Regional community pages imported to clean dataset!')
  console.log('You can now:')
  console.log('1. Update .env to use "development-clean" dataset')
  console.log('2. Test if the Code component error is gone')
  console.log('3. If successful, rename datasets to switch over')
  process.exit(0)
}).catch(err => {
  console.error('❌ Import failed:', err.message)
  process.exit(1)
})