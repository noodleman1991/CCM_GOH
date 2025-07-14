"use client"

import { useState, useRef } from "react"
import { useTranslations } from 'next-intl'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Camera, Upload, X } from "lucide-react"

interface ProfilePictureUploadProps {
    currentImage?: string | null
    firstName?: string | null
    lastName?: string | null
    onImageChangeAction: (imageUrl: string) => void
}

export default function ProfilePictureUpload({
                                                 currentImage,
                                                 firstName,
                                                 lastName,
                                                 onImageChangeAction
                                             }: ProfilePictureUploadProps) {
    const t = useTranslations('profile.edit.profilePicture')
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [preview, setPreview] = useState<string | null>(currentImage || null)

    const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error(t('invalidFileType'))
            return
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error(t('fileTooLarge'))
            return
        }

        // Create preview
        const reader = new FileReader()
        reader.onloadend = () => {
            setPreview(reader.result as string)
        }
        reader.readAsDataURL(file)

        // Upload to server
        setIsUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch('/api/profile/avatar', {
                method: 'POST',
                body: formData
            })

            if (!response.ok) {
                throw new Error('Upload failed')
            }

            const { url } = await response.json()
            onImageChangeAction(url)
            toast.success(t('uploadSuccess'))
        } catch (error) {
            console.error('Upload error:', error)
            toast.error(t('uploadError'))
            setPreview(currentImage || null)
        } finally {
            setIsUploading(false)
        }
    }

    const handleRemove = () => {
        setPreview(null)
        onImageChangeAction('')
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

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
                            <AvatarImage src={preview || undefined} alt="Profile" />
                            <AvatarFallback>{initials || '??'}</AvatarFallback>
                        </Avatar>
                        {preview && (
                            <Button
                                type="button"
                                size="icon"
                                variant="destructive"
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                onClick={handleRemove}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
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
                                    <Upload className="mr-2 h-4 w-4 animate-spin" />
                                    {t('uploading')}
                                </>
                            ) : (
                                <>
                                    <Camera className="mr-2 h-4 w-4" />
                                    {t('changePhoto')}
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
