#!/usr/bin/env node

/**
 * Prisma-Sanity Synchronization CLI
 *
 * This script helps manage synchronization between Prisma enums and Sanity CMS content.
 * It can check for inconsistencies, generate missing content, and provide recommendations.
 */

import { createClient } from '@sanity/client'
import dotenv from 'dotenv'
import { exec } from 'child_process'
import { promisify } from 'util'
import { readPrismaSchema, addEnumValues, validateEnumValues } from '../lib/utils/prisma-schema-updater.js'

const execAsync = promisify(exec)

// Prisma enum values (manually defined to avoid import issues)
const WorkType = {
  RESEARCH: 'RESEARCH',
  POLICY: 'POLICY',
  LIVED_EXPERIENCE_EXPERT: 'LIVED_EXPERIENCE_EXPERT',
  NGO: 'NGO',
  COMMUNITY_ORGANIZATION: 'COMMUNITY_ORGANIZATION',
  EDUCATION_TEACHING: 'EDUCATION_TEACHING'
}

const ExpertiseArea = {
  CLIMATE_CHANGE: 'CLIMATE_CHANGE',
  MENTAL_HEALTH: 'MENTAL_HEALTH',
  HEALTH: 'HEALTH'
}

// Load environment variables
dotenv.config()

// Initialize Sanity client
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_EDITOR_TOKEN, // Use editor token for write operations
  useCdn: false,
})

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

// Fetch current Sanity content
async function fetchSanityContent() {
  try {
    const [workTypes, expertiseAreas] = await Promise.all([
      client.fetch(`*[_type == "workType"] { _id, key, label, isActive, order }`),
      client.fetch(`*[_type == "expertiseArea"] { _id, key, label, isActive, order }`)
    ])

    return { workTypes, expertiseAreas }
  } catch (error) {
    log('red', `❌ Error fetching Sanity content: ${error.message}`)
    process.exit(1)
  }
}

// Validate synchronization
async function validateSync() {
  log('blue', '🔍 Checking Prisma-Sanity synchronization...')

  const { workTypes, expertiseAreas } = await fetchSanityContent()

  // Get Prisma enum values
  const prismaWorkTypes = Object.values(WorkType)
  const prismaExpertiseAreas = Object.values(ExpertiseArea)

  // Extract Sanity keys
  const sanityWorkTypeKeys = workTypes.map(wt => wt.key)
  const sanityExpertiseKeys = expertiseAreas.map(ea => ea.key)

  const issues = []

  // Check WorkTypes
  log('cyan', '\n📋 Work Types:')
  for (const prismaKey of prismaWorkTypes) {
    if (sanityWorkTypeKeys.includes(prismaKey)) {
      log('green', `  ✅ ${prismaKey}`)
    } else {
      log('red', `  ❌ ${prismaKey} (missing in Sanity)`)
      issues.push(`Missing WorkType in Sanity: ${prismaKey}`)
    }
  }

  // Check for extra Sanity WorkTypes
  for (const sanityKey of sanityWorkTypeKeys) {
    if (!prismaWorkTypes.includes(sanityKey)) {
      log('yellow', `  ⚠️  ${sanityKey} (exists in Sanity but not in Prisma)`)
      issues.push(`Extra WorkType in Sanity: ${sanityKey}`)
    }
  }

  // Check ExpertiseAreas
  log('cyan', '\n🎓 Expertise Areas:')
  for (const prismaKey of prismaExpertiseAreas) {
    if (sanityExpertiseKeys.includes(prismaKey)) {
      log('green', `  ✅ ${prismaKey}`)
    } else {
      log('red', `  ❌ ${prismaKey} (missing in Sanity)`)
      issues.push(`Missing ExpertiseArea in Sanity: ${prismaKey}`)
    }
  }

  // Check for extra Sanity ExpertiseAreas
  for (const sanityKey of sanityExpertiseKeys) {
    if (!prismaExpertiseAreas.includes(sanityKey)) {
      log('yellow', `  ⚠️  ${sanityKey} (exists in Sanity but not in Prisma)`)
      issues.push(`Extra ExpertiseArea in Sanity: ${sanityKey}`)
    }
  }

  // Summary
  if (issues.length === 0) {
    log('green', '\n✅ All enums are synchronized!')
  } else {
    log('red', `\n❌ Found ${issues.length} synchronization issues:`)
    issues.forEach(issue => log('red', `  • ${issue}`))

    log('cyan', '\n💡 Available actions:')

    // Count different types of issues
    const missingInSanity = issues.filter(i => i.includes('missing in Sanity')).length
    const extraInSanity = issues.filter(i => i.includes('exists in Sanity but not in Prisma')).length

    if (missingInSanity > 0) {
      log('cyan', `  • Run "pnpm sanity:sync generate" to create ${missingInSanity} missing Sanity document(s)`)
    }

    if (extraInSanity > 0) {
      log('cyan', `  • Run "pnpm sanity:sync migrate-enums" to migrate ${extraInSanity} new Sanity enum(s) to Prisma`)
    }
  }

  return { isValid: issues.length === 0, issues }
}

