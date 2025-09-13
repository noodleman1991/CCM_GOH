"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslations, useLocale } from 'next-intl'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useUserProfile } from "@/hooks/use-user-profile"
import type { UserProfileUpdateData, SupportedLocale } from "@/types/prisma"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Loader2, Shield, CheckCircle, XCircle, ExternalLink, RefreshCcw } from "lucide-react"

import ProfilePictureUpload from "@/components/blocks/profile/profile-picture-upload"

const profileSchema = z.object({
    // Clerk-managed fields (update Clerk directly)
    firstName: z.string().min(1, "First name is required").max(50),
    lastName: z.string().min(1, "Last name is required").max(50),
    username: z.string().min(3, "Username must be at least 3 characters").max(30)
        .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers and underscores"),
    
    // Profile image
    image: z.string().optional(),
    
    // App-managed profile fields
    bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
    ageGroup: z.enum(["UNDER_18", "ABOVE_18"]).optional(),
    country: z.string().optional(),
    city: z.string().optional(),
    workTypes: z.array(z.enum([
        "RESEARCH",
        "POLICY",
        "LIVED_EXPERIENCE_EXPERT",
        "NGO",
        "COMMUNITY_ORGANIZATION",
        "EDUCATION_TEACHING"
    ])),
    expertiseAreas: z.array(z.enum([
        "CLIMATE_CHANGE",
        "MENTAL_HEALTH",
        "HEALTH"
    ])),
    organization: z.string().optional(),
    position: z.string().optional(),
    workBio: z.string().max(1000, "Work bio must be less than 1000 characters").optional(),
    personalWebsite: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
    linkedinProfile: z.string().optional(),
    twitterHandle: z.string().optional(),
    
    // Privacy Controls
    isSearchable: z.boolean().default(true),
    profileVisibility: z.enum(["PUBLIC", "MEMBERS", "PRIVATE"]).default("PUBLIC"),
    showEmail: z.boolean().default(false),
    showPhoneNumber: z.boolean().default(false),
    showWorkDetails: z.boolean().default(true),
    showSocialLinks: z.boolean().default(true),
    showLocation: z.boolean().default(true)
}).transform((data) => {
    // Transform null values to undefined
    return Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, value === null ? undefined : value])
    ) as any
})

type ProfileFormValues = z.infer<typeof profileSchema>

interface ProfileEditFormProps {
    initialData?: Partial<ProfileFormValues> & {
        // Read-only Clerk data for display
        email?: string | null
        phoneNumber?: string | null
        phoneVerified?: Date | null
        emailVerified?: Date | null
    }
    onSubmitAction?: (data: ProfileFormValues) => Promise<void>
}

