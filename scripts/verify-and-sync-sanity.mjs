#!/usr/bin/env node

/**
 * Script to verify and sync Sanity data for onboarding
 * Checks workTypes, expertiseAreas, and onboarding content
 */

import { syncUserManagementToSanity, validateUserManagementSync } from '../lib/actions/sync-user-management.js'

console.log('🔍 Verifying Sanity data...\n')

try {
  // Step 1: Validate current state
  console.log('📊 Step 1: Checking current Sanity data...')
  const validation = await validateUserManagementSync()

  console.log('\n📈 Validation Results:')
  console.log(`  ✓ Work Types in Sanity: ${validation.counts.sanityWorkTypes}`)
  console.log(`  ✓ Expected Work Types: ${validation.counts.prismaWorkTypes}`)
  console.log(`  ✓ Expertise Areas in Sanity: ${validation.counts.sanityExpertiseAreas}`)
  console.log(`  ✓ Expected Expertise Areas: ${validation.counts.prismaExpertiseAreas}`)

  if (validation.missingWorkTypes.length > 0) {
    console.log(`\n  ⚠️ Missing Work Types: ${validation.missingWorkTypes.join(', ')}`)
  }

  if (validation.missingExpertiseAreas.length > 0) {
    console.log(`  ⚠️ Missing Expertise Areas: ${validation.missingExpertiseAreas.join(', ')}`)
  }

  // Step 2: Sync if needed
  if (!validation.isValid) {
    console.log('\n🔄 Step 2: Syncing missing data to Sanity...')
    const syncResult = await syncUserManagementToSanity()

    if (syncResult.success) {
      console.log('  ✅ Work Types synced:', syncResult.workTypes.count)
      console.log('  ✅ Expertise Areas synced:', syncResult.expertiseAreas.count)
    } else {
      console.error('  ❌ Sync failed!')
    }
  } else {
    console.log('\n✅ All data is already in sync!')
  }

  // Step 3: Final validation
  console.log('\n🔍 Step 3: Final verification...')
  const finalValidation = await validateUserManagementSync()

  if (finalValidation.isValid) {
    console.log('✅ SUCCESS! All required data is present in Sanity\n')
    console.log('Next steps:')
    console.log('1. Verify onboarding content documents exist in Sanity Studio for all locales (en, es, fr, ar)')
    console.log('2. Check browser console logs when visiting /onboarding page')
    console.log('3. Look for these log messages:')
    console.log('   - [Onboarding] Loading data for locale: ...')
    console.log('   - [Onboarding] Data loaded: ...')
    console.log('   - [UserManagement] Fetched data: ...')
  } else {
    console.error('❌ FAILED: Some data is still missing')
    console.error('Missing work types:', finalValidation.missingWorkTypes)
    console.error('Missing expertise areas:', finalValidation.missingExpertiseAreas)
  }

} catch (error) {
  console.error('\n❌ Error running verification:', error)
  process.exit(1)
}
