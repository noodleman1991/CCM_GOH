/**
 * Generate optimized Clerk image URL with size and quality parameters
 */
export function getOptimizedClerkImageUrl(
    baseUrl: string | undefined,
    options: {
        width?: number
        height?: number
        fit?: 'scale-down' | 'crop'
        quality?: number
    } = {}
): string | undefined {
    if (!baseUrl) return undefined

    const {
        width = 200,
        height = 200,
        fit = 'crop',
        quality = 85
    } = options

    const params = new URLSearchParams()
    params.set('width', width.toString())
    params.set('height', height.toString())
    params.set('fit', fit)
    params.set('quality', quality.toString())

    return `${baseUrl}?${params.toString()}`
}

/**
 * Generate srcSet for responsive Clerk images
 */
export function generateClerkSrcSet(baseUrl: string | undefined): string {
    if (!baseUrl) return ''

    const avatar1x = getOptimizedClerkImageUrl(baseUrl, { width: 200, height: 200 })
    const avatar2x = getOptimizedClerkImageUrl(baseUrl, { width: 400, height: 400 })

    if (!avatar1x || !avatar2x) return ''

    return `${avatar1x} 1x, ${avatar2x} 2x`
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
 * Validate image file before upload - Clerk compatible
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
    const MAX_SIZE = 2 * 1024 * 1024 // 2MB - Clerk recommendation

    if (!ALLOWED_TYPES.includes(file.type)) {
        return {
            valid: false,
            error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.'
        }
    }

    if (file.size > MAX_SIZE) {
        return {
            valid: false,
            error: 'File too large. Maximum size is 2MB.'
        }
    }

    return { valid: true }
}