export default function ProfileEditForm(props: ProfileEditFormProps = {}) {
    const { initialData, onSubmitAction } = props
    const t = useTranslations('profile.edit')
    const locale = useLocale() as SupportedLocale
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSyncing, setIsSyncing] = useState(false)
    
    // Use the new TypeScript hook with i18n support
    const { user, loading, error, updating, updateProfile, refreshProfile, isRTL } = useUserProfile()

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            firstName: user?.firstName || initialData?.firstName || "",
            lastName: user?.lastName || initialData?.lastName || "",
            username: user?.username || initialData?.username || "",
            image: user?.image || initialData?.image || "",
            bio: user?.bio || initialData?.bio || "",
            ageGroup: user?.ageGroup || initialData?.ageGroup,
            country: user?.country || initialData?.country || "",
            city: user?.city || initialData?.city || "",
            workTypes: user?.workTypes || initialData?.workTypes || [],
            expertiseAreas: user?.expertiseAreas || initialData?.expertiseAreas || [],
            organization: user?.organization || initialData?.organization || "",
            position: user?.position || initialData?.position || "",
            workBio: user?.workBio || initialData?.workBio || "",
            personalWebsite: user?.personalWebsite || initialData?.personalWebsite || "",
            linkedinProfile: user?.linkedinProfile || initialData?.linkedinProfile || "",
            twitterHandle: user?.twitterHandle || initialData?.twitterHandle || "",
            // Privacy Controls
            isSearchable: user?.isSearchable ?? initialData?.isSearchable ?? true,
            profileVisibility: user?.profileVisibility || initialData?.profileVisibility || "PUBLIC",
            showEmail: user?.showEmail ?? initialData?.showEmail ?? false,
            showPhoneNumber: user?.showPhoneNumber ?? initialData?.showPhoneNumber ?? false,
            showWorkDetails: user?.showWorkDetails ?? initialData?.showWorkDetails ?? true,
            showSocialLinks: user?.showSocialLinks ?? initialData?.showSocialLinks ?? true,
            showLocation: user?.showLocation ?? initialData?.showLocation ?? true
        }
    })

    // Update form when user data changes
    useEffect(() => {
        if (user && !loading) {
            form.reset({
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                username: user.username || "",
                image: user.image || "",
                bio: user.bio || "",
                ageGroup: user.ageGroup,
                country: user.country || "",
                city: user.city || "",
                workTypes: user.workTypes || [],
                expertiseAreas: user.expertiseAreas || [],
                organization: user.organization || "",
                position: user.position || "",
                workBio: user.workBio || "",
                personalWebsite: user.personalWebsite || "",
                linkedinProfile: user.linkedinProfile || "",
                twitterHandle: user.twitterHandle || "",
                isSearchable: user.isSearchable ?? true,
                profileVisibility: user.profileVisibility || "PUBLIC",
                showEmail: user.showEmail ?? false,
                showPhoneNumber: user.showPhoneNumber ?? false,
                showWorkDetails: user.showWorkDetails ?? true,
                showSocialLinks: user.showSocialLinks ?? true,
                showLocation: user.showLocation ?? true
            })
        }
    }, [user, loading, form])

    const workTypeOptions = [
        { value: "RESEARCH", label: t('workTypes.research') },
        { value: "POLICY", label: t('workTypes.policy') },
        { value: "LIVED_EXPERIENCE_EXPERT", label: t('workTypes.livedExperience') },
        { value: "NGO", label: t('workTypes.ngo') },
        { value: "COMMUNITY_ORGANIZATION", label: t('workTypes.communityOrg') },
        { value: "EDUCATION_TEACHING", label: t('workTypes.education') }
    ]

    const expertiseOptions = [
        { value: "CLIMATE_CHANGE", label: t('expertise.climate') },
        { value: "MENTAL_HEALTH", label: t('expertise.mentalHealth') },
        { value: "HEALTH", label: t('expertise.health') }
    ]

    async function handleSubmit(values: ProfileFormValues) {
        setIsSubmitting(true)
        try {
            // Use custom onSubmitAction if provided, otherwise use our TypeScript service
            if (onSubmitAction) {
                await onSubmitAction(values)
            } else {
                // Convert form values to our TypeScript type, handling empty strings properly
                const updateData: UserProfileUpdateData = {
                    firstName: values.firstName,
                    lastName: values.lastName,
                    username: values.username,
                    bio: values.bio?.trim() || null,
                    ageGroup: values.ageGroup || null,
                    country: values.country?.trim() || null,
                    city: values.city?.trim() || null,
                    workTypes: values.workTypes || [],
                    expertiseAreas: values.expertiseAreas || [],
                    organization: values.organization?.trim() || null,
                    position: values.position?.trim() || null,
                    workBio: values.workBio?.trim() || null,
                    personalWebsite: values.personalWebsite?.trim() || null,
                    linkedinProfile: values.linkedinProfile?.trim() || null,
                    twitterHandle: values.twitterHandle?.trim() || null,
                    isSearchable: values.isSearchable,
                    profileVisibility: values.profileVisibility,
                    showEmail: values.showEmail,
                    showPhoneNumber: values.showPhoneNumber,
                    showWorkDetails: values.showWorkDetails,
                    showSocialLinks: values.showSocialLinks,
                    showLocation: values.showLocation,
                }

                const success = await updateProfile(updateData)
                if (!success) {
                    throw new Error('Profile update failed')
                }
            }
            
            toast.success(t('saveSuccess'))
            router.push(`/profile/${values.username}`)
        } catch (error) {
            console.error('Profile submission error:', error)
            toast.error(error instanceof Error ? error.message : t('saveError'))
        } finally {
            setIsSubmitting(false)
        }
    }

    // Manual sync function
    async function handleSync() {
        setIsSyncing(true)
        try {
            const response = await fetch('/api/sync/clerk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ direction: 'bidirectional' })
            })

            if (!response.ok) {
                throw new Error('Sync failed')
            }

            const result = await response.json()
            toast.success('Profile synced successfully')
            
            // Refresh the profile data
            await refreshProfile()
        } catch (error) {
            console.error('Sync error:', error)
            toast.error('Failed to sync profile')
        } finally {
            setIsSyncing(false)
        }
    }

    // Show loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    // Show error state
    if (error) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="text-center">
                    <XCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">{error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className={`${isRTL ? 'rtl' : 'ltr'} ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                {/* Profile Picture */}
                <ProfilePictureUpload
                    firstName={form.watch("firstName")}
                    lastName={form.watch("lastName")}
                />

                {/* Clerk-managed Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ExternalLink className="h-4 w-4" />
                            {t('clerkInfo.title')}
                        </CardTitle>
                        <CardDescription>
                            {t('clerkInfo.description')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Sync Button */}
                        <div className="flex justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleSync}
                                disabled={isSyncing}
                            >
                                {isSyncing && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                <RefreshCcw className="mr-2 h-3 w-3" />
                                Sync Data
                            </Button>
                        </div>
                        {/* Email Display */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('email')}</label>
                            <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                                <span className="text-sm">{user?.email || initialData?.email || t('noEmail')}</span>
                                {(user?.emailVerified || initialData?.emailVerified) && (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                )}
                                {(user?.email || initialData?.email) && !(user?.emailVerified || initialData?.emailVerified) && (
                                    <XCircle className="h-4 w-4 text-yellow-500" />
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {t('clerkInfo.emailNote')}
                            </p>
                        </div>

                        {/* Phone Display */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('phoneNumber')}</label>
                            <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                                <span className="text-sm">{user?.phoneNumber || initialData?.phoneNumber || t('noPhone')}</span>
                                {(user?.phoneVerified || initialData?.phoneVerified) && (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                )}
                                {(user?.phoneNumber || initialData?.phoneNumber) && !(user?.phoneVerified || initialData?.phoneVerified) && (
                                    <XCircle className="h-4 w-4 text-yellow-500" />
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {t('clerkInfo.phoneNote')}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Basic Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('basicInfo.title')}</CardTitle>
                        <CardDescription>{t('basicInfo.description')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('firstName')}</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="lastName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('lastName')}</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('username')}</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormDescription>{t('usernameHint')}</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="bio"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('bio')}</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} rows={4} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="ageGroup"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('ageGroup')}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('selectAge')} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="UNDER_18">{t('under18')}</SelectItem>
                                            <SelectItem value="ABOVE_18">{t('above18')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="country"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('country')}</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="city"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('city')}</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Work Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('workInfo.title')}</CardTitle>
                        <CardDescription>{t('workInfo.description')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="workTypes"
                            render={() => (
                                <FormItem>
                                    <div className="mb-4">
                                        <FormLabel>{t('workTypes.label')}</FormLabel>
                                        <FormDescription>{t('workTypes.description')}</FormDescription>
                                    </div>
                                    <div className="space-y-2">
                                        {workTypeOptions.map((option) => (
                                            <FormField
                                                key={option.value}
                                                control={form.control}
                                                name="workTypes"
                                                render={({ field }) => {
                                                    return (
                                                        <FormItem
                                                            key={option.value}
                                                            className="flex flex-row items-start space-x-3 space-y-0"
                                                        >
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value?.includes(option.value as any)}
                                                                    onCheckedChange={(checked) => {
                                                                        return checked
                                                                            ? field.onChange([...field.value, option.value])
                                                                            : field.onChange(
                                                                                field.value?.filter(
                                                                                    (value: any) => value !== option.value
                                                                                ) //todo: any
                                                                            )
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="font-normal">
                                                                {option.label}
                                                            </FormLabel>
                                                        </FormItem>
                                                    )
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="expertiseAreas"
                            render={() => (
                                <FormItem>
                                    <div className="mb-4">
                                        <FormLabel>{t('expertise.label')}</FormLabel>
                                        <FormDescription>{t('expertise.description')}</FormDescription>
                                    </div>
                                    <div className="space-y-2">
                                        {expertiseOptions.map((option) => (
                                            <FormField
                                                key={option.value}
                                                control={form.control}
                                                name="expertiseAreas"
                                                render={({ field }) => {
                                                    return (
                                                        <FormItem
                                                            key={option.value}
                                                            className="flex flex-row items-start space-x-3 space-y-0"
                                                        >
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value?.includes(option.value as any)}
                                                                    onCheckedChange={(checked) => {
                                                                        return checked
                                                                            ? field.onChange([...field.value, option.value])
                                                                            : field.onChange(
                                                                                field.value?.filter(
                                                                                    (value: any) => value !== option.value
                                                                                ) //todo: any
                                                                            )
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="font-normal">
                                                                {option.label}
                                                            </FormLabel>
                                                        </FormItem>
                                                    )
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="organization"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('organization')}</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="position"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('position')}</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="workBio"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('workBio')}</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} rows={4} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Social Links */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('social.title')}</CardTitle>
                        <CardDescription>{t('social.description')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="personalWebsite"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('personalWebsite')}</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="url" placeholder="https://example.com" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="linkedinProfile"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('linkedin')}</FormLabel>
                                    <FormControl>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground">linkedin.com/in/</span>
                                            <Input {...field} placeholder="your-profile" />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="twitterHandle"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('twitter')}</FormLabel>
                                    <FormControl>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground">twitter.com/</span>
                                            <Input {...field} placeholder="yourhandle" />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Privacy Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            {t('privacy.title')}
                        </CardTitle>
                        <CardDescription>{t('privacy.description')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Search Visibility */}
                        <FormField
                            control={form.control}
                            name="isSearchable"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">
                                            {t('privacy.searchable.title')}
                                        </FormLabel>
                                        <FormDescription>
                                            {t('privacy.searchable.description')}
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        {/* Profile Visibility */}
                        <FormField
                            control={form.control}
                            name="profileVisibility"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('privacy.visibility.title')}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="PUBLIC">{t('privacy.visibility.public')}</SelectItem>
                                            <SelectItem value="MEMBERS">{t('privacy.visibility.members')}</SelectItem>
                                            <SelectItem value="PRIVATE">{t('privacy.visibility.private')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        {t('privacy.visibility.description')}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Granular Privacy Controls */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium">{t('privacy.showInProfile')}</h4>
                            
                            <FormField
                                control={form.control}
                                name="showEmail"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between">
                                        <div className="space-y-0.5">
                                            <FormLabel>{t('privacy.showEmail.title')}</FormLabel>
                                            <FormDescription className="text-xs">
                                                {t('privacy.showEmail.description')}
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="showPhoneNumber"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between">
                                        <div className="space-y-0.5">
                                            <FormLabel>{t('privacy.showPhone.title')}</FormLabel>
                                            <FormDescription className="text-xs">
                                                {t('privacy.showPhone.description')}
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="showWorkDetails"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between">
                                        <div className="space-y-0.5">
                                            <FormLabel>{t('privacy.showWork.title')}</FormLabel>
                                            <FormDescription className="text-xs">
                                                {t('privacy.showWork.description')}
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="showSocialLinks"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between">
                                        <div className="space-y-0.5">
                                            <FormLabel>{t('privacy.showSocial.title')}</FormLabel>
                                            <FormDescription className="text-xs">
                                                {t('privacy.showSocial.description')}
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="showLocation"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between">
                                        <div className="space-y-0.5">
                                            <FormLabel>{t('privacy.showLocation.title')}</FormLabel>
                                            <FormDescription className="text-xs">
                                                {t('privacy.showLocation.description')}
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className={`flex gap-4 ${isRTL ? 'justify-start' : 'justify-end'}`}>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={isSubmitting || updating}
                    >
                        {t('cancel')}
                    </Button>
                    <Button type="submit" disabled={isSubmitting || updating}>
                        {(isSubmitting || updating) && <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />}
                        {t('save')}
                    </Button>
                </div>
                </form>
            </Form>
        </div>
    )
}
