#!/usr/bin/env node

/**
 * Initialize Algolia Search Indices
 * Run this script after setting up your Algolia environment variables
 */

import { algoliasearch } from 'algoliasearch'
import dotenv from 'dotenv'

dotenv.config()

const ALGOLIA_INDICES = {
  USERS: 'users',
  SANITY_CONTENT: 'sanity_content',
  AGENDAS: 'agendas',
  POSTS: 'posts',
  CASE_STUDIES: 'case_studies',
  NEWS: 'news'
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
  },
  case_studies: {
    searchableAttributes: [
      'unordered(title.en,title.es,title.fr,title.ar)',
      'unordered(excerpt.en,excerpt.es,excerpt.fr,excerpt.ar)',
      'unordered(authors.name)',
      'unordered(tags)',
      'unordered(organizations)'
    ],
    attributesForFaceting: [
      'status',
      'featured',
      'tags',
      'accessLevel',
      'organizations',
      'language',
      'authors.role'
    ],
    customRanking: [
      'desc(featured)',
      'desc(publishedAt)'
    ],
    attributesToHighlight: [
      'title.en',
      'title.es',
      'title.fr',
      'title.ar',
      'authors.name',
      'tags'
    ],
    attributesToSnippet: [
      'excerpt.en:30',
      'excerpt.es:30',
      'excerpt.fr:30',
      'excerpt.ar:30'
    ],
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
    await client.setSettings({
      indexName: ALGOLIA_INDICES.USERS,
      indexSettings: INDEX_SETTINGS.users
    })
    console.log('✅ Users index configured')

    // Initialize other indices (for future use)
    const indicesToCreate = [
      ALGOLIA_INDICES.SANITY_CONTENT,
      ALGOLIA_INDICES.AGENDAS,
      ALGOLIA_INDICES.POSTS,
      ALGOLIA_INDICES.CASE_STUDIES,
      ALGOLIA_INDICES.NEWS
    ]

    for (const indexName of indicesToCreate) {
      console.log(`⚙️  Creating ${indexName} index...`)

      let settings = {
        searchableAttributes: ['title', 'content', 'excerpt'],
        attributesForFaceting: ['contentType', 'categories', 'tags', 'language'],
        customRanking: ['desc(publishedAt)', 'desc(downloadCount)']
      }

      // Use specific settings for case studies
      if (indexName === ALGOLIA_INDICES.CASE_STUDIES) {
        settings = INDEX_SETTINGS.case_studies
      }

      await client.setSettings({
        indexName,
        indexSettings: settings
      })
      console.log(`✅ ${indexName} index created`)
    }

    console.log('\n🎉 Search indices initialized successfully!')
    console.log('\nNext steps:')
    console.log('1. Run your application: npm run dev')
    console.log('2. Sync users to search: POST /api/search/users/sync with {"type": "full"}')
    console.log('3. Sync case studies: POST /api/search/case-studies/sync with {"type": "full"}')
    console.log('4. Sync agendas: POST /api/search/agendas/sync with {"type": "full"}')
    console.log('5. Visit /search to test the search functionality')

  } catch (error) {
    console.error('❌ Failed to initialize search indices:', error)
    process.exit(1)
  }
}

initializeSearch()