// Generate missing Sanity documents
async function generateMissingContent() {
  log('blue', '🔧 Generating missing Sanity content...')

  const { workTypes, expertiseAreas } = await fetchSanityContent()
  const prismaWorkTypes = Object.values(WorkType)
  const prismaExpertiseAreas = Object.values(ExpertiseArea)

  const sanityWorkTypeKeys = workTypes.map(wt => wt.key)
  const sanityExpertiseKeys = expertiseAreas.map(ea => ea.key)

  const missingWorkTypes = prismaWorkTypes.filter(key => !sanityWorkTypeKeys.includes(key))
  const missingExpertiseAreas = prismaExpertiseAreas.filter(key => !sanityExpertiseKeys.includes(key))

  if (missingWorkTypes.length === 0 && missingExpertiseAreas.length === 0) {
    log('green', '✅ No missing content to generate!')
    return
  }

  const documents = []

  // Generate WorkType documents
  missingWorkTypes.forEach((key, index) => {
    const baseLabel = key.toLowerCase().replace(/_/g, ' ')
    const titleCase = baseLabel.replace(/\b\w/g, l => l.toUpperCase())

    documents.push({
      _type: 'workType',
      key,
      label: [
        { _key: 'en', value: titleCase },
        { _key: 'es', value: titleCase }, // TODO: Proper translation needed
        { _key: 'fr', value: titleCase }, // TODO: Proper translation needed
        { _key: 'ar', value: titleCase }  // TODO: Proper translation needed
      ],
      description: [
        { _key: 'en', value: `Description for ${titleCase}` },
        { _key: 'es', value: `Descripción para ${titleCase}` },
        { _key: 'fr', value: `Description pour ${titleCase}` },
        { _key: 'ar', value: `وصف لـ ${titleCase}` }
      ],
      order: (workTypes.length + index) * 10,
      isActive: true
    })
  })

  // Generate ExpertiseArea documents
  missingExpertiseAreas.forEach((key, index) => {
    const baseLabel = key.toLowerCase().replace(/_/g, ' ')
    const titleCase = baseLabel.replace(/\b\w/g, l => l.toUpperCase())

    documents.push({
      _type: 'expertiseArea',
      key,
      label: [
        { _key: 'en', value: titleCase },
        { _key: 'es', value: titleCase }, // TODO: Proper translation needed
        { _key: 'fr', value: titleCase }, // TODO: Proper translation needed
        { _key: 'ar', value: titleCase }  // TODO: Proper translation needed
      ],
      description: [
        { _key: 'en', value: `Description for ${titleCase}` },
        { _key: 'es', value: `Descripción para ${titleCase}` },
        { _key: 'fr', value: `Description pour ${titleCase}` },
        { _key: 'ar', value: `وصف لـ ${titleCase}` }
      ],
      order: (expertiseAreas.length + index) * 10,
      isActive: true
    })
  })

  if (documents.length > 0) {
    log('yellow', `⬆️  Creating ${documents.length} missing documents...`)

    try {
      const transaction = client.transaction()
      documents.forEach(doc => transaction.create(doc))
      const result = await transaction.commit()

      if (Array.isArray(result)) {
        log('green', `✅ Successfully created ${result.length} documents:`)
        result.forEach(doc => {
          const englishLabel = doc.label?.find(l => l._key === 'en')?.value || doc.key
          log('green', `  • ${doc._type}: ${englishLabel} (${doc.key})`)
        })
      } else if (result.results) {
        log('green', `✅ Successfully created ${result.results.length} documents:`)
        result.results.forEach(res => {
          log('green', `  • ${res.id} (${res.operation})`)
        })
      } else {
        log('green', '✅ Documents created successfully')
        log('green', 'Result:', result)
      }

      log('yellow', '\n⚠️  Note: Generated content uses basic translations.')
      log('yellow', 'Please review and update the content in Sanity Studio for proper translations.')

    } catch (error) {
      log('red', `❌ Error creating documents: ${error.message}`)
      process.exit(1)
    }
  }
}

