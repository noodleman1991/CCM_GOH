#!/usr/bin/env node

/**
 * Initialize Algolia Search Indices
 * Run this script after setting up your Algolia environment variables
 */

const { algoliasearch } = require('algoliasearch')
require('dotenv').config({ path: '.env.local' })

const ALGOLIA_INDICES = {
  USERS: 'users',
  SANITY_CONTENT: 'sanity_content',
  REPORTS: 'reports',
  POSTS: 'posts',
  CASE_STUDIES: 'case_studies'
}

const INDEX_SETTINGS = {
  users: {
    searchableAttributes: [
      'unordered(firstName)',
      'unordered(lastName)',
      'unordered(fullName)',
      'unordered(username)',
      'unordered(bio)',
      'unordered(organization)',
      'unordered(position)',
      'unordered(location)',
      'unordered(workTypes)',
      'unordered(expertiseAreas)',
      'unordered(communities)'
    ],
    attributesForFaceting: [
      'workTypes',
      'expertiseAreas', 
      'country',
      'role',
      'profileVisibility',
      'communities'
    ],
    ranking: [
      'typo',
      'geo',
      'words',
      'filters',
      'proximity',
      'attribute',
      'exact',
      'custom'
    ],
    customRanking: [
      'desc(lastActiveAt)',
      'desc(communityCount)',
      'desc(joinedAt)'
    ],
    attributesToHighlight: [
      'firstName',
      'lastName',
      'username', 
      'bio',
      'organization',
      'position'
    ],
    attributesToSnippet: ['bio:20'],
    hitsPerPage: 20,
    maxValuesPerFacet: 100
  }
}

async function initializeSearch() {
  console.log('🔍 Initializing Algolia Search Indices...')

  // Check environment variables
  if (!process.env.ALGOLIA_APP_ID) {
    console.error('❌ ALGOLIA_APP_ID is not set')
    process.exit(1)
  }

  if (!process.env.ALGOLIA_API_KEY) {
    console.error('❌ ALGOLIA_API_KEY is not set')
    process.exit(1)
  }

  if (!process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY) {
    console.error('❌ NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY is not set')
    process.exit(1)
  }

  try {
    const client = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_API_KEY)

    // Initialize users index
    console.log('⚙️  Setting up users index...')
    const usersIndex = client.initIndex(ALGOLIA_INDICES.USERS)
    await usersIndex.setSettings(INDEX_SETTINGS.users)
    console.log('✅ Users index configured')

    // Initialize other indices (for future use)
    const indicesToCreate = [
      ALGOLIA_INDICES.SANITY_CONTENT,
      ALGOLIA_INDICES.REPORTS,
      ALGOLIA_INDICES.POSTS,
      ALGOLIA_INDICES.CASE_STUDIES
    ]

    for (const indexName of indicesToCreate) {
      console.log(`⚙️  Creating ${indexName} index...`)
      const index = client.initIndex(indexName)
      await index.setSettings({
        searchableAttributes: ['title', 'content', 'excerpt'],
        attributesForFaceting: ['contentType', 'categories', 'tags', 'language'],
        customRanking: ['desc(publishedAt)', 'desc(downloadCount)']
      })
      console.log(`✅ ${indexName} index created`)
    }

    console.log('\n🎉 Search indices initialized successfully!')
    console.log('\nNext steps:')
    console.log('1. Run your application: npm run dev')
    console.log('2. Sync users to search: POST /api/search/users/sync with {"type": "full"}')
    console.log('3. Visit /search to test the search functionality')

  } catch (error) {
    console.error('❌ Failed to initialize search indices:', error)
    process.exit(1)
  }
}

initializeSearch()