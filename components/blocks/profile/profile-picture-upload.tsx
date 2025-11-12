"use client"

import { useState, useRef } from "react"
import { useTranslations } from 'next-intl'
import { useUser } from "@clerk/nextjs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Camera, X, Loader2 } from "lucide-react"
import { getOptimizedClerkImageUrl, validateImageFile } from "@/lib/image-utils"

interface ProfilePictureUploadProps {
    firstName?: string | null
    lastName?: string | null
    onImageChangeAction?: () => Promise<void>
}

export default function ProfilePictureUpload({
                                                 firstName,
                                                 lastName,
                                                 onImageChangeAction,
                                             }: ProfilePictureUploadProps) {
    const t = useTranslations('profilePicture')
    const { user } = useUser()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [isRemoving, setIsRemoving] = useState(false)

    const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U'

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !user) return

        // Validate file using utility function
        const validation = validateImageFile(file)
        if (!validation.valid) {
            toast.error(validation.error)
            return
        }

        setIsUploading(true)
        try {
            // Use Clerk's setProfileImage method directly
            await user.setProfileImage({ file })

            // Call optional callback to refresh data
            if (onImageChangeAction) {
                await onImageChangeAction()
            }

            toast.success(t('uploadSuccess'))
        } catch (error) {
            console.error('Upload error:', error)
            toast.error(t('errors.uploadError'))
        } finally {
            setIsUploading(false)
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const handleRemove = async () => {
        if (!user) return

        setIsRemoving(true)
        try {
            // Use Clerk's setProfileImage with null to remove image
            await user.setProfileImage({ file: null })

            // Call optional callback to refresh data
            if (onImageChangeAction) {
                await onImageChangeAction()
            }

            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }

            toast.success(t('removeSuccess'))
        } catch (error) {
            console.error('Remove error:', error)
            toast.error(t('errors.removeError'))
        } finally {
            setIsRemoving(false)
        }
    }

    // Generate optimized image URL using Clerk's image optimization
    const optimizedImageUrl = getOptimizedClerkImageUrl(user?.imageUrl, {
        width: 200,
        height: 200,
        fit: 'crop',
        quality: 85
    })
    const hasImage = user?.hasImage

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('title')}</CardTitle>
                <CardDescription>{t('description')}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-6">
                    <div className="relative">
                        <Avatar className="h-24 w-24">
                            <AvatarImage src={optimizedImageUrl} alt={t('altText')} />
                            <AvatarFallback className="text-lg">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        {hasImage && (
                            <Button
                                type="button"
                                size="icon"
                                variant="destructive"
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                onClick={handleRemove}
                                disabled={isRemoving}
                            >
                                {isRemoving ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                    <X className="h-3 w-3" />
                                )}
                            </Button>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={handleFileSelect}
                            className="hidden"
                            disabled={isUploading}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t('uploading')}
                                </>
                            ) : (
                                <>
                                    <Camera className="mr-2 h-4 w-4" />
                                    {hasImage ? t('changePhoto') : t('uploadPhoto')}
                                </>
                            )}
                        </Button>
                        <p className="text-xs text-muted-foreground">
                            {t('requirements')}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
