// import { Webhook } from 'svix'
// import { headers } from 'next/headers'
// import { prisma } from '@/lib/prisma'
// import { NextResponse } from 'next/server'
//
// // Keep all your existing types
// type UserCreatedEvent = {
//     data: {
//         id: string
//         email_addresses: Array<{
//             email_address: string
//             verification?: {
//                 status: string
//             }
//         }>
//         first_name: string | null
//         last_name: string | null
//         username: string | null
//         image_url: string | null
//         created_at: number
//         updated_at: number
//     }
//     object: 'event'
//     type: 'user.created'
// }
//
// type UserUpdatedEvent = {
//     data: {
//         id: string
//         email_addresses: Array<{
//             email_address: string
//             verification?: {
//                 status: string
//             }
//         }>
//         first_name: string | null
//         last_name: string | null
//         username: string | null
//         image_url: string | null
//         updated_at: number
//     }
//     object: 'event'
//     type: 'user.updated'
// }
//
// type UserDeletedEvent = {
//     data: {
//         id: string
//         deleted: boolean
//     }
//     object: 'event'
//     type: 'user.deleted'
// }
//
// type ClerkWebhookEvent = UserCreatedEvent | UserUpdatedEvent | UserDeletedEvent
//
// class WebhookVerificationError extends Error {
//     constructor(message: string) {
//         super(message)
//         this.name = 'WebhookVerificationError'
//     }
// }
//
// class DatabaseOperationError extends Error {
//     constructor(message: string, public cause?: unknown) {
//         super(message)
//         this.name = 'DatabaseOperationError'
//     }
// }
//
// function getPrimaryEmail(emailAddresses: Array<{ email_address: string; verification?: { status: string } }>): string | null {
//     const verifiedEmail = emailAddresses.find(email => email.verification?.status === 'verified')
//     if (verifiedEmail) return verifiedEmail.email_address
//     return emailAddresses[0]?.email_address || null
// }
//
// async function handleUserCreated(event: UserCreatedEvent) {
//     const { id, email_addresses, first_name, last_name, username, image_url } = event.data
//
//     try {
//         const existingUser = await prisma.user.findUnique({
//             where: { id }
//         })
//
//         if (existingUser) {
//             console.log(`User ${id} already exists, skipping creation`)
//             return { action: 'skipped', reason: 'user_already_exists' }
//         }
//
//         // ONLY CHANGE: Added workTypes and expertiseAreas initialization
//         const user = await prisma.user.create({
//             data: {
//                 id,
//                 email: getPrimaryEmail(email_addresses),
//                 firstName: first_name,
//                 lastName: last_name,
//                 username: username,
//                 image: image_url,
//                 emailVerified: email_addresses.some(email => email.verification?.status === 'verified')
//                     ? new Date()
//                     : null,
//                 workTypes: [],
//                 expertiseAreas: [],
//             }
//         })
//
//         console.log(`Created user: ${user.id}`)
//         return { action: 'created', userId: user.id }
//     } catch (error) {
//         console.error(`Failed to create user ${id}:`, error)
//         throw new DatabaseOperationError(`Failed to create user ${id}`, error)
//     }
// }
//
// async function handleUserUpdated(event: UserUpdatedEvent) {
//     const { id, email_addresses, first_name, last_name, username, image_url } = event.data
//
//     try {
//         const existingUser = await prisma.user.findUnique({
//             where: { id }
//         })
//
//         if (!existingUser) {
//             console.log(`User ${id} doesn't exist, creating...`)
//             return handleUserCreated({
//                 ...event,
//                 type: 'user.created',
//                 data: {
//                     ...event.data,
//                     created_at: Date.now(),
//                 }
//             } as UserCreatedEvent)
//         }
//
//         const user = await prisma.user.update({
//             where: { id },
//             data: {
//                 email: getPrimaryEmail(email_addresses),
//                 firstName: first_name,
//                 lastName: last_name,
//                 username: username,
//                 image: image_url,
//                 emailVerified: email_addresses.some(email => email.verification?.status === 'verified')
//                     ? existingUser.emailVerified || new Date()
//                     : null,
//                 updatedAt: new Date(),
//             }
//         })
//
//         console.log(`Updated user: ${user.id}`)
//         return { action: 'updated', userId: user.id }
//     } catch (error) {
//         console.error(`Failed to update user ${id}:`, error)
//         throw new DatabaseOperationError(`Failed to update user ${id}`, error)
//     }
// }
//
// async function handleUserDeleted(event: UserDeletedEvent) {
//     const { id } = event.data
//
//     try {
//         const existingUser = await prisma.user.findUnique({
//             where: { id }
//         })
//
//         if (!existingUser) {
//             console.log(`User ${id} doesn't exist, skipping deletion`)
//             return { action: 'skipped', reason: 'user_not_found' }
//         }
//
//         await prisma.user.delete({
//             where: { id }
//         })
//
//         console.log(`Deleted user: ${id}`)
//         return { action: 'deleted', userId: id }
//     } catch (error) {
//         console.error(`Failed to delete user ${id}:`, error)
//         throw new DatabaseOperationError(`Failed to delete user ${id}`, error)
//     }
// }
//
// export async function POST(req: Request) {
//     const startTime = Date.now()
//     let eventType: string | undefined
//
//     try {
//         const headerPayload = await headers()
//         const svixId = headerPayload.get("svix-id")
//         const svixTimestamp = headerPayload.get("svix-timestamp")
//         const svixSignature = headerPayload.get("svix-signature")
//
//         if (!svixId || !svixTimestamp || !svixSignature) {
//             console.error('Missing svix headers')
//             return NextResponse.json(
//                 { error: 'Missing svix headers' },
//                 { status: 400 }
//             )
//         }
//
//         const payload = await req.text()
//         const body = JSON.parse(payload)
//
//         const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!)
//         let evt: ClerkWebhookEvent
//
//         try {
//             evt = wh.verify(payload, {
//                 "svix-id": svixId,
//                 "svix-timestamp": svixTimestamp,
//                 "svix-signature": svixSignature,
//             }) as ClerkWebhookEvent
//         } catch (err) {
//             console.error('Webhook verification failed:', err)
//             throw new WebhookVerificationError('Invalid webhook signature')
//         }
//
//         eventType = evt.type
//         console.log(`Processing webhook event: ${eventType}`)
//
//         let result
//         switch (eventType) {
//             case 'user.created':
//                 result = await handleUserCreated(evt as UserCreatedEvent)
//                 break
//
//             case 'user.updated':
//                 result = await handleUserUpdated(evt as UserUpdatedEvent)
//                 break
//
//             case 'user.deleted':
//                 result = await handleUserDeleted(evt as UserDeletedEvent)
//                 break
//
//             default:
//                 console.log(`Unhandled event type: ${eventType}`)
//                 result = { action: 'ignored', eventType }
//         }
//
//         const processingTime = Date.now() - startTime
//         console.log(`Webhook processed in ${processingTime}ms:`, result)
//
//         return NextResponse.json({
//             success: true,
//             result,
//             processingTime
//         })
//
//     } catch (error) {
//         const processingTime = Date.now() - startTime
//         console.error(`Webhook processing failed after ${processingTime}ms:`, error)
//
//         let statusCode = 500
//         let errorMessage = 'Internal server error'
//         let errorDetails: string | undefined
//
//         if (error instanceof WebhookVerificationError) {
//             statusCode = 401
//             errorMessage = error.message
//             errorDetails = error.message
//         } else if (error instanceof DatabaseOperationError) {
//             statusCode = 503
//             errorMessage = 'Database operation failed'
//             errorDetails = error.message
//         } else if (error instanceof Error) {
//             errorDetails = error.message
//         }
//
//         return NextResponse.json(
//             {
//                 error: errorMessage,
//                 details: process.env.NODE_ENV === 'development' ? errorDetails : undefined,
//                 processingTime
//             },
//             { status: statusCode }
//         )
//     }
// }
//
// export async function GET() {
//     try {
//         await prisma.$queryRaw`SELECT 1`
//
//         return NextResponse.json({
//             status: 'healthy',
//             service: 'clerk-webhook',
//             timestamp: new Date().toISOString()
//         })
//     } catch (error) {
//         return NextResponse.json(
//             {
//                 status: 'unhealthy',
//                 service: 'clerk-webhook',
//                 error: 'Database connection failed',
//                 timestamp: new Date().toISOString()
//             },
//             { status: 503 }
//         )
//     }
// }

