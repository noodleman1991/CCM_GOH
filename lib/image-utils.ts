export interface ImageUrls {
    avatar: string      // 200x200
    avatarLarge: string // 400x400
    original: string    // Original (max 1200x1200)
}

/**
 * Get the appropriate image URL based on the required size
 */
export function getImageUrl(
    baseUrl: string | null | undefined,
    size: 'avatar' | 'avatarLarge' | 'original' = 'avatar'
): string | null {
    if (!baseUrl) return null

    // If it's already a specific size URL, return as is
    if (baseUrl.includes('-avatar') || baseUrl.includes('-original')) {
        return baseUrl
    }

    // For R2 URLs, we can derive the other sizes
    if (baseUrl.includes('r2.dev') || baseUrl.includes('avatars/')) {
        const baseKey = baseUrl.replace('-avatar.webp', '').replace('-avatar-large.webp', '').replace('-original.jpg', '')

        switch (size) {
            case 'avatarLarge':
                return `${baseKey}-avatar-large.webp`
            case 'original':
                return `${baseKey}-original.jpg`
            default:
                return `${baseKey}-avatar.webp`
        }
    }

    // For other URLs, return the base URL
    return baseUrl
}

/**
 * Generate srcSet for responsive images
 */
export function generateSrcSet(baseUrl: string | null | undefined): string {
    if (!baseUrl) return ''

    const avatar = getImageUrl(baseUrl, 'avatar')
    const avatarLarge = getImageUrl(baseUrl, 'avatarLarge')

    if (!avatar || !avatarLarge) return ''

    return `${avatar} 1x, ${avatarLarge} 2x`
}

/**
 * Get placeholder/fallback avatar
 */
export function getAvatarFallback(
    firstName?: string | null,
    lastName?: string | null,
    username?: string | null
): string {
    const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()

    if (initials) return initials
    if (username) return username.slice(0, 2).toUpperCase()
    return '??'
}

/**
 * Validate image file before upload
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const MAX_SIZE = 5 * 1024 * 1024 // 5MB

    if (!ALLOWED_TYPES.includes(file.type)) {
        return {
            valid: false,
            error: 'Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.'
        }
    }

    if (file.size > MAX_SIZE) {
        return {
            valid: false,
            error: 'File too large. Maximum size is 5MB.'
        }
    }

    return { valid: true }
}

/**
 * Extract R2 key from URL
 */
export function extractR2Key(url: string, publicUrl: string): string | null {
    if (!url.includes(publicUrl)) return null
    return url.replace(`${publicUrl}/`, '')
}

/**
 * Get all variant keys from a base key
 */
export function getVariantKeys(baseKey: string): string[] {
    // Remove any existing suffix
    const cleanKey = baseKey
        .replace('-avatar.webp', '')
        .replace('-avatar-large.webp', '')
        .replace('-original.jpg', '')

    return [
        `${cleanKey}-avatar.webp`,
        `${cleanKey}-avatar-large.webp`,
        `${cleanKey}-original.jpg`
    ]
}
