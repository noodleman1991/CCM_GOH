import { createClient } from '@sanity/client'
import fs from 'fs'

const client = createClient({
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'development',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'gm67v7rk',
  apiVersion: '2023-01-01',
  useCdn: false,
  token: process.env.SANITY_API_READ_TOKEN
})

console.log('🔍 Exporting regional community pages...')

// Get all regionalCommunityPage documents with full structure
const query = `*[_type == "regionalCommunityPage"] {
  ...,
  // Expand all references to get complete data
  "sections": sections[] {
    ...,
    // If there are any references, expand them
    reference->{...}
  }
}`

client.fetch(query).then(regionalPages => {
  console.log(`📊 Found ${regionalPages.length} regional community pages`)

  if (regionalPages.length === 0) {
    console.log('❌ No regional community pages found!')
    process.exit(1)
  }

  // Save to JSON file for analysis and backup
  const filename = `regional-pages-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  const filepath = `/Users/amitlockshinski/WebstormProjects/turbo2/${filename}`

  fs.writeFileSync(filepath, JSON.stringify(regionalPages, null, 2))
  console.log(`✅ Exported ${regionalPages.length} regional pages to: ${filename}`)

  // Analyze structure for code blocks
  console.log('\n🔍 Analyzing structure for code block references...')

  let codeBlocksFound = false
  let totalCodeBlocks = 0

  regionalPages.forEach((page, pageIndex) => {
    console.log(`\n📄 Page ${pageIndex + 1}: ${page.title || page._id}`)

    // Function to recursively search for code blocks
    const findCodeBlocks = (obj, path = '') => {
      if (!obj || typeof obj !== 'object') return

      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          if (item && typeof item === 'object' && item._type === 'code') {
            console.log(`   🚨 FOUND CODE BLOCK at ${path}[${index}]`)
            console.log(`      Content: ${JSON.stringify(item).substring(0, 100)}...`)
            codeBlocksFound = true
            totalCodeBlocks++
          }
          findCodeBlocks(item, `${path}[${index}]`)
        })
      } else {
        Object.entries(obj).forEach(([key, value]) => {
          if (value && typeof value === 'object' && value._type === 'code') {
            console.log(`   🚨 FOUND CODE BLOCK at ${path}.${key}`)
            console.log(`      Content: ${JSON.stringify(value).substring(0, 100)}...`)
            codeBlocksFound = true
            totalCodeBlocks++
          }
          findCodeBlocks(value, path ? `${path}.${key}` : key)
        })
      }
    }

    findCodeBlocks(page)
  })

  console.log(`\n📊 Analysis complete:`)
  console.log(`   Pages analyzed: ${regionalPages.length}`)
  console.log(`   Code blocks found: ${totalCodeBlocks}`)

  if (codeBlocksFound) {
    console.log(`\n⚠️  CODE BLOCKS DETECTED in regional community pages!`)
    console.log(`   These need to be cleaned before re-import.`)
  } else {
    console.log(`\n✅ No code blocks found in regional community pages.`)
  }

  process.exit(0)
}).catch(err => {
  console.error('❌ Error exporting regional pages:', err.message)
  process.exit(1)
})