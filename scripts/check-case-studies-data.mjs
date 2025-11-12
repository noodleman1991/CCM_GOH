import { createClient } from '@sanity/client'

const client = createClient({
  projectId: 'gm67v7rk',
  dataset: 'production_2',
  apiVersion: '2024-04-24',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN
})

async function checkCaseStudies() {
  console.log('Checking case studies in Sanity...\n')

  // Get all case studies
  const allCaseStudies = await client.fetch(`*[_type == "caseStudy"] {
    _id,
    "title": title.en,
    status,
    slug,
    publishedAt,
    featured,
    "relatedCommunity": relatedCommunity->name.en
  }`)

  console.log(`Total case studies: ${allCaseStudies.length}`)

  // Group by status
  const byStatus = allCaseStudies.reduce((acc, cs) => {
    acc[cs.status] = (acc[cs.status] || 0) + 1
    return acc
  }, {})

  console.log('\nCase studies by status:')
  console.log(byStatus)

  // Show approved case studies
  const approved = allCaseStudies.filter(cs => cs.status === 'approved')
  console.log(`\n\nApproved case studies (${approved.length}):`)
  approved.forEach(cs => {
    console.log(`  - ${cs.title || 'Untitled'}`)
    console.log(`    Slug: ${cs.slug?.current || 'No slug'}`)
    console.log(`    Community: ${cs.relatedCommunity || 'None'}`)
    console.log(`    Featured: ${cs.featured || false}`)
    console.log(`    Published: ${cs.publishedAt || 'Not set'}`)
    console.log('')
  })

  // Show case studies without slugs
  const noSlug = allCaseStudies.filter(cs => !cs.slug?.current)
  if (noSlug.length > 0) {
    console.log(`\nCase studies missing slugs (${noSlug.length}):`)
    noSlug.forEach(cs => {
      console.log(`  - ${cs.title || 'Untitled'} (${cs._id})`)
    })
  }

  // Show case studies without regional community
  const noCommunity = allCaseStudies.filter(cs => !cs.relatedCommunity)
  if (noCommunity.length > 0) {
    console.log(`\nCase studies without regional community (${noCommunity.length}):`)
    noCommunity.forEach(cs => {
      console.log(`  - ${cs.title || 'Untitled'} (${cs.status})`)
    })
  }
}

checkCaseStudies().catch(console.error)
