"use client"

import { Avatar as BaseAvatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { getImageUrl, generateSrcSet, getAvatarFallback } from "@/lib/image-utils"
import { useState } from "react"

interface EnhancedAvatarProps {
    image?: string | null
    firstName?: string | null
    lastName?: string | null
    username?: string | null
    size?: 'sm' | 'md' | 'lg' | 'xl'
    className?: string
    priority?: boolean
}

const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24'
}

export function EnhancedAvatar({
                                   image,
                                   firstName,
                                   lastName,
                                   username,
                                   size = 'md',
                                   className,
                                   priority = false
                               }: EnhancedAvatarProps) {
    const [imageError, setImageError] = useState(false)

    const avatarUrl = getImageUrl(image, size === 'xl' ? 'avatarLarge' : 'avatar')
    const srcSet = generateSrcSet(image)
    const fallback = getAvatarFallback(firstName, lastName, username)

    return (
        <BaseAvatar className={cn(sizeClasses[size], className)}>
            {avatarUrl && !imageError ? (
                <AvatarImage
                    src={avatarUrl}
                    srcSet={srcSet}
                    alt={`${firstName || username || 'User'} avatar`}
                    onError={() => setImageError(true)}
                    loading={priority ? 'eager' : 'lazy'}
                />
            ) : null}
            <AvatarFallback>{fallback}</AvatarFallback>
        </BaseAvatar>
    )
}
