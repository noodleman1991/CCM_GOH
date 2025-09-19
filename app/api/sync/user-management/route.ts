import { syncUserManagementToSanity, validateUserManagementSync } from '@/lib/actions/sync-user-management'

export async function POST() {
  try {
    console.log('Starting user management sync...')
    const result = await syncUserManagementToSanity()

    // Validate the sync
    const validation = await validateUserManagementSync()

    return Response.json({
      success: true,
      sync: result,
      validation
    })
  } catch (error) {
    console.error('Sync error:', error)
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    console.log('Validating user management sync...')
    const validation = await validateUserManagementSync()

    return Response.json({
      success: true,
      validation
    })
  } catch (error) {
    console.error('Validation error:', error)
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}