// Find Sanity enums that don't exist in Prisma (new ones to migrate)
async function findNewSanityEnums() {
  log('blue', '🔍 Finding new Sanity enums to migrate...')

  const { workTypes, expertiseAreas } = await fetchSanityContent()
  const prismaWorkTypes = Object.values(WorkType)
  const prismaExpertiseAreas = Object.values(ExpertiseArea)

  const newWorkTypes = workTypes.filter(wt => !prismaWorkTypes.includes(wt.key))
  const newExpertiseAreas = expertiseAreas.filter(ea => !prismaExpertiseAreas.includes(ea.key))

  return {
    workTypes: newWorkTypes,
    expertiseAreas: newExpertiseAreas
  }
}

// Migrate new enums from Sanity to Prisma
async function migrateEnums() {
  log('blue', '🔄 Starting enum migration from Sanity to Prisma...')

  try {
    const newEnums = await findNewSanityEnums()
    const newWorkTypeKeys = newEnums.workTypes.map(wt => wt.key)
    const newExpertiseKeys = newEnums.expertiseAreas.map(ea => ea.key)

    const totalNew = newWorkTypeKeys.length + newExpertiseKeys.length

    if (totalNew === 0) {
      log('green', '✅ No new enums found in Sanity to migrate!')
      return
    }

    // Display what will be migrated
    log('cyan', `\n📋 Found ${totalNew} new enum(s) to migrate:\n`)

    if (newWorkTypeKeys.length > 0) {
      log('yellow', '🏢 Work Types:')
      newEnums.workTypes.forEach(wt => {
        const englishLabel = wt.label?.find(l => l._key === 'en')?.value || wt.key
        const status = wt.isActive ? '(active)' : '(inactive)'
        log('green', `  • ${wt.key} - "${englishLabel}" ${status}`)
      })
    }

    if (newExpertiseKeys.length > 0) {
      log('yellow', '\n🎓 Expertise Areas:')
      newEnums.expertiseAreas.forEach(ea => {
        const englishLabel = ea.label?.find(l => l._key === 'en')?.value || ea.key
        const status = ea.isActive ? '(active)' : '(inactive)'
        log('green', `  • ${ea.key} - "${englishLabel}" ${status}`)
      })
    }

    log('cyan', '\n🔧 Migration process will:')
    log('cyan', '1. Add new enum values to Prisma schema')
    log('cyan', '2. Generate and run database migration')
    log('cyan', '3. Activate the new enums in Sanity')
    log('cyan', '4. Verify synchronization')

    // Prompt for confirmation
    const readline = await import('readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    const confirm = await new Promise(resolve => {
      rl.question('\n❓ Continue with migration? (y/N): ', answer => {
        rl.close()
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes')
      })
    })

    if (!confirm) {
      log('yellow', '⏹️  Migration cancelled by user')
      return
    }

    // Step 1: Update Prisma schema
    log('blue', '\n📝 Step 1: Updating Prisma schema...')
    const currentSchema = readPrismaSchema()

    let updatedSchema = currentSchema
    const addedEnums = []

    if (newWorkTypeKeys.length > 0) {
      const workTypeResult = addEnumValues(updatedSchema, 'WorkType', newWorkTypeKeys)
      updatedSchema = workTypeResult.content
      addedEnums.push(...workTypeResult.added.map(key => ({ type: 'WorkType', key })))
    }

    if (newExpertiseKeys.length > 0) {
      const expertiseResult = addEnumValues(updatedSchema, 'ExpertiseArea', newExpertiseKeys)
      updatedSchema = expertiseResult.content
      addedEnums.push(...expertiseResult.added.map(key => ({ type: 'ExpertiseArea', key })))
    }

    // Write updated schema (this creates backup automatically)
    const { writePrismaSchema } = await import('../lib/utils/prisma-schema-updater.js')
    writePrismaSchema(updatedSchema)

    // Step 2: Generate and run migration
    log('blue', '\n🏗️  Step 2: Generating and running database migration...')

    const migrationName = `add-${addedEnums.map(e => e.key.toLowerCase()).join('-').substring(0, 50)}`

    try {
      await execAsync('npx prisma generate')
      log('green', '✅ Prisma client generated')

      await execAsync(`npx prisma migrate dev --name ${migrationName}`)
      log('green', '✅ Database migration completed')
    } catch (error) {
      log('red', `❌ Migration failed: ${error.message}`)
      log('yellow', '🔄 Rolling back Prisma schema changes...')

      // Rollback schema
      writePrismaSchema(currentSchema)
      throw new Error('Migration failed - schema rolled back')
    }

    // Step 3: Activate enums in Sanity
    log('blue', '\n✅ Step 3: Activating new enums in Sanity...')

    const idsToActivate = [
      ...newEnums.workTypes.map(wt => wt._id),
      ...newEnums.expertiseAreas.map(ea => ea._id)
    ]

    if (idsToActivate.length > 0) {
      const transaction = client.transaction()

      idsToActivate.forEach(id => {
        transaction.patch(id, { set: { isActive: true } })
      })

      await transaction.commit()
      log('green', `✅ Activated ${idsToActivate.length} enum(s) in Sanity`)
    }

    // Step 4: Verify synchronization
    log('blue', '\n🔍 Step 4: Verifying synchronization...')

    // Small delay to ensure changes are propagated
    await new Promise(resolve => setTimeout(resolve, 1000))

    const finalValidation = await validateSync()
    if (finalValidation.isValid) {
      log('green', '\n🎉 Migration completed successfully!')
      log('green', '✅ All enums are now synchronized between Prisma and Sanity')
    } else {
      log('yellow', '\n⚠️  Migration completed but some issues remain:')
      finalValidation.issues.forEach(issue => log('yellow', `  • ${issue}`))
    }

  } catch (error) {
    log('red', `❌ Migration failed: ${error.message}`)
    process.exit(1)
  }
}

