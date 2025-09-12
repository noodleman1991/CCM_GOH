import { NextRequest, NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { r2Service, deleteAvatarByUrl } from "@/lib/cloudflare-r2"
import sharp from "sharp"

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB - Clerk recommended size
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

interface ImageUrls {
    avatar: string      // 200x200
    avatarLarge: string // 400x400
    original: string    // Original (max 1200x1200)
}

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 })
        }

        // Validate file
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: "Invalid file type. Allowed: JPEG, PNG, WebP" },
                { status: 400 }
            )
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: "File too large. Maximum size is 2MB" },
                { status: 400 }
            )
        }

        // Get current user
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { image: true }
        })

        if (!currentUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Process and upload images
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const urls: ImageUrls = { avatar: '', avatarLarge: '', original: '' }

        // Validate image dimensions for optimal 1:1 aspect ratio
        let imageMetadata
        try {
            imageMetadata = await sharp(buffer).metadata()
            console.log('Image metadata:', imageMetadata)
        } catch (metaError) {
            console.error('Failed to read image metadata:', metaError)
            return NextResponse.json(
                { error: "Invalid image file" },
                { status: 400 }
            )
        }

        try {
            // Process avatar (200x200)
            const avatarBuffer = await sharp(buffer)
                .resize(200, 200, { fit: 'cover', position: 'center' })
                .webp({ quality: 85 })
                .toBuffer()

            const avatarResult = await r2Service.uploadAvatar(
                avatarBuffer, userId, 'avatar.webp', 'image/webp'
            )
            if (!avatarResult.success) throw new Error('Avatar upload failed')
            urls.avatar = avatarResult.url!

            // Process large avatar (400x400)
            const avatarLargeBuffer = await sharp(buffer)
                .resize(400, 400, { fit: 'cover', position: 'center' })
                .webp({ quality: 85 })
                .toBuffer()

            const avatarLargeResult = await r2Service.uploadAvatar(
                avatarLargeBuffer, userId, 'avatar-large.webp', 'image/webp'
            )
            if (!avatarLargeResult.success) throw new Error('Large avatar upload failed')
            urls.avatarLarge = avatarLargeResult.url!

            // Upload original (resized max 1200x1200)
            const originalBuffer = await sharp(buffer)
                .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: 90 })
                .toBuffer()

            const originalResult = await r2Service.uploadAvatar(
                originalBuffer, userId, 'original.jpg', 'image/jpeg'
            )
            if (!originalResult.success) throw new Error('Original upload failed')
            urls.original = originalResult.url!

            // Update Prisma
            await prisma.user.update({
                where: { id: userId },
                data: { image: urls.avatar, updatedAt: new Date() }
            })

            // Enhanced sync to Clerk - update metadata with avatar URLs
            try {
                const clerkClientInstance = await clerkClient()
                await clerkClientInstance.users.updateUser(userId, {
                    publicMetadata: {
                        avatarUrl: urls.avatar,
                        avatarUrls: urls,
                        lastAvatarUpdate: new Date().toISOString(),
                    }
                })
                console.log(`Avatar synced to Clerk successfully for user ${userId}`)
            } catch (clerkError) {
                console.warn(`Failed to sync avatar to Clerk for user ${userId}:`, clerkError)
                // Don't fail the upload if Clerk sync fails - user still gets the avatar
            }

            // Clean up old avatar
            if (currentUser.image && currentUser.image !== urls.avatar) {
                deleteAvatarByUrl(currentUser.image).catch(() => {})
            }

            return NextResponse.json({
                success: true,
                url: urls.avatar,
                urls
            })

        } catch (uploadError) {
            // Cleanup on failure
            Object.values(urls).forEach(url => {
                if (url) deleteAvatarByUrl(url).catch(() => {})
            })
            throw uploadError
        }

    } catch (error) {
        console.error("Avatar upload failed:", error)
        return NextResponse.json({ error: "Failed to upload avatar" }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { image: true }
        })

        if (!user?.image) {
            return NextResponse.json({ error: "No avatar to delete" }, { status: 400 })
        }

        // Update Prisma
        await prisma.user.update({
            where: { id: userId },
            data: { image: null, updatedAt: new Date() }
        })

        // Enhanced sync to Clerk - remove avatar from metadata
        try {
            const clerkClientInstance = await clerkClient()
            await clerkClientInstance.users.updateUser(userId, {
                publicMetadata: {
                    avatarUrl: null,
                    avatarUrls: null,
                    lastAvatarUpdate: new Date().toISOString(),
                }
            })
            console.log(`Avatar removal synced to Clerk successfully for user ${userId}`)
        } catch (clerkError) {
            console.warn(`Failed to sync avatar removal to Clerk for user ${userId}:`, clerkError)
            // Don't fail the deletion if Clerk sync fails
        }

        // Delete from storage
        await deleteAvatarByUrl(user.image)

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error("Avatar deletion failed:", error)
        return NextResponse.json({ error: "Failed to delete avatar" }, { status: 500 })
    }
}