import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// Keep your existing types...
type UserCreatedEvent = {
    data: {
        id: string
        email_addresses: Array<{
            email_address: string
            verification?: { status: string }
        }>
        first_name: string | null
        last_name: string | null
        username: string | null
        image_url: string | null
        public_metadata: Record<string, any>
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
            verification?: { status: string }
        }>
        first_name: string | null
        last_name: string | null
        username: string | null
        image_url: string | null
        public_metadata: Record<string, any>
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

function getPrimaryEmail(emailAddresses: Array<{ email_address: string; verification?: { status: string } }>): string | null {
    const verifiedEmail = emailAddresses.find(email => email.verification?.status === 'verified')
    return verifiedEmail?.email_address || emailAddresses[0]?.email_address || null
}

async function handleUserCreated(event: UserCreatedEvent): Promise<any> { //todo: proper type
    const { id, email_addresses, first_name, last_name, username, image_url, public_metadata } = event.data

    try {
        console.log(`Creating user ${id} from Clerk webhook`)

        const existingUser = await prisma.user.findUnique({
            where: { id }
        })

        if (existingUser) {
            console.log(`User ${id} already exists, updating instead`)
            return handleUserUpdated(event as any)
        }

        // Create user with data from Clerk (including metadata)
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

                // Get app-specific data from Clerk metadata
                bio: public_metadata?.bio || null,
                ageGroup: public_metadata?.ageGroup || null,
                country: public_metadata?.country || null,
                city: public_metadata?.city || null,
                workTypes: public_metadata?.workTypes || [],
                expertiseAreas: public_metadata?.expertiseAreas || [],
                organization: public_metadata?.organization || null,
                position: public_metadata?.position || null,
                workBio: public_metadata?.workBio || null,
                personalWebsite: public_metadata?.personalWebsite || null,
                linkedinProfile: public_metadata?.linkedinProfile || null,
                twitterHandle: public_metadata?.twitterHandle || null,
            }
        })

        console.log(`✅ Created user: ${user.id}`)
        return { action: 'created', userId: user.id }

    } catch (error) {
        console.error(`❌ Failed to create user ${id}:`, error)
        throw error
    }
}

