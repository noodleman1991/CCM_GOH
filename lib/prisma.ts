import { PrismaClient, Prisma } from '@/generated/prisma'
import type { 
  DatabaseResult, 
  DatabaseError, 
  SupportedLocale,
  LocalizedQueryOptions 
} from '@/types/prisma'

// Global Prisma instance type
declare global {
  var __globalPrisma__: PrismaClient | undefined
}

// Create enhanced Prisma client with logging configuration
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
    errorFormat: 'pretty',
  })
}

// Singleton pattern for Prisma client
export const prisma = globalThis.__globalPrisma__ ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.__globalPrisma__ = prisma
}

// Type-safe error handling wrapper
export async function safeQuery<T>(
  operation: () => Promise<T>
): Promise<DatabaseResult<T>> {
  try {
    const data = await operation()
    return { success: true, data }
  } catch (error) {
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
    getLocalizedValue: (obj: Record<string, any> | string | null | undefined): string => {
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
export type { Prisma }
export default prisma
