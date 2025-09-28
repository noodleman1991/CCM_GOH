import sanityClient from '@sanity/client'

const client = sanityClient({
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'development',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'gm67v7rk',
  apiVersion: '2023-01-01',
  useCdn: false,
  token: process.env.SANITY_API_READ_TOKEN
})

// Query for documents that might contain code blocks in any array field
const query = `*[defined(content) || defined(body) || defined(description)] {
  _id,
  _type,
  "contentCodeBlocks": count(content[_type == "code"]),
  "bodyCodeBlocks": count(body[_type == "code"]),
  "descriptionCodeBlocks": count(description[_type == "code"])
}[contentCodeBlocks > 0 || bodyCodeBlocks > 0 || descriptionCodeBlocks > 0]`

client.fetch(query).then(results => {
  console.log('Documents with code blocks found:', results.length)

  if (results.length > 0) {
    console.log('\nDetails:')
    results.forEach(doc => {
      console.log(`- ${doc._type} (${doc._id}):`)
      if (doc.contentCodeBlocks > 0) console.log(`  content: ${doc.contentCodeBlocks} code blocks`)
      if (doc.bodyCodeBlocks > 0) console.log(`  body: ${doc.bodyCodeBlocks} code blocks`)
      if (doc.descriptionCodeBlocks > 0) console.log(`  description: ${doc.descriptionCodeBlocks} code blocks`)
    })
  }

  process.exit(0)
}).catch(err => {
  console.error('Error querying Sanity:', err.message)
  process.exit(1)
})