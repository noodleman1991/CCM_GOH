"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from 'next-intl'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import ProfilePictureUpload from "@/components/blocks/profile/profile-picture-upload"

const profileSchema = z.object({
    firstName: z.string().min(1, "First name is required").max(50),
    lastName: z.string().min(1, "Last name is required").max(50),
    username: z.string().min(3, "Username must be at least 3 characters").max(30)
        .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers and underscores"),
    image: z.string().optional(),
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
    twitterHandle: z.string().optional()
}).transform((data) => {
    // Transform null values to undefined
    return Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, value === null ? undefined : value])
    ) as any
})

type ProfileFormValues = z.infer<typeof profileSchema>

interface ProfileEditFormProps {
    initialData?: Partial<ProfileFormValues>
    onSubmitAction: (data: ProfileFormValues) => Promise<void>
}

export default function ProfileEditForm({ initialData, onSubmitAction }: ProfileEditFormProps) {
    const t = useTranslations('profile.edit')
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            firstName: initialData?.firstName || "",
            lastName: initialData?.lastName || "",
            username: initialData?.username || "",
            image: initialData?.image || "",
            bio: initialData?.bio || "",
            ageGroup: initialData?.ageGroup,
            country: initialData?.country || "",
            city: initialData?.city || "",
            workTypes: initialData?.workTypes || [],
            expertiseAreas: initialData?.expertiseAreas || [],
            organization: initialData?.organization || "",
            position: initialData?.position || "",
            workBio: initialData?.workBio || "",
            personalWebsite: initialData?.personalWebsite || "",
            linkedinProfile: initialData?.linkedinProfile || "",
            twitterHandle: initialData?.twitterHandle || ""
        }
    })

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
            await onSubmitAction(values)
            toast.success(t('saveSuccess'))
            router.push(`/profile/${values.username}`)
        } catch (error) {
            toast.error(t('saveError'))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                {/* Profile Picture */}
                <ProfilePictureUpload
                    currentImage={form.watch("image")}
                    firstName={form.watch("firstName")}
                    lastName={form.watch("lastName")}
                    //onImageChangeAction={(url) => form.setValue("image", url)} //todo: which one works?
                    onImageChangeAction={async (url) => {
                        form.setValue("image", url)
                    }}
                />

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

                <div className="flex justify-end gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={isSubmitting}
                    >
                        {t('cancel')}
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('save')}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