// Display help
function showHelp() {
  console.log(`
${colors.cyan}Prisma-Sanity Synchronization CLI${colors.reset}

${colors.yellow}Usage:${colors.reset}
  node scripts/sync-prisma-sanity.js [command]

${colors.yellow}Commands:${colors.reset}
  check          Check synchronization status between Prisma enums and Sanity content
  generate       Generate missing Sanity documents for Prisma enum values
  migrate-enums  Migrate new Sanity enums to Prisma schema (for developers)
  help           Show this help message

${colors.yellow}Examples:${colors.reset}
  node scripts/sync-prisma-sanity.js check
  node scripts/sync-prisma-sanity.js generate
  node scripts/sync-prisma-sanity.js migrate-enums

${colors.yellow}Environment Variables Required:${colors.reset}
  NEXT_PUBLIC_SANITY_PROJECT_ID
  NEXT_PUBLIC_SANITY_DATASET
  SANITY_API_EDITOR_TOKEN

${colors.yellow}Workflow for New Enums:${colors.reset}
  1. Editor creates new enum in Sanity Studio (will be inactive)
  2. Editor notifies development team
  3. Developer runs: pnpm sanity:sync migrate-enums
  4. New enum is added to Prisma schema and activated in Sanity

${colors.yellow}Notes:${colors.reset}
  • This script ensures Prisma enums match Sanity CMS content
  • Generated content uses basic translations - review in Sanity Studio
  • migrate-enums creates automatic backups and supports rollback
`)
}

// Main function
async function main() {
  const command = process.argv[2]

  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || !process.env.SANITY_API_EDITOR_TOKEN) {
    log('red', '❌ Missing required environment variables')
    log('yellow', 'Required: NEXT_PUBLIC_SANITY_PROJECT_ID, SANITY_API_EDITOR_TOKEN')
    process.exit(1)
  }

  try {
    switch (command) {
      case 'check':
        await validateSync()
        break

      case 'generate':
        const validation = await validateSync()
        if (!validation.isValid) {
          log('yellow', '\n🔧 Proceeding to generate missing content...')
          await generateMissingContent()
        }
        break

      case 'migrate-enums':
        await migrateEnums()
        break

      case 'help':
      case undefined:
        showHelp()
        break

      default:
        log('red', `❌ Unknown command: ${command}`)
        showHelp()
        process.exit(1)
    }
  } catch (error) {
    log('red', `❌ Error: ${error.message}`)
    process.exit(1)
  }
}

// Run the script
main()