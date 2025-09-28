import { createClient } from '@sanity/client'

const client = createClient({
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'development',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'gm67v7rk',
  apiVersion: '2023-01-01',
  useCdn: false,
  token: process.env.SANITY_API_READ_TOKEN
})

console.log('🔍 Searching for all documents with code blocks...')

// Comprehensive query to find ANY document with code blocks in ANY field
const findCodeBlocksQuery = `*[] {
  _id,
  _type,
  _createdAt,
  title,
  // Check all possible fields that might contain arrays with code blocks
  "hasCodeInContent": defined(content) && count(content[_type == "code"]) > 0,
  "hasCodeInBody": defined(body) && count(body[_type == "code"]) > 0,
  "hasCodeInDescription": defined(description) && count(description[_type == "code"]) > 0,
  "hasCodeInBlocks": defined(blocks) && count(blocks[_type == "code"]) > 0,
  "hasCodeInText": defined(text) && count(text[_type == "code"]) > 0,
  // For complex documents, check nested sections
  "sectionsWithCode": sections[]._type == "code",
  "modulesWithCode": modules[]._type == "code",
  // For page-like documents
  "pageContentWithCode": pageContent[]._type == "code",
  // Generic check for any nested code blocks
  "rawDocument": *
}[
  hasCodeInContent == true ||
  hasCodeInBody == true ||
  hasCodeInDescription == true ||
  hasCodeInBlocks == true ||
  hasCodeInText == true ||
  count(sectionsWithCode) > 0 ||
  count(modulesWithCode) > 0 ||
  count(pageContentWithCode) > 0
]`

client.fetch(findCodeBlocksQuery).then(docsWithCode => {
  console.log(`\n📊 Found ${docsWithCode.length} documents with code blocks\n`)

  if (docsWithCode.length === 0) {
    console.log('✅ No documents contain code blocks in the expected fields.')
    console.log('The error might be coming from a different source.')

    // Let's also do a raw search for any document containing the string "code"
    const rawSearchQuery = '*[references("code") || content[].marks[].name == "code" || body[].marks[].name == "code"]'
    return client.fetch(rawSearchQuery)
  }

  docsWithCode.forEach((doc, index) => {
    console.log(`${index + 1}. ${doc._type} (${doc._id.slice(-8)})`)
    if (doc.title) console.log(`   Title: ${doc.title}`)
    console.log(`   Created: ${doc._createdAt ? new Date(doc._createdAt).toLocaleDateString() : 'unknown'}`)

    const codeLocations = []
    if (doc.hasCodeInContent) codeLocations.push('content')
    if (doc.hasCodeInBody) codeLocations.push('body')
    if (doc.hasCodeInDescription) codeLocations.push('description')
    if (doc.hasCodeInBlocks) codeLocations.push('blocks')
    if (doc.hasCodeInText) codeLocations.push('text')
    if (doc.sectionsWithCode?.length) codeLocations.push('sections')
    if (doc.modulesWithCode?.length) codeLocations.push('modules')
    if (doc.pageContentWithCode?.length) codeLocations.push('pageContent')

    console.log(`   Code blocks in: ${codeLocations.join(', ')}`)
    console.log('')
  })

  return docsWithCode
}).then(docsWithCode => {
  if (docsWithCode && docsWithCode.length === 0) {
    console.log('🔍 Searching for any reference to "code" in the database...')

    // Alternative search for documents that might reference code in different ways
    const alternativeQuery = '*[defined(content) && string::contains(string(content), "code")]'
    return client.fetch(alternativeQuery)
  }
  return docsWithCode
}).then(results => {
  if (Array.isArray(results) && results.length === 0) {
    console.log('🤔 No obvious code block references found.')
    console.log('The React error might be coming from:')
    console.log('1. Cached/stale data in Next.js')
    console.log('2. Schema type definitions')
    console.log('3. Component serializers expecting code blocks')
    console.log('4. Hidden or nested data structures')
  }

  process.exit(0)
}).catch(err => {
  console.error('❌ Error searching for code blocks:', err.message)
  process.exit(1)
})