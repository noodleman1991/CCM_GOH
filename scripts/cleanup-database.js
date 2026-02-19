import { createClient } from '@sanity/client'

const client = createClient({
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'development',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'gm67v7rk',
  apiVersion: '2023-01-01',
  useCdn: false,
  token: process.env.SANITY_API_READ_TOKEN
})

console.log('🔍 Starting database cleanup...')
console.log('Preserving: regionalCommunityPage documents + content from Sep 25, 2025')

// First, let's see what we have
const countQuery = `{
  "total": count(*),
  "regionalPages": count(*[_type == "regionalCommunityPage"]),
  "sep25Content": count(*[_createdAt >= "2025-09-25T00:00:00Z" && _createdAt < "2025-09-26T00:00:00Z"]),
  "toDelete": count(*[_type != "regionalCommunityPage" && (_createdAt < "2025-09-25T00:00:00Z" || _createdAt >= "2025-09-26T00:00:00Z")])
}`

console.log('📊 Analyzing current database state...')

client.fetch(countQuery).then(counts => {
  console.log(`Total documents: ${counts.total}`)
  console.log(`Regional community pages: ${counts.regionalPages}`)
  console.log(`Sep 25, 2025 content: ${counts.sep25Content}`)
  console.log(`Documents to delete: ${counts.toDelete}`)

  if (counts.toDelete === 0) {
    console.log('✅ No documents need to be deleted.')
    process.exit(0)
  }

  console.log(`\n⚠️  About to delete ${counts.toDelete} documents!`)
  console.log('This will preserve:')
  console.log('- All regionalCommunityPage documents')
  console.log('- All content created on September 25, 2025')

  // Get the documents to delete for confirmation
  const documentsToDeleteQuery = `*[_type != "regionalCommunityPage" && (_createdAt < "2025-09-25T00:00:00Z" || _createdAt >= "2025-09-26T00:00:00Z")] {
    _id,
    _type,
    _createdAt,
    title
  } | order(_type, _createdAt)`

  return client.fetch(documentsToDeleteQuery)
}).then(docsToDelete => {
  console.log('\n📄 Documents that will be deleted:')

  const byType = {}
  docsToDelete.forEach(doc => {
    if (!byType[doc._type]) byType[doc._type] = 0
    byType[doc._type]++
  })

  Object.entries(byType).forEach(([type, count]) => {
    console.log(`  ${type}: ${count} documents`)
  })

  // Show first few examples
  console.log('\n📋 First 10 documents to be deleted:')
  docsToDelete.slice(0, 10).forEach(doc => {
    const createdAt = doc._createdAt ? new Date(doc._createdAt).toLocaleDateString() : 'unknown'
    console.log(`  - ${doc._type} (${doc._id.slice(-8)}) - ${doc.title || 'No title'} (${createdAt})`)
  })

  if (docsToDelete.length > 10) {
    console.log(`  ... and ${docsToDelete.length - 10} more`)
  }

  console.log('\n🗑️  Starting deletion process...')

  // Delete in batches to avoid overwhelming the API
  const batchSize = 10
  const deleteInBatches = async (docs, processed = 0) => {
    if (processed >= docs.length) {
      console.log(`✅ Successfully deleted ${docs.length} documents`)
      return
    }

    const batch = docs.slice(processed, processed + batchSize)
    const transaction = client.transaction()

    batch.forEach(doc => {
      transaction.delete(doc._id)
    })

    try {
      await transaction.commit()
      console.log(`   Deleted batch ${Math.floor(processed/batchSize) + 1}/${Math.ceil(docs.length/batchSize)} (${batch.length} documents)`)

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100))

      return deleteInBatches(docs, processed + batchSize)
    } catch (error) {
      console.error(`❌ Error deleting batch:`, error.message)
      throw error
    }
  }

  return deleteInBatches(docsToDelete)
}).then(() => {
  console.log('✅ Database cleanup completed successfully!')
  process.exit(0)
}).catch(err => {
  console.error('❌ Error during cleanup:', err.message)
  process.exit(1)
})