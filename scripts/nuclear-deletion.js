import { createClient } from '@sanity/client'

const client = createClient({
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'development',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'gm67v7rk',
  apiVersion: '2023-01-01',
  useCdn: false,
  token: process.env.SANITY_API_EDITOR_TOKEN // Use editor token for write permissions
})

console.log('🚨 NUCLEAR DELETION SCRIPT')
console.log('⚠️  This will delete ALL content except regionalCommunityPage documents')

// First, check what we have
const countQuery = `{
  "total": count(*),
  "regionalPages": count(*[_type == "regionalCommunityPage"]),
  "toDelete": count(*[_type != "regionalCommunityPage"])
}`

client.fetch(countQuery).then(counts => {
  console.log('\n📊 Current state:')
  console.log(`   Total documents: ${counts.total}`)
  console.log(`   Regional pages (KEEP): ${counts.regionalPages}`)
  console.log(`   To delete: ${counts.toDelete}`)

  if (counts.toDelete === 0) {
    console.log('✅ Nothing to delete!')
    process.exit(0)
  }

  console.log('\n🔍 Getting list of documents to delete...')

  // Get all non-regional documents to delete
  const deleteQuery = '*[_type != "regionalCommunityPage"] { _id, _type, title }'
  return client.fetch(deleteQuery)
}).then(docsToDelete => {
  console.log(`\n📋 Found ${docsToDelete.length} documents to delete`)

  // Group by type for summary
  const byType = {}
  docsToDelete.forEach(doc => {
    if (!byType[doc._type]) byType[doc._type] = 0
    byType[doc._type]++
  })

  console.log('\n📄 Breakdown by type:')
  Object.entries(byType).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`)
  })

  console.log('\n🗑️  Starting deletion process...')

  // Delete in smaller batches (5 at a time to be safe)
  const deleteInBatches = async (docs, processed = 0) => {
    if (processed >= docs.length) {
      console.log('✅ All deletions completed!')
      return
    }

    const batchSize = 5
    const batch = docs.slice(processed, processed + batchSize)

    console.log(`   Deleting batch ${Math.floor(processed/batchSize) + 1}/${Math.ceil(docs.length/batchSize)}...`)

    try {
      // Try individual deletions to avoid transaction limits
      for (const doc of batch) {
        await client.delete(doc._id)
        console.log(`     ✓ Deleted ${doc._type} (${doc._id.slice(-8)})`)
      }

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 500))

      return deleteInBatches(docs, processed + batchSize)
    } catch (error) {
      console.error(`❌ Error deleting batch:`, error.message)
      throw error
    }
  }

  return deleteInBatches(docsToDelete)
}).then(() => {
  console.log('\n🎉 Nuclear deletion completed successfully!')
  console.log('Only regional community pages remain.')

  // Verify final state
  return client.fetch('{"remaining": count(*), "regional": count(*[_type == "regionalCommunityPage"])}')
}).then(final => {
  console.log('\n📊 Final state:')
  console.log(`   Total documents remaining: ${final.remaining}`)
  console.log(`   Regional pages: ${final.regional}`)

  if (final.remaining === final.regional) {
    console.log('✅ SUCCESS: Only regional community pages remain!')
  } else {
    console.log('⚠️  WARNING: Some non-regional documents may still exist')
  }

  process.exit(0)
}).catch(err => {
  console.error('❌ Nuclear deletion failed:', err.message)
  console.error('Check token permissions - may need WRITE access')
  process.exit(1)
})