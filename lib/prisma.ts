import { PrismaClient, Prisma } from '@/generated/prisma'
import type { DatabaseResult, LocalizedQueryOptions } from '@/types/prisma'

// Global Prisma instance type
declare global {
  var __globalPrisma__: PrismaClient | undefined
}

// Create enhanced Prisma client with logging configuration.
// Errors are emitted as EVENTS, not stdout: Prisma's internal logger prints the
// full multi-hundred-line error (bundled runtime source included) BEFORE
// safeQuery gets to retry it, so every transient "Server has closed the
// connection" (P1017, idle scale-to-zero Postgres) blew up the dev overlay even
// though the retry succeeded. The event handler below logs one line instead;
// genuinely failed queries are still reported by safeQuery itself.
const createPrismaClient = () => {
  const client = new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? [{ level: 'error', emit: 'event' }, 'query', 'warn']
        : [{ level: 'error', emit: 'event' }],
    errorFormat: 'pretty',
  })
  ;(client as unknown as { $on(event: 'error', cb: (e: { message: string }) => void): void }).$on(
    'error',
    (e) => {
      console.warn(`[prisma] ${e.message.split('\n')[0]}`)
    }
  )
  return client
}

// Singleton pattern for Prisma client
export const prisma = globalThis.__globalPrisma__ ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.__globalPrisma__ = prisma
}

/**
 * Prisma codes that mean "couldn't reach/open the connection", as opposed to
 * "the query was wrong". P1001 is the one Neon produces on a cold start.
 * @see https://www.prisma.io/docs/orm/reference/error-reference
 */
const CONNECTION_ERROR_CODES = new Set(['P1000', 'P1001', 'P1002', 'P1008', 'P1017'])

/**
 * Neon (and any scale-to-zero Postgres) suspends the compute when idle. The
 * first query after that wakes it, and can fail before it's accepting
 * connections — the socket is open, so this is not a network outage and a
 * moment later the same query succeeds.
 */
function isTransientConnectionError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) return true
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return CONNECTION_ERROR_CODES.has(error.code)
  }
  return false
}

const COLD_START_RETRY_DELAY_MS = 250

// Type-safe error handling wrapper
export async function safeQuery<T>(
  operation: () => Promise<T>
): Promise<DatabaseResult<T>> {
  try {
    const data = await operation()
    return { success: true, data }
  } catch (error) {
    // Retry ONCE on a connection-level failure so a scale-to-zero cold start
    // doesn't degrade the request (getActor() runs in the main layout, so a
    // blip silently drops staff-only UI on every route). Query errors are not
    // retried — only failures to reach the server.
    if (isTransientConnectionError(error)) {
      await new Promise((resolve) => setTimeout(resolve, COLD_START_RETRY_DELAY_MS))
      try {
        const data = await operation()
        return { success: true, data }
      } catch (retryError) {
        // Concise: the full Prisma initialization error is hundreds of lines of
        // bundled source and drowns the dev overlay.
        console.warn(
          `Database unreachable after retry: ${
            retryError instanceof Error ? retryError.message.split('\n')[0] : retryError
          }`
        )
        return {
          success: false,
          error: {
            code: 'CONNECTION_ERROR',
            message: 'Could not reach the database server',
          },
        }
      }
    }

    console.error('Database operation failed:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          meta: error.meta
        }
      }
    }
    
    if (error instanceof Prisma.PrismaClientValidationError) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid data provided to database operation'
        }
      }
    }
    
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'An unknown error occurred'
      }
    }
  }
}

// i18n-aware query helper
export function createLocalizedQuery(options: LocalizedQueryOptions) {
  const { locale, fallbackLocale = 'en' } = options
  
  return {
    locale,
    fallbackLocale,
    isRTL: locale === 'ar',
    
    // Helper to get localized field value
    getLocalizedValue: (obj: Record<string, string> | string | null | undefined): string => {
      if (!obj) return ''
      if (typeof obj === 'string') return obj
      if (typeof obj === 'object') {
        return obj[locale] || obj[fallbackLocale] || ''
      }
      return ''
    }
  }
}

// Connection management
export async function connectDB(): Promise<void> {
  try {
    await prisma.$connect()
    console.log('✅ Database connected successfully')
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    throw error
  }
}

export async function disconnectDB(): Promise<void> {
  try {
    await prisma.$disconnect()
    console.log('🔌 Database disconnected')
  } catch (error) {
    console.error('❌ Database disconnection failed:', error)
    throw error
  }
}

// Health check
export async function checkDBHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database health check failed:', error)
    return false
  }
}

// Export types for use in other files
// VALUE export, not just type: Prisma.sql fragments must be built by the SAME
// module instance as the client that executes them. The generated client's
// nested-Sql detection is `instanceof`-based, and Turbopack can duplicate
// `@/generated/prisma` across server chunk graphs — a fragment built by the
// other copy fails the instanceof check and gets BOUND AS A JSONB PARAMETER
// (Postgres 42804 "argument of AND must be type boolean, not type jsonb",
// fuzzy-search outage 2026-08-05). Import `Prisma` from here, never from
// `@/generated/prisma`, in any file that builds Prisma.sql/join/raw fragments.
export { Prisma }
export default prisma
