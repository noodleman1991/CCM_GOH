"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslations, useLocale } from 'next-intl'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import { format } from "date-fns"
import * as z from "zod"
import { useUserProfile } from "@/hooks/use-user-profile"
import type { UserProfileUpdateData, SupportedLocale } from "@/types/prisma"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Loader2, Shield, CheckCircle, XCircle, ExternalLink, Plus, Edit, Trash2, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

import ProfilePictureUpload from "@/components/blocks/profile/profile-picture-upload"
import { CommunitySelector } from "@/components/profile/community-selector"

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
    ])).min(1, "Please select at least one work type"),
    expertiseAreas: z.array(z.enum([
        "CLIMATE_CHANGE",
        "MENTAL_HEALTH",
        "HEALTH",
        "EDUCATION",
        "SOCIAL_JUSTICE"
    ])).min(1, "Please select at least one expertise area"),
    organization: z.string().optional(),
    position: z.string().optional(),
    workBio: z.string().max(1000, "Work bio must be less than 1000 characters").optional(),
    personalWebsite: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
    linkedinProfile: z.string().optional(),
    otherSocialLinks: z.array(z.object({
        platform: z.string().min(1),
        url: z.string().url()
    })).optional(),

    // Recent Work
    recentWork: z.array(z.object({
        title: z.string().min(1, "Title is required").max(100),
        description: z.string().min(1, "Description is required").max(500),
        link: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
        startDate: z.string().min(1, "Start date is required"),
        endDate: z.string().optional(),
        isOngoing: z.boolean().optional()
    })).optional().default([]),

    // Community memberships
    communityIds: z.array(z.string()).optional().default([]),

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
    const tCommunities = useTranslations('profile.communities')
    const tRecentWork = useTranslations('profile.recentWork')
    const locale = useLocale() as SupportedLocale
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [communities, setCommunities] = useState<any[]>([])
    const [editingWorkIndex, setEditingWorkIndex] = useState<number | null>(null)
    const [workFormData, setWorkFormData] = useState({
        title: "",
        description: "",
        link: "",
        isOngoing: false,
        startDate: "",
        endDate: ""
    })

    // Use the new TypeScript hook with i18n support
    const { user, communities: availableCommunities, recentWork: existingRecentWork, loading, error, updating, updateProfile, refreshProfile, isRTL } = useUserProfile()

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        mode: 'onChange',
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
            otherSocialLinks: user?.otherSocialLinks || initialData?.otherSocialLinks || [],
            recentWork: [], // Will be populated by API fetch
            communityIds: [], // Will be populated by API fetch
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

    // useFieldArray for recent work
    const { fields: workFields, append: appendWork, update: updateWork, remove: removeWork } = useFieldArray({
        control: form.control,
        name: "recentWork"
    })

    // Update form when user data changes
    useEffect(() => {
        if (user && !loading && availableCommunities.length > 0) {
            // Map community memberships to IDs
            // Type assertion: transformToLocalizedUser includes relations via spread
            const userWithRelations = user as any
            const communityIds = userWithRelations.communityMemberships?.map((m: any) => m.communityId) || []

            // Map recent work to form format
            const recentWorkFormatted = existingRecentWork.map((work: any) => ({
                title: work.title,
                description: work.description || "",
                link: work.link || "",
                startDate: work.startDate ? new Date(work.startDate).toISOString().split('T')[0] : "",
                endDate: work.endDate ? new Date(work.endDate).toISOString().split('T')[0] : "",
                isOngoing: work.isOngoing || false
            }))

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
                otherSocialLinks: user.otherSocialLinks || [],
                // Use data from hook
                recentWork: recentWorkFormatted,
                communityIds: communityIds,
                isSearchable: user.isSearchable ?? true,
                profileVisibility: user.profileVisibility || "PUBLIC",
                showEmail: user.showEmail ?? false,
                showPhoneNumber: user.showPhoneNumber ?? false,
                showWorkDetails: user.showWorkDetails ?? true,
                showSocialLinks: user.showSocialLinks ?? true,
                showLocation: user.showLocation ?? true
            })
        }
    }, [user, loading, availableCommunities, existingRecentWork, form])

    // Set available communities for the selector
    useEffect(() => {
        if (availableCommunities.length > 0) {
            setCommunities(availableCommunities)
        }
    }, [availableCommunities])

    // Handler for community selection changes - now just updates form state
    const handleCommunityChange = (communityIds: string[]) => {
        form.setValue('communityIds', communityIds, { shouldDirty: true })
    }

    // Recent work form handlers
    const resetWorkForm = () => {
        setWorkFormData({
            title: "",
            description: "",
            link: "",
            isOngoing: false,
            startDate: "",
            endDate: ""
        })
        setEditingWorkIndex(null)
    }

    const handleEditWork = (index: number) => {
        const item = workFields[index] as any
        setWorkFormData({
            title: item.title,
            description: item.description,
            link: item.link || "",
            isOngoing: item.isOngoing,
            startDate: item.startDate,
            endDate: item.endDate || ""
        })
        setEditingWorkIndex(index)
    }

    const handleSaveWork = () => {
        if (!workFormData.title || !workFormData.description || !workFormData.startDate) {
            return
        }

        const workItem = {
            title: workFormData.title,
            description: workFormData.description,
            link: workFormData.link,
            isOngoing: workFormData.isOngoing,
            startDate: workFormData.startDate,
            endDate: workFormData.isOngoing ? "" : workFormData.endDate
        }

        if (editingWorkIndex !== null) {
            updateWork(editingWorkIndex, workItem)
        } else {
            appendWork(workItem)
        }

        resetWorkForm()
    }

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), "MMM yyyy")
        } catch {
            return dateString
        }
    }

    const isWorkFormValid = workFormData.title && workFormData.description && workFormData.startDate &&
        (workFormData.isOngoing || workFormData.endDate)

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
        { value: "HEALTH", label: t('expertise.health') },
        { value: "EDUCATION", label: t('expertise.education') },
        { value: "SOCIAL_JUSTICE", label: t('expertise.socialJustice') }
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
                    otherSocialLinks: values.otherSocialLinks || [],
                    isSearchable: values.isSearchable,
                    profileVisibility: values.profileVisibility,
                    showEmail: values.showEmail,
                    showPhoneNumber: values.showPhoneNumber,
                    showWorkDetails: values.showWorkDetails,
                    showSocialLinks: values.showSocialLinks,
                    showLocation: values.showLocation,
                    communityIds: values.communityIds || [],
                    recentWork: values.recentWork || [],
                }

                const success = await updateProfile(updateData)
                if (!success) {
                    throw new Error('Profile update failed')
                }
            }
            
            toast.success(t('saveSuccess'))
            router.push(`/${locale}/profiles/${values.username}`)
        } catch (error) {
            console.error('Profile submission error:', error)
            toast.error(error instanceof Error ? error.message : t('saveError'))
        } finally {
            setIsSubmitting(false)
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
                                    <Select onValueChange={field.onChange} value={field.value || ""}>
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

                {/* Regional Communities */}
                <Card>
                    <CardHeader>
                        <CardTitle>{tCommunities('title') || 'Regional Communities'}</CardTitle>
                        <CardDescription>
                            {tCommunities('description') || 'Select the regional communities you want to join'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <CommunitySelector
                            selectedCommunities={form.watch('communityIds') || []}
                            availableCommunities={communities}
                            onChangeAction={handleCommunityChange}
                            showCard={false}
                            isRTL={isRTL}
                        />
                    </CardContent>
                </Card>

                {/* Recent Work */}
                <Card>
                    <CardHeader>
                        <CardTitle>{tRecentWork('title')}</CardTitle>
                        <CardDescription>{tRecentWork('description')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Existing Work Items */}
                        {workFields.length > 0 && (
                            <div className="space-y-4">
                                {workFields.map((item: any, index: number) => (
                                    <Card key={item.id}>
                                        <CardHeader className="pb-3">
                                            <div className={cn("flex items-start justify-between", isRTL && "flex-row-reverse")}>
                                                <div className="space-y-1">
                                                    <CardTitle className="text-lg">{item.title}</CardTitle>
                                                    <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", isRTL && "flex-row-reverse")}>
                                                        <Calendar className="h-4 w-4" />
                                                        <span>
                                                            {formatDate(item.startDate)} - {item.isOngoing ? tRecentWork('ongoing') : formatDate(item.endDate || "")}
                                                        </span>
                                                        {item.isOngoing && (
                                                            <Badge variant="secondary">{tRecentWork('ongoing')}</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className={cn("flex gap-2", isRTL && "flex-row-reverse")}>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleEditWork(index)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => removeWork(index)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-gray-700 mb-3">{item.description}</p>
                                            {item.link && (
                                                <a
                                                    href={item.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={cn("inline-flex items-center gap-1 text-primary hover:underline", isRTL && "flex-row-reverse")}
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                    {tRecentWork('viewProject')}
                                                </a>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {/* Add/Edit Form */}
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    {editingWorkIndex !== null ? tRecentWork('editWork') : tRecentWork('addWork')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div>
                                        <label htmlFor="work-title" className="text-sm font-medium flex items-center gap-1">
                                            {tRecentWork('workTitle')}
                                            <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            id="work-title"
                                            value={workFormData.title}
                                            onChange={(e) => setWorkFormData({ ...workFormData, title: e.target.value })}
                                            placeholder={tRecentWork('workTitlePlaceholder')}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="work-link" className="text-sm font-medium">{tRecentWork('projectLink')}</label>
                                        <Input
                                            id="work-link"
                                            value={workFormData.link}
                                            onChange={(e) => setWorkFormData({ ...workFormData, link: e.target.value })}
                                            placeholder="https://..."
                                            type="url"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="work-description" className="text-sm font-medium flex items-center gap-1">
                                        {tRecentWork('workDescription')}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <Textarea
                                        id="work-description"
                                        value={workFormData.description}
                                        onChange={(e) => setWorkFormData({ ...workFormData, description: e.target.value })}
                                        placeholder={tRecentWork('descriptionPlaceholder')}
                                        rows={3}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div>
                                        <label htmlFor="work-start-date" className="text-sm font-medium flex items-center gap-1">
                                            {tRecentWork('startDate')}
                                            <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            id="work-start-date"
                                            type="date"
                                            value={workFormData.startDate}
                                            onChange={(e) => setWorkFormData({ ...workFormData, startDate: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="work-end-date" className="text-sm font-medium">
                                            {tRecentWork('endDate')}
                                            {!workFormData.isOngoing && <span className="text-red-500 ml-1">*</span>}
                                        </label>
                                        <Input
                                            id="work-end-date"
                                            type="date"
                                            value={workFormData.endDate}
                                            onChange={(e) => setWorkFormData({ ...workFormData, endDate: e.target.value })}
                                            disabled={workFormData.isOngoing}
                                        />
                                    </div>
                                </div>

                                <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                                    <Checkbox
                                        id="ongoing"
                                        checked={workFormData.isOngoing}
                                        onCheckedChange={(checked) => setWorkFormData({
                                            ...workFormData,
                                            isOngoing: !!checked,
                                            endDate: checked ? "" : workFormData.endDate
                                        })}
                                    />
                                    <label htmlFor="ongoing" className="text-sm font-medium">
                                        {tRecentWork('ongoingProject')}
                                    </label>
                                </div>

                                <div className={cn("flex gap-2 pt-4", isRTL && "flex-row-reverse")}>
                                    <Button
                                        type="button"
                                        onClick={handleSaveWork}
                                        disabled={!isWorkFormValid}
                                    >
                                        {editingWorkIndex !== null ? tRecentWork('updateWork') : tRecentWork('addWork')}
                                    </Button>
                                    {editingWorkIndex !== null && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={resetWorkForm}
                                        >
                                            {tRecentWork('cancel')}
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
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

{/* Twitter field removed - now using otherSocialLinks */}
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
                                    <Select onValueChange={field.onChange} value={field.value || ""}>
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
