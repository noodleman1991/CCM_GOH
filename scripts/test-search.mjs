#!/usr/bin/env node
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { algoliasearch } from 'algoliasearch'

const client = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID,
  process.env.ALGOLIA_ADMIN_API_KEY
)

const INDICES = {
  USERS: process.env.NEXT_PUBLIC_ALGOLIA_USERS_INDEX || 'users',
  AGENDAS: process.env.NEXT_PUBLIC_ALGOLIA_AGENDAS_INDEX || 'agendas',
  NEWS: process.env.NEXT_PUBLIC_ALGOLIA_NEWS_INDEX || 'news',
  CASE_STUDIES: process.env.NEXT_PUBLIC_ALGOLIA_CASE_STUDIES_INDEX || 'case_studies'
}

async function checkIndices() {
  console.log('🔍 Checking Algolia indices...\n')

  for (const [name, indexName] of Object.entries(INDICES)) {
    try {
      const { results } = await client.search({
        requests: [{
          indexName,
          query: '',
          hitsPerPage: 3
        }]
      })

      const hits = results[0]?.hits || []
      console.log(`✅ ${name} (${indexName}): ${results[0]?.nbHits || 0} total records`)

      if (hits.length > 0) {
        console.log(`   Sample: ${hits[0].title?.en || hits[0].fullName || hits[0].objectID}`)
      }
      console.log('')
    } catch (error) {
      console.error(`❌ ${name}: ${error.message}\n`)
    }
  }
}

checkIndices()