async function handleUserUpdated(event: UserUpdatedEvent) {
    const { id, email_addresses, first_name, last_name, username, image_url, public_metadata } = event.data

    try {
        console.log(`Updating user ${id} from Clerk webhook`)

        const existingUser = await prisma.user.findUnique({
            where: { id }
        })

        if (!existingUser) {
            console.log(`User ${id} doesn't exist, creating...`)
            return handleUserCreated(event as any)
        }

        // Update user with latest data from Clerk
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
                    : existingUser.emailVerified,

                // Update app-specific data from Clerk metadata
                bio: public_metadata?.bio || existingUser.bio,
                ageGroup: public_metadata?.ageGroup || existingUser.ageGroup,
                country: public_metadata?.country || existingUser.country,
                city: public_metadata?.city || existingUser.city,
                workTypes: public_metadata?.workTypes || existingUser.workTypes,
                expertiseAreas: public_metadata?.expertiseAreas || existingUser.expertiseAreas,
                organization: public_metadata?.organization || existingUser.organization,
                position: public_metadata?.position || existingUser.position,
                workBio: public_metadata?.workBio || existingUser.workBio,
                personalWebsite: public_metadata?.personalWebsite || existingUser.personalWebsite,
                linkedinProfile: public_metadata?.linkedinProfile || existingUser.linkedinProfile,
                twitterHandle: public_metadata?.twitterHandle || existingUser.twitterHandle,

                updatedAt: new Date(),
            }
        })

        console.log(`✅ Updated user: ${user.id}`)
        return { action: 'updated', userId: user.id }

    } catch (error) {
        console.error(`❌ Failed to update user ${id}:`, error)
        throw error
    }
}

async function handleUserDeleted(event: UserDeletedEvent) {
    const { id } = event.data

    try {
        const existingUser = await prisma.user.findUnique({
            where: { id }
        })

        if (!existingUser) {
            console.log(`User ${id} doesn't exist, skipping deletion`)
            return { action: 'skipped', reason: 'user_not_found' }
        }

        await prisma.user.delete({
            where: { id }
        })

        console.log(`✅ Deleted user: ${id}`)
        return { action: 'deleted', userId: id }

    } catch (error) {
        console.error(`❌ Failed to delete user ${id}:`, error)
        throw error
    }
}

export async function POST(req: Request) {
    try {
        const headerPayload = await headers()
        const svixId = headerPayload.get("svix-id")
        const svixTimestamp = headerPayload.get("svix-timestamp")
        const svixSignature = headerPayload.get("svix-signature")

        if (!svixId || !svixTimestamp || !svixSignature) {
            return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
        }

        const payload = await req.text()
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
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }

        const { type } = evt
        console.log(`📥 Processing webhook: ${type}`)

        let result
        switch (type) {
            case 'user.created':
                result = await handleUserCreated(evt)
                break
            case 'user.updated':
                result = await handleUserUpdated(evt)
                break
            case 'user.deleted':
                result = await handleUserDeleted(evt)
                break
            default:
                console.log(`Ignoring event type: ${type}`)
                return NextResponse.json({ success: true, action: 'ignored' })
        }

        console.log(`✅ Webhook processed: ${result.action}`)
        return NextResponse.json({ success: true, result })

    } catch (error) {
        console.error('❌ Webhook failed:', error)
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
    }
}

export async function GET() {
    try {
        await prisma.$queryRaw`SELECT 1`
        return NextResponse.json({ status: 'healthy' })
    } catch (error) {
        return NextResponse.json({ status: 'unhealthy' }, { status: 503 })
    }
}
