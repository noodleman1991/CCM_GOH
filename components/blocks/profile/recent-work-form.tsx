"use client"

import { useState, useMemo } from "react"
import { useTranslations } from 'next-intl'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { format } from "date-fns"

// Localized validation messages (resolved from t() inside the component so the
// Zod errors show in the user's language — the proven newsletter pattern).
interface SchemaMessages {
    titleRequired: string
    descriptionRequired: string
    urlInvalid: string
    startDateRequired: string
    endDateRule: string
}

const makeRecentWorkSchema = (m: SchemaMessages) => z.object({
    title: z.string().min(1, m.titleRequired).max(200),
    description: z.string().min(1, m.descriptionRequired).max(1000),
    link: z.string().url(m.urlInvalid).optional().or(z.literal("")),
    isOngoing: z.boolean(),
    startDate: z.string().min(1, m.startDateRequired),
    endDate: z.string().optional()
}).refine((data) => {
    if (!data.isOngoing && !data.endDate) {
        return false
    }
    if (data.endDate && data.startDate > data.endDate) {
        return false
    }
    return true
}, {
    message: m.endDateRule,
    path: ["endDate"]
})

type RecentWorkFormValues = z.infer<ReturnType<typeof makeRecentWorkSchema>>

interface RecentWorkFormProps {
    initialData?: Partial<RecentWorkFormValues>
    onSubmitAction: (data: RecentWorkFormValues) => Promise<void>
    onCancelAction: () => void
}

export default function RecentWorkForm({
                                           initialData,
                                           onSubmitAction,
                                           onCancelAction
                                       }: RecentWorkFormProps) {
    const t = useTranslations('profile.recentWork.form')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Schema built inside the component so validation messages localize
    // (newsletter/case-study Zod-closure pattern).
    const recentWorkSchema = useMemo(() => makeRecentWorkSchema({
        titleRequired: t('validation.titleRequired'),
        descriptionRequired: t('validation.descriptionRequired'),
        urlInvalid: t('validation.urlInvalid'),
        startDateRequired: t('validation.startDateRequired'),
        endDateRule: t('validation.endDateRule'),
    }), [t])

    const form = useForm<RecentWorkFormValues>({
        resolver: zodResolver(recentWorkSchema),
        defaultValues: {
            title: initialData?.title || "",
            description: initialData?.description || "",
            link: initialData?.link || "",
            isOngoing: initialData?.isOngoing ?? false,
            startDate: initialData?.startDate || "",
            endDate: initialData?.endDate || ""
        }
    })

    const isOngoing = form.watch("isOngoing")

    async function handleSubmit(values: RecentWorkFormValues) {
        setIsSubmitting(true)
        try {
            const formattedData = {
                ...values,
                startDate: new Date(values.startDate).toISOString(),
                endDate: values.endDate && !values.isOngoing
                    ? new Date(values.endDate).toISOString()
                    : undefined
            }
            await onSubmitAction(formattedData)
            toast.success(t('saveSuccess'))
            form.reset()
        } catch {
            toast.error(t('saveError'))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('title')}</CardTitle>
                <CardDescription>{t('description')}</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('workTitle')}</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder={t('workTitlePlaceholder')} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('workDescription')}</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            rows={4}
                                            placeholder={t('workDescriptionPlaceholder')}
                                        />
                                    </FormControl>
                                    <FormDescription>{t('workDescriptionHint')}</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="link"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('workLink')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            type="url"
                                            placeholder="https://example.com"
                                        />
                                    </FormControl>
                                    <FormDescription>{t('workLinkHint')}</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('startDate')}</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="month"
                                                max={format(new Date(), 'yyyy-MM')}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="endDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('endDate')}</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="month"
                                                disabled={isOngoing}
                                                min={form.watch("startDate")}
                                                max={format(new Date(), 'yyyy-MM')}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="isOngoing"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>{t('ongoing')}</FormLabel>
                                        <FormDescription>{t('ongoingDescription')}</FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancelAction}
                                disabled={isSubmitting}
                            >
                                {t('cancel')}
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                                {t('save')}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
