import { NextRequest, NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { r2Service, uploadAvatarFile, deleteAvatarByUrl } from "@/lib/cloudflare-r2" //todo: uploadAvatarFile unused
import sharp from "sharp"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

interface ImageUrls {
    avatar: string      // 200x200
    avatarLarge: string // 400x400
    original: string    // Original (max 1200x1200)
}

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            )
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: "Invalid file type. Allowed types: JPEG, PNG, WebP, GIF" },
                { status: 400 }
            )
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: "File too large. Maximum size is 5MB" },
                { status: 400 }
            )
        }

        // Get current user to check for existing avatar
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { image: true }
        })

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Process and upload images
        const urls: ImageUrls = {
            avatar: '',
            avatarLarge: '',
            original: ''
        }

        // Process avatar (200x200)
        const avatarBuffer = await sharp(buffer)
            .resize(200, 200, {
                fit: 'cover',
                position: 'center'
            })
            .webp({ quality: 85 })
            .toBuffer()

        const avatarResult = await r2Service.uploadAvatar(
            avatarBuffer,
            userId,
            'avatar.webp',
            'image/webp'
        )

        if (!avatarResult.success) {
            throw new Error(avatarResult.error || 'Avatar upload failed')
        }
        urls.avatar = avatarResult.url!

        // Process large avatar (400x400)
        const avatarLargeBuffer = await sharp(buffer)
            .resize(400, 400, {
                fit: 'cover',
                position: 'center'
            })
            .webp({ quality: 85 })
            .toBuffer()

        const avatarLargeResult = await r2Service.uploadAvatar(
            avatarLargeBuffer,
            userId,
            'avatar-large.webp',
            'image/webp'
        )

        if (!avatarLargeResult.success) {
            throw new Error(avatarLargeResult.error || 'Large avatar upload failed')
        }
        urls.avatarLarge = avatarLargeResult.url!

        // Upload original (with size limit)
        const originalBuffer = await sharp(buffer)
            .resize(1200, 1200, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 90 })
            .toBuffer()

        const originalResult = await r2Service.uploadAvatar(
            originalBuffer,
            userId,
            'original.jpg',
            'image/jpeg'
        )

        if (!originalResult.success) {
            throw new Error(originalResult.error || 'Original upload failed')
        }
        urls.original = originalResult.url!

        // Update user's image in database
        await prisma.user.update({
            where: { id: userId },
            data: {
                image: urls.avatar,
            }
        })

        // Update Clerk user metadata
        const clerkClientInstance = await clerkClient()
        await clerkClientInstance.users.updateUser(userId, {
            publicMetadata: {
                avatarUrl: urls.avatar,
                avatarUrls: urls
            }
        })

        // Clean up old avatar if exists
        if (currentUser?.image) {
            deleteAvatarByUrl(currentUser.image).catch(console.error)
        }

        return NextResponse.json({
            success: true,
            url: urls.avatar,
            urls
        })
    } catch (error) {
        console.error("Failed to upload avatar:", error)
        return NextResponse.json(
            { error: "Failed to upload avatar" },
            { status: 500 }
        )
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        // Get current user
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { image: true }
        })

        if (!user?.image) {
            return NextResponse.json(
                { error: "No avatar to delete" },
                { status: 400 }
            )
        }

        // Remove from database
        await prisma.user.update({
            where: { id: userId },
            data: { image: null }
        })

        // Remove from Clerk
        const clerkClientInstance = await clerkClient()
        await clerkClientInstance.users.updateUser(userId, {
            publicMetadata: {
                avatarUrl: null,
                avatarUrls: null
            }
        })

        // Delete from R2
        await deleteAvatarByUrl(user.image)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Failed to delete avatar:", error)
        return NextResponse.json(
            { error: "Failed to delete avatar" },
            { status: 500 }
        )
    }
}
