
import { Webhook } from 'svix'
import { prisma } from '@/lib/prisma'
import { NextResponse, after } from 'next/server'
import { deleteUserData } from '@/lib/account-deletion'
import { syncUserSearchRecord } from '@/lib/algolia-user-sync'
import { captureAfterResponse } from '@/lib/analytics/server'

/**
 * Update the user's search record after the response has been sent, and log
 * a failure with the user id. Replaces three un-awaited `fetch` calls to
 * `${NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/search/users/webhook`
 * whose only error handling was `.catch` on the network error — a 401 or a
 * 404 from that hop resolved as success and was never logged (audit finding
 * H5). The indexer is a local function; there is no reason to go over HTTP.
 */
function scheduleSearchIndexUpdate(userId: string): void {
    after(async () => {
        try {
            await syncUserSearchRecord(userId, 'update')
        } catch (error) {
            console.error(`❌ Search index update failed for user ${userId}:`, error)
        }
    })
}

// Enhanced types for better Clerk integration
type UserCreatedEvent = {
    data: {
        id: string
        email_addresses: Array<{
            email_address: string
            verification?: { status: string }
        }>
        phone_numbers: Array<{
            phone_number: string
            verification?: { status: string }
        }>
        first_name: string | null
        last_name: string | null
        username: string | null
        image_url: string | null
        profile_image_url: string | null
        public_metadata: { onboardingCompleted?: boolean } & Record<string, unknown>
        private_metadata: Record<string, unknown>
        unsafe_metadata: Record<string, unknown>
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
        phone_numbers: Array<{
            phone_number: string
            verification?: { status: string }
        }>
        first_name: string | null
        last_name: string | null
        username: string | null
        image_url: string | null
        profile_image_url: string | null
        public_metadata: { onboardingCompleted?: boolean } & Record<string, unknown>
        private_metadata: Record<string, unknown>
        unsafe_metadata: Record<string, unknown>
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

type SessionCreatedEvent = {
    data: {
        id: string
        user_id: string
        status: string
        created_at: number
    }
    object: 'event'
    type: 'session.created'
}

type ClerkWebhookEvent = UserCreatedEvent | UserUpdatedEvent | UserDeletedEvent | SessionCreatedEvent

/** What the per-event handlers below resolve to (consumed by POST's `result.action`). */
type WebhookHandlerResult = {
    action: string
    userId?: string
    reason?: string
    existingUserId?: string
    newClerkId?: string
    email?: string
}

function getPrimaryEmail(emailAddresses: Array<{ email_address: string; verification?: { status: string } }>): string | undefined {
    const verifiedEmail = emailAddresses.find(email => email.verification?.status === 'verified')
    return verifiedEmail?.email_address || emailAddresses[0]?.email_address
}

function getPrimaryPhone(phoneNumbers: Array<{ phone_number: string; verification?: { status: string } }>): { phone: string | null, verified: boolean } {
    const verifiedPhone = phoneNumbers.find(phone => phone.verification?.status === 'verified')
    if (verifiedPhone) {
        return { phone: verifiedPhone.phone_number, verified: true }
    }
    
    const primaryPhone = phoneNumbers[0]?.phone_number || null
    return { phone: primaryPhone, verified: false }
}

function getProfileImage(imageUrl: string | null, profileImageUrl: string | null): string | null {
    // Prefer profile_image_url over image_url as it's more specific
    return profileImageUrl || imageUrl || null
}

async function handleUserCreated(event: UserCreatedEvent): Promise<WebhookHandlerResult> {
    const { id, email_addresses, phone_numbers, first_name, last_name, username, image_url, profile_image_url } = event.data

    // Move these outside try block so they're accessible in catch (email conflict handler)
    const phoneData = getPrimaryPhone(phone_numbers || [])
    const profileImage = getProfileImage(image_url, profile_image_url)

    try {
        console.log(`📥 Creating user ${id} from Clerk webhook`)
        console.log(`[Webhook Debug] user.created - firstName: "${first_name}", lastName: "${last_name}", username: "${username}", email: ${email_addresses[0]?.email_address}`)

        const existingUser = await prisma.user.findUnique({
            where: { id }
        })

        if (existingUser) {
            console.log(`User ${id} already exists, updating instead`)
            // A created event carries the same user payload; only the literal `type` differs.
            return handleUserUpdated(event as unknown as UserUpdatedEvent)
        }

        // Create user with Clerk auth data only
        // All profile/work data is managed in Prisma, not in Clerk metadata
        const user = await prisma.user.create({
            data: {
                id,
                email: getPrimaryEmail(email_addresses),
                firstName: first_name,
                lastName: last_name,
                username: username,
                image: profileImage,
                emailVerified: email_addresses.some(email => email.verification?.status === 'verified')
                    ? new Date()
                    : null,

                // Clerk-managed phone data
                phoneNumber: phoneData.phone,
                phoneVerified: phoneData.verified ? new Date() : null,

                // Only defaults - no metadata from Clerk
                workTypes: [],
                expertiseAreas: [],
                isSearchable: true,
                profileVisibility: 'MEMBERS',
                showEmail: false,
                showPhoneNumber: false,
                showWorkDetails: true,
                showSocialLinks: true,
                showLocation: true,
            }
        })

        console.log(`✅ Created user: ${user.id}`)

        scheduleSearchIndexUpdate(user.id)
        captureAfterResponse({
                event: "sign_up_completed",
                distinctId: user.id,
                properties: {},
                set: { role: "community_member", onboarding_completed: false },
            })

        return { action: 'created', userId: user.id }

    } catch (error) {
        // Handle email conflict (P2002) gracefully
        const prismaError = error as { code?: string; meta?: { target?: string[] } }
        if (prismaError.code === 'P2002' && prismaError.meta?.target?.includes('email')) {
            const emailAddress = getPrimaryEmail(email_addresses)
            console.log(`⚠️ Email ${emailAddress} already exists, checking for existing user`)

            // Find user by email
            const existingUserByEmail = await prisma.user.findUnique({
                where: { email: emailAddress }
            })

            if (existingUserByEmail) {
                // Check if it's the same Clerk ID or different
                if (existingUserByEmail.id === id) {
                    console.log(`✅ User ${id} already exists with same email, skipping creation`)
                    return { action: 'skipped', reason: 'user_already_exists', userId: id }
                } else {
                    // Different Clerk ID with same email - log conflict for manual resolution
                    // Do NOT auto-delete: would destroy community memberships, recent work, download history
                    console.error(`🚨 EMAIL CONFLICT: New Clerk user ${id} has email ${emailAddress} which belongs to existing user ${existingUserByEmail.id}`)
                    console.error(`   Action required: Manually resolve this conflict`)
                    console.error(`   Old user ID: ${existingUserByEmail.id}, New Clerk ID: ${id}`)

                    return {
                        action: 'conflict_detected',
                        reason: 'email_conflict',
                        existingUserId: existingUserByEmail.id,
                        newClerkId: id,
                        email: emailAddress
                    }
                }
            } else {
                // Email constraint failed but we can't find the user - log and rethrow
                console.error(`❌ Email constraint failed but user not found by email: ${emailAddress}`)
                throw error
            }
        }

        // Other errors - log and rethrow
        console.error(`❌ Failed to create user ${id}:`, error)
        throw error
    }
}

async function handleUserUpdated(event: UserUpdatedEvent) {
    const { id, email_addresses, phone_numbers, first_name, last_name, username, image_url, profile_image_url, public_metadata } = event.data

    try {
        console.log(`📥 Updating user ${id} from Clerk webhook`)
        console.log(`[Webhook Debug] user.updated - firstName: "${first_name}", lastName: "${last_name}", username: "${username}", email: ${email_addresses[0]?.email_address}`)

        const existingUser = await prisma.user.findUnique({
            where: { id }
        })

        if (!existingUser) {
            console.log(`User ${id} doesn't exist, creating...`)
            // An updated event carries the same user payload; only the literal `type` differs.
            return handleUserCreated(event as unknown as UserCreatedEvent)
        }

        const phoneData = getPrimaryPhone(phone_numbers || [])
        const profileImage = getProfileImage(image_url, profile_image_url)

        // ALWAYS update Clerk-managed fields (these are source of truth from Clerk)
        const baseUpdateData = {
            email: getPrimaryEmail(email_addresses),
            firstName: first_name,
            lastName: last_name,
            username: username,
            image: profileImage,
            emailVerified: email_addresses.some(email => email.verification?.status === 'verified')
                ? existingUser.emailVerified || new Date()
                : existingUser.emailVerified,
            phoneNumber: phoneData.phone,
            phoneVerified: phoneData.verified ? new Date() : null,
            updatedAt: new Date(),
        }

        // Only sync essential onboarding metadata from Clerk
        // All user profile data is managed exclusively in Prisma
        const metadataUpdate: { onboardingCompleted?: boolean; welcomeMessageSeen?: boolean; onboardingStep?: number } = {}

        // Handle onboarding completion status
        if (public_metadata?.onboardingCompleted !== undefined) {
            metadataUpdate.onboardingCompleted = public_metadata.onboardingCompleted
            metadataUpdate.welcomeMessageSeen = true
            metadataUpdate.onboardingStep = public_metadata.onboardingCompleted ? 6 : 0
        }

        // Update user with Clerk auth data + minimal metadata
        const user = await prisma.user.update({
            where: { id },
            data: {
                ...baseUpdateData,
                ...metadataUpdate
            }
        })

        console.log(`✅ Updated user: ${user.id}`)

        scheduleSearchIndexUpdate(user.id)

        return { action: 'updated', userId: user.id }

    } catch (error) {
        console.error(`❌ Failed to update user ${id}:`, error)
        throw error
    }
}

/**
 * A user deleted in Clerk (dashboard, or the in-app flow's final step) gets
 * the SAME full erasure the in-app flow runs: `deleteUserData` hands solely
 * owned workspaces to the next member, sweeps R2 uploads, removes the Resend
 * contact, erases private CMS content, deletes the Algolia record and then the
 * Prisma row (cascading the rest). Until 2026-09-16 this handler did a raw
 * `prisma.user.delete` plus the CMS erasure only (audit finding M3), so a
 * dashboard deletion left R2 orphans and a newsletter contact behind and
 * cascade-deleted every workspace the user solely owned.
 *
 * Idempotent and safe when the row is already gone (`deleteUserData` treats
 * P2025 as done), so it remains the backstop for the in-app flow. A thrown
 * error becomes a 500, which makes svix retry — erasure is re-runnable.
 */
async function handleUserDeleted(event: UserDeletedEvent) {
    const { id } = event.data

    try {
        const result = await deleteUserData(id)
        console.log(`✅ Erased user ${id}:`, result)
        return { action: 'deleted', userId: id }
    } catch (error) {
        console.error(`❌ Failed to erase user ${id}:`, error)
        throw error
    }
}

async function handleSessionCreated(event: SessionCreatedEvent) {
    const { user_id } = event.data

    try {
        console.log(`📥 Updating last login for user ${user_id}`)

        const existingUser = await prisma.user.findUnique({
            where: { id: user_id }
        })

        if (!existingUser) {
            console.log(`User ${user_id} doesn't exist, skipping login tracking`)
            return { action: 'skipped', reason: 'user_not_found' }
        }

        // Update last login timestamp
        await prisma.user.update({
            where: { id: user_id },
            data: {
                lastLoginAt: new Date()
            }
        })

        console.log(`✅ Updated last login for user: ${user_id}`)
        return { action: 'login_tracked', userId: user_id }

    } catch (error) {
        console.error(`❌ Failed to update last login for user ${user_id}:`, error)
        throw error
    }
}

export async function POST(req: Request) {
    try {
        // Read from the request itself rather than `headers()` from
        // next/headers: same values, and the handler is then a function of its
        // Request alone (testable without a Next request scope).
        const svixId = req.headers.get("svix-id")
        const svixTimestamp = req.headers.get("svix-timestamp")
        const svixSignature = req.headers.get("svix-signature")

        if (!svixId || !svixTimestamp || !svixSignature) {
            return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
        }

        const payload = await req.text()
        const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
        if (!webhookSecret) {
            console.error('CLERK_WEBHOOK_SECRET is not configured')
            return NextResponse.json(
                { error: 'Webhook secret not configured' },
                { status: 500 }
            )
        }
        const wh = new Webhook(webhookSecret)

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

        // Environment validation: Prevent cross-environment data pollution
        // This protects against dev/prod sharing the same database
        const isDevelopment = process.env.NODE_ENV === 'development'
        const isTestKey = process.env.CLERK_SECRET_KEY?.startsWith('sk_test_')

        if (isDevelopment !== isTestKey) {
            console.warn(`⚠️ Cross-environment webhook detected and blocked`)
            console.warn(`   NODE_ENV: ${process.env.NODE_ENV}`)
            console.warn(`   Clerk Key Type: ${isTestKey ? 'test' : 'live'}`)
            console.warn(`   Event Type: ${type}`)
            return NextResponse.json({
                success: true,
                action: 'ignored',
                reason: 'cross_environment_protection'
            })
        }

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
            case 'session.created':
                result = await handleSessionCreated(evt)
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
    } catch {
        return NextResponse.json({ status: 'unhealthy' }, { status: 503 })
    }
}
