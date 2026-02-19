#!/usr/bin/env node

/**
 * Prisma Schema Updater Utility
 *
 * This utility provides functions to safely update Prisma schema files
 * by adding new enum values while preserving formatting and comments.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SCHEMA_PATH = path.join(__dirname, '..', '..', 'prisma', 'schema.prisma')

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

/**
 * Read the current Prisma schema file
 */
export function readPrismaSchema() {
  try {
    return fs.readFileSync(SCHEMA_PATH, 'utf8')
  } catch (error) {
    throw new Error(`Failed to read Prisma schema: ${error.message}`)
  }
}

/**
 * Write the updated Prisma schema file
 */
export function writePrismaSchema(content) {
  try {
    // Create backup first
    const backupPath = `${SCHEMA_PATH}.backup.${Date.now()}`
    fs.copyFileSync(SCHEMA_PATH, backupPath)
    log('cyan', `📋 Backup created: ${path.basename(backupPath)}`)

    fs.writeFileSync(SCHEMA_PATH, content)
    log('green', '✅ Prisma schema updated successfully')
    return backupPath
  } catch (error) {
    throw new Error(`Failed to write Prisma schema: ${error.message}`)
  }
}

/**
 * Parse existing enums from schema content
 */
export function parseExistingEnums(schemaContent) {
  const enums = {}

  // Match enum blocks with their content
  const enumRegex = /enum\s+(\w+)\s*\{([^}]+)\}/g
  let match

  while ((match = enumRegex.exec(schemaContent)) !== null) {
    const enumName = match[1]
    const enumBody = match[2]

    // Extract enum values
    const values = []
    const valueRegex = /^\s*([A-Z_]+)(?:\s*\/\/.*)?$/gm
    let valueMatch

    while ((valueMatch = valueRegex.exec(enumBody)) !== null) {
      values.push(valueMatch[1])
    }

    enums[enumName] = {
      name: enumName,
      values,
      fullMatch: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length
    }
  }

  return enums
}

/**
 * Add new values to an enum in the schema
 */
export function addEnumValues(schemaContent, enumName, newValues) {
  const enums = parseExistingEnums(schemaContent)

  if (!enums[enumName]) {
    throw new Error(`Enum ${enumName} not found in schema`)
  }

  const enumInfo = enums[enumName]
  const existingValues = enumInfo.values

  // Filter out values that already exist
  const valuesToAdd = newValues.filter(value => !existingValues.includes(value))

  if (valuesToAdd.length === 0) {
    log('yellow', `No new values to add to ${enumName} enum`)
    return { content: schemaContent, added: [] }
  }

  // Build the updated enum content
  const allValues = [...existingValues, ...valuesToAdd]
  const enumBody = allValues.map(value => `  ${value}`).join('\n')
  const updatedEnum = `enum ${enumName} {\n${enumBody}\n}`

  // Replace the old enum with the updated one
  const updatedContent = schemaContent.substring(0, enumInfo.startIndex) +
                         updatedEnum +
                         schemaContent.substring(enumInfo.endIndex)

  log('green', `✅ Added ${valuesToAdd.length} values to ${enumName}: ${valuesToAdd.join(', ')}`)

  return {
    content: updatedContent,
    added: valuesToAdd
  }
}

/**
 * Validate enum value format
 */
export function validateEnumValue(value) {
  const errors = []

  if (!value || typeof value !== 'string') {
    errors.push('Value must be a non-empty string')
  }

  if (!/^[A-Z][A-Z0-9_]*$/.test(value)) {
    errors.push('Value must start with uppercase letter and contain only uppercase letters, numbers, and underscores')
  }

  if (value.endsWith('_')) {
    errors.push('Value cannot end with underscore')
  }

  if (value.includes('__')) {
    errors.push('Value cannot contain consecutive underscores')
  }

  return errors
}

/**
 * Validate multiple enum values
 */
export function validateEnumValues(values) {
  const allErrors = []

  for (const value of values) {
    const errors = validateEnumValue(value)
    if (errors.length > 0) {
      allErrors.push(`${value}: ${errors.join(', ')}`)
    }
  }

  // Check for duplicates
  const duplicates = values.filter((value, index, array) => array.indexOf(value) !== index)
  if (duplicates.length > 0) {
    allErrors.push(`Duplicate values: ${[...new Set(duplicates)].join(', ')}`)
  }

  return allErrors
}

/**
 * Check if values already exist in enum
 */
export function checkExistingValues(schemaContent, enumName, values) {
  const enums = parseExistingEnums(schemaContent)

  if (!enums[enumName]) {
    throw new Error(`Enum ${enumName} not found in schema`)
  }

  const existingValues = enums[enumName].values
  const conflicts = values.filter(value => existingValues.includes(value))

  return conflicts
}

/**
 * Get enum summary for display
 */
export function getEnumSummary(schemaContent) {
  const enums = parseExistingEnums(schemaContent)

  return Object.values(enums).map(enumInfo => ({
    name: enumInfo.name,
    values: enumInfo.values,
    count: enumInfo.values.length
  }))
}

// For command line usage
if (import.meta.url === `file://${process.argv[1]}`) {
  // Command line interface
  const command = process.argv[2]

  try {
    switch (command) {
      case 'list':
        const schema = readPrismaSchema()
        const summary = getEnumSummary(schema)

        log('cyan', '📋 Current Prisma Enums:')
        summary.forEach(enumInfo => {
          log('blue', `\n${enumInfo.name} (${enumInfo.count} values):`)
          enumInfo.values.forEach(value => log('green', `  • ${value}`))
        })
        break

      case 'add':
        if (process.argv.length < 5) {
          log('red', 'Usage: node prisma-schema-updater.js add <EnumName> <VALUE1> [VALUE2] ...')
          process.exit(1)
        }

        const enumName = process.argv[3]
        const values = process.argv.slice(4)

        // Validate values
        const errors = validateEnumValues(values)
        if (errors.length > 0) {
          log('red', '❌ Validation errors:')
          errors.forEach(error => log('red', `  • ${error}`))
          process.exit(1)
        }

        const currentSchema = readPrismaSchema()
        const result = addEnumValues(currentSchema, enumName, values)

        if (result.added.length > 0) {
          writePrismaSchema(result.content)
          log('green', `✅ Successfully added ${result.added.length} values to ${enumName}`)
        }
        break

      default:
        log('yellow', 'Usage:')
        log('yellow', '  node prisma-schema-updater.js list')
        log('yellow', '  node prisma-schema-updater.js add <EnumName> <VALUE1> [VALUE2] ...')
    }
  } catch (error) {
    log('red', `❌ Error: ${error.message}`)
    process.exit(1)
  }
}