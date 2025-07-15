// app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// Webhook event types we care about
type UserCreatedEvent = {
    data: {
        id: string
        email_addresses: Array<{
            email_address: string
            verification?: {
                status: string
            }
        }>
        first_name: string | null
        last_name: string | null
        username: string | null
        image_url: string | null
        created_at: number
        updated_at: number
    }
    object: 'event'
    type: 'user.created'
}

type UserUpdatedEvent = {
    data: {
        id: string
        email_addresses: Array<{
            email_address: string
            verification?: {
                status: string
            }
        }>
        first_name: string | null
        last_name: string | null
        username: string | null
        image_url: string | null
        updated_at: number
    }
    object: 'event'
    type: 'user.updated'
}

type UserDeletedEvent = {
    data: {
        id: string
        deleted: boolean
    }
    object: 'event'
    type: 'user.deleted'
}

type ClerkWebhookEvent = UserCreatedEvent | UserUpdatedEvent | UserDeletedEvent

// Error types for better error handling
class WebhookVerificationError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'WebhookVerificationError'
    }
}

class DatabaseOperationError extends Error {
    constructor(message: string, public cause?: unknown) {
        super(message)
        this.name = 'DatabaseOperationError'
    }
}

// Helper function to get primary email
function getPrimaryEmail(emailAddresses: Array<{ email_address: string; verification?: { status: string } }>): string | null {
    // First try to find a verified email
    const verifiedEmail = emailAddresses.find(email => email.verification?.status === 'verified')
    if (verifiedEmail) return verifiedEmail.email_address

    // If no verified email, return the first one
    return emailAddresses[0]?.email_address || null
}

// Event handlers
async function handleUserCreated(event: UserCreatedEvent) {
    const { id, email_addresses, first_name, last_name, username, image_url } = event.data

    try {
        // Check if user already exists (idempotency)
        const existingUser = await prisma.user.findUnique({
            where: { id }
        })

        if (existingUser) {
            console.log(`User ${id} already exists, skipping creation`)
            return { action: 'skipped', reason: 'user_already_exists' }
        }

        // Create user in database
        const user = await prisma.user.create({
            data: {
                id,
                email: getPrimaryEmail(email_addresses),
                firstName: first_name,
                lastName: last_name,
                username: username,
                image: image_url,
                emailVerified: email_addresses.some(email => email.verification?.status === 'verified')
                    ? new Date()
                    : null,
            }
        })

        console.log(`Created user: ${user.id}`)
        return { action: 'created', userId: user.id }
    } catch (error) {
        console.error(`Failed to create user ${id}:`, error)
        throw new DatabaseOperationError(`Failed to create user ${id}`, error)
    }
}

async function handleUserUpdated(event: UserUpdatedEvent) {
    const { id, email_addresses, first_name, last_name, username, image_url } = event.data

    try {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id }
        })

        if (!existingUser) {
            // User doesn't exist, create them
            console.log(`User ${id} doesn't exist, creating...`)
            return handleUserCreated({
                ...event,
                type: 'user.created',
                data: {
                    ...event.data,
                    created_at: Date.now(),
                }
            } as UserCreatedEvent)
        }

        // Update user in database
        const user = await prisma.user.update({
            where: { id },
            data: {
                email: getPrimaryEmail(email_addresses),
                firstName: first_name,
                lastName: last_name,
                username: username,
                image: image_url,
                emailVerified: email_addresses.some(email => email.verification?.status === 'verified')
                    ? existingUser.emailVerified || new Date()
                    : null,
                updatedAt: new Date(),
            }
        })

        console.log(`Updated user: ${user.id}`)
        return { action: 'updated', userId: user.id }
    } catch (error) {
        console.error(`Failed to update user ${id}:`, error)
        throw new DatabaseOperationError(`Failed to update user ${id}`, error)
    }
}

async function handleUserDeleted(event: UserDeletedEvent) {
    const { id } = event.data

    try {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id }
        })

        if (!existingUser) {
            console.log(`User ${id} doesn't exist, skipping deletion`)
            return { action: 'skipped', reason: 'user_not_found' }
        }

        // Delete user from database
        // Note: This will cascade delete related records due to onDelete: Cascade in schema
        await prisma.user.delete({
            where: { id }
        })

        console.log(`Deleted user: ${id}`)
        return { action: 'deleted', userId: id }
    } catch (error) {
        console.error(`Failed to delete user ${id}:`, error)
        throw new DatabaseOperationError(`Failed to delete user ${id}`, error)
    }
}

// Main webhook handler
export async function POST(req: Request) {
    const startTime = Date.now()
    let eventType: string | undefined

    try {
        // Get the headers (await for Next.js 15+)
        const headerPayload = await headers()
        const svixId = headerPayload.get("svix-id")
        const svixTimestamp = headerPayload.get("svix-timestamp")
        const svixSignature = headerPayload.get("svix-signature")

        // If there are no SVIX headers, error out
        if (!svixId || !svixTimestamp || !svixSignature) {
            console.error('Missing svix headers')
            return NextResponse.json(
                { error: 'Missing svix headers' },
                { status: 400 }
            )
        }

        // Get the body
        const payload = await req.text()
        const body = JSON.parse(payload)

        // Verify the webhook
        const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!)
        let evt: ClerkWebhookEvent

        try {
            evt = wh.verify(payload, {
                "svix-id": svixId,
                "svix-timestamp": svixTimestamp,
                "svix-signature": svixSignature,
            }) as ClerkWebhookEvent
        } catch (err) {
            console.error('Webhook verification failed:', err)
            throw new WebhookVerificationError('Invalid webhook signature')
        }

        // Get the event type
        eventType = evt.type
        console.log(`Processing webhook event: ${eventType}`)

        // Handle the event
        let result
        switch (eventType) {
            case 'user.created':
                result = await handleUserCreated(evt as UserCreatedEvent)
                break

            case 'user.updated':
                result = await handleUserUpdated(evt as UserUpdatedEvent)
                break

            case 'user.deleted':
                result = await handleUserDeleted(evt as UserDeletedEvent)
                break

            default:
                // We don't handle other event types
                console.log(`Unhandled event type: ${eventType}`)
                result = { action: 'ignored', eventType }
        }

        const processingTime = Date.now() - startTime
        console.log(`Webhook processed in ${processingTime}ms:`, result)

        return NextResponse.json({
            success: true,
            result,
            processingTime
        })

    } catch (error) {
        const processingTime = Date.now() - startTime
        console.error(`Webhook processing failed after ${processingTime}ms:`, error)

        // Log to your error tracking service (e.g., Sentry)
        // Sentry.captureException(error, {
        //   tags: {
        //     webhook_type: 'clerk',
        //     event_type: eventType,
        //   }
        // })

        // Determine the appropriate status code
        let statusCode = 500
        let errorMessage = 'Internal server error'
        let errorDetails: string | undefined

        if (error instanceof WebhookVerificationError) {
            statusCode = 401
            errorMessage = error.message
            errorDetails = error.message
        } else if (error instanceof DatabaseOperationError) {
            statusCode = 503 // Service Unavailable - will trigger retry
            errorMessage = 'Database operation failed'
            errorDetails = error.message
        } else if (error instanceof Error) {
            errorDetails = error.message
        }

        return NextResponse.json(
            {
                error: errorMessage,
                details: process.env.NODE_ENV === 'development' ? errorDetails : undefined,
                processingTime
            },
            { status: statusCode }
        )
    }
}

// Health check endpoint for monitoring
export async function GET() {
    try {
        // Check database connectivity
        await prisma.$queryRaw`SELECT 1`

        return NextResponse.json({
            status: 'healthy',
            service: 'clerk-webhook',
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        return NextResponse.json(
            {
                status: 'unhealthy',
                service: 'clerk-webhook',
                error: 'Database connection failed',
                timestamp: new Date().toISOString()
            },
            { status: 503 }
        )
    }
}
