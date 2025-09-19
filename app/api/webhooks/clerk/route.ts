
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'

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
        public_metadata: Record<string, any>
        private_metadata: Record<string, any>
        unsafe_metadata: Record<string, any>
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
        public_metadata: Record<string, any>
        private_metadata: Record<string, any>
        unsafe_metadata: Record<string, any>
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

async function handleUserCreated(event: UserCreatedEvent): Promise<any> {
    const { id, email_addresses, phone_numbers, first_name, last_name, username, image_url, profile_image_url, public_metadata } = event.data

    try {
        console.log(`📥 Creating user ${id} from Clerk webhook`)

        const existingUser = await prisma.user.findUnique({
            where: { id }
        })

        if (existingUser) {
            console.log(`User ${id} already exists, updating instead`)
            return handleUserUpdated(event as any)
        }

        const phoneData = getPrimaryPhone(phone_numbers || [])
        const profileImage = getProfileImage(image_url, profile_image_url)

        // Create user with enhanced data from Clerk
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

                // App-specific data from Clerk metadata
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

                // Privacy settings from metadata (with defaults)
                isSearchable: public_metadata?.isSearchable ?? true,
                profileVisibility: public_metadata?.profileVisibility || 'PUBLIC',
                showEmail: public_metadata?.showEmail ?? false,
                showPhoneNumber: public_metadata?.showPhoneNumber ?? false,
                showWorkDetails: public_metadata?.showWorkDetails ?? true,
                showSocialLinks: public_metadata?.showSocialLinks ?? true,
                showLocation: public_metadata?.showLocation ?? true,
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
    const { id, email_addresses, phone_numbers, first_name, last_name, username, image_url, profile_image_url, public_metadata } = event.data

    try {
        console.log(`📥 Updating user ${id} from Clerk webhook`)

        const existingUser = await prisma.user.findUnique({
            where: { id }
        })

        if (!existingUser) {
            console.log(`User ${id} doesn't exist, creating...`)
            return handleUserCreated(event as any)
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

        // Only update app-specific data from Clerk metadata if it exists and was synced FROM our app
        const metadataUpdate: any = {}
        const syncedFromApp = public_metadata?.syncedFrom === 'prisma'

        if (syncedFromApp) {
            // These were synced from our app to Clerk, so we trust them
            if (public_metadata?.bio !== undefined) metadataUpdate.bio = public_metadata.bio
            if (public_metadata?.ageGroup !== undefined) metadataUpdate.ageGroup = public_metadata.ageGroup
            if (public_metadata?.country !== undefined) metadataUpdate.country = public_metadata.country
            if (public_metadata?.city !== undefined) metadataUpdate.city = public_metadata.city
            if (public_metadata?.workTypes !== undefined) metadataUpdate.workTypes = public_metadata.workTypes
            if (public_metadata?.expertiseAreas !== undefined) metadataUpdate.expertiseAreas = public_metadata.expertiseAreas
            if (public_metadata?.organization !== undefined) metadataUpdate.organization = public_metadata.organization
            if (public_metadata?.position !== undefined) metadataUpdate.position = public_metadata.position
            if (public_metadata?.workBio !== undefined) metadataUpdate.workBio = public_metadata.workBio
            if (public_metadata?.personalWebsite !== undefined) metadataUpdate.personalWebsite = public_metadata.personalWebsite
            if (public_metadata?.linkedinProfile !== undefined) metadataUpdate.linkedinProfile = public_metadata.linkedinProfile
            if (public_metadata?.twitterHandle !== undefined) metadataUpdate.twitterHandle = public_metadata.twitterHandle
            if (public_metadata?.isSearchable !== undefined) metadataUpdate.isSearchable = public_metadata.isSearchable
            if (public_metadata?.profileVisibility !== undefined) metadataUpdate.profileVisibility = public_metadata.profileVisibility
            if (public_metadata?.showEmail !== undefined) metadataUpdate.showEmail = public_metadata.showEmail
            if (public_metadata?.showPhoneNumber !== undefined) metadataUpdate.showPhoneNumber = public_metadata.showPhoneNumber
            if (public_metadata?.showWorkDetails !== undefined) metadataUpdate.showWorkDetails = public_metadata.showWorkDetails
            if (public_metadata?.showSocialLinks !== undefined) metadataUpdate.showSocialLinks = public_metadata.showSocialLinks
            if (public_metadata?.showLocation !== undefined) metadataUpdate.showLocation = public_metadata.showLocation

            // Handle onboarding completion status
            if (public_metadata?.onboardingComplete !== undefined) {
                metadataUpdate.onboardingCompleted = public_metadata.onboardingComplete
                metadataUpdate.welcomeMessageSeen = true
                metadataUpdate.onboardingStep = public_metadata.onboardingComplete ? 6 : 0
            }
        }

        // Update user with latest data from Clerk
        const user = await prisma.user.update({
            where: { id },
            data: {
                ...baseUpdateData,
                ...metadataUpdate
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
