import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import sharp from "sharp"
import { v4 as uuidv4 } from "uuid"

// Initialize R2 client
const r2Client = new S3Client({
    region: "auto",
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT!,
    credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
    },
})

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME!
const PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL!
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const IMAGE_SIZES = {
    avatar: { width: 200, height: 200 },
    avatarLarge: { width: 400, height: 400 }
}

async function deleteFromR2(key: string) {
    try {
        await r2Client.send(
            new DeleteObjectCommand({
                Bucket: BUCKET_NAME,
                Key: key,
            })
        )
    } catch (error) {
        console.error("Failed to delete from R2:", error)
    }
}

async function uploadToR2(
    buffer: Buffer,
    key: string,
    contentType: string
): Promise<string> {
    await r2Client.send(
        new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: contentType,
            CacheControl: "public, max-age=31536000", // 1 year cache
        })
    )

    return `${PUBLIC_URL}/${key}`
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

        // Generate unique filename
        const fileExtension = file.name.split('.').pop()
        const baseKey = `avatars/${userId}/${uuidv4()}`

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Process and upload images
        const uploadPromises = []
        const urls: Record<string, string> = {}

        // Process avatar (200x200)
        const avatarBuffer = await sharp(buffer)
            .resize(IMAGE_SIZES.avatar.width, IMAGE_SIZES.avatar.height, {
                fit: 'cover',
                position: 'center'
            })
            .webp({ quality: 85 })
            .toBuffer()

        const avatarKey = `${baseKey}-avatar.webp`
        uploadPromises.push(
            uploadToR2(avatarBuffer, avatarKey, 'image/webp').then(url => {
                urls.avatar = url
            })
        )

        // Process large avatar (400x400)
        const avatarLargeBuffer = await sharp(buffer)
            .resize(IMAGE_SIZES.avatarLarge.width, IMAGE_SIZES.avatarLarge.height, {
                fit: 'cover',
                position: 'center'
            })
            .webp({ quality: 85 })
            .toBuffer()

        const avatarLargeKey = `${baseKey}-avatar-large.webp`
        uploadPromises.push(
            uploadToR2(avatarLargeBuffer, avatarLargeKey, 'image/webp').then(url => {
                urls.avatarLarge = url
            })
        )

        // Upload original (with size limit)
        const originalBuffer = await sharp(buffer)
            .resize(1200, 1200, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 90 })
            .toBuffer()

        const originalKey = `${baseKey}-original.jpg`
        uploadPromises.push(
            uploadToR2(originalBuffer, originalKey, 'image/jpeg').then(url => {
                urls.original = url
            })
        )

        // Wait for all uploads to complete
        await Promise.all(uploadPromises)

        // Update user's image in database
        await prisma.user.update({
            where: { id: userId },
            data: {
                image: urls.avatar,
                // You might want to store all URLs in a JSON field
                // imageUrls: urls
            }
        })

        // Clean up old avatar if exists
        if (currentUser?.image && currentUser.image.includes(PUBLIC_URL)) {
            // Extract key from URL and delete old files
            const oldKey = currentUser.image.replace(`${PUBLIC_URL}/`, '')
            const baseOldKey = oldKey.replace('-avatar.webp', '')

            // Delete all old avatar variations
            Promise.all([
                deleteFromR2(`${baseOldKey}-avatar.webp`),
                deleteFromR2(`${baseOldKey}-avatar-large.webp`),
                deleteFromR2(`${baseOldKey}-original.jpg`)
            ]).catch(console.error)
        }

        return NextResponse.json({
            url: urls.avatar,
            urls // Return all URLs for potential future use
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

        // Remove user's image from database
        await prisma.user.update({
            where: { id: userId },
            data: { image: null }
        })

        // Delete from R2 if it's our URL
        if (user.image.includes(PUBLIC_URL)) {
            const key = user.image.replace(`${PUBLIC_URL}/`, '')
            const baseKey = key.replace('-avatar.webp', '')

            // Delete all avatar variations
            await Promise.all([
                deleteFromR2(`${baseKey}-avatar.webp`),
                deleteFromR2(`${baseKey}-avatar-large.webp`),
                deleteFromR2(`${baseKey}-original.jpg`)
            ])
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Failed to delete avatar:", error)
        return NextResponse.json(
            { error: "Failed to delete avatar" },
            { status: 500 }
        )
    }
}
