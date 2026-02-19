"use client"

import { useEffect, useCallback } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations, useLocale } from "next-intl"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Eye, EyeOff, Users, Globe, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { rtlLocales } from "@/i18n/routing"
import type { OnboardingData } from "../onboarding-container"

const privacySchema = z.object({
  isSearchable: z.boolean(),
  profileVisibility: z.enum(["PUBLIC", "MEMBERS", "PRIVATE"]),
  showEmail: z.boolean(),
  showPhoneNumber: z.boolean(),
  showWorkDetails: z.boolean(),
  showSocialLinks: z.boolean(),
  showLocation: z.boolean()
})

type PrivacyFormValues = z.infer<typeof privacySchema>

interface PrivacyStepProps {
  data: OnboardingData
  updateDataAction: (data: Partial<OnboardingData>) => void
  onNextAction: () => void
  onPrev: () => void
  isFirst: boolean
  isLast: boolean
}

export function PrivacyStep({ data, updateDataAction, onNextAction }: PrivacyStepProps) {
  const t = useTranslations("onboarding.steps.privacy")
  const locale = useLocale()
  const isRTL = rtlLocales.includes(locale)

  const form = useForm<PrivacyFormValues>({
    resolver: zodResolver(privacySchema),
    defaultValues: {
      isSearchable: data.isSearchable,
      profileVisibility: data.profileVisibility,
      showEmail: data.showEmail,
      showPhoneNumber: data.showPhoneNumber,
      showWorkDetails: data.showWorkDetails,
      showSocialLinks: data.showSocialLinks,
      showLocation: data.showLocation
    }
  })

  // Use useWatch instead of watch subscription to prevent infinite loops
  const watchedValues = useWatch({
    control: form.control,
    defaultValue: {
      isSearchable: data.isSearchable,
      profileVisibility: data.profileVisibility,
      showEmail: data.showEmail,
      showPhoneNumber: data.showPhoneNumber,
      showWorkDetails: data.showWorkDetails,
      showSocialLinks: data.showSocialLinks,
      showLocation: data.showLocation
    }
  })

  // Memoize the update function to prevent infinite loops
  const memoizedUpdateDataAction = useCallback((values: PrivacyFormValues) => {
    updateDataAction(values)
  }, [updateDataAction])

  // Update parent data when watched values change
  useEffect(() => {
    if (watchedValues) {
      memoizedUpdateDataAction(watchedValues as PrivacyFormValues)
    }
  }, [watchedValues, memoizedUpdateDataAction])

  const visibilityOptions = [
    {
      value: "PUBLIC",
      label: t("visibility.public.title"),
      description: t("visibility.public.description"),
      icon: Globe
    },
    {
      value: "MEMBERS",
      label: t("visibility.members.title"),
      description: t("visibility.members.description"),
      icon: Users
    },
    {
      value: "PRIVATE",
      label: t("visibility.private.title"),
      description: t("visibility.private.description"),
      icon: Lock
    }
  ]

  const profileVisibility = form.watch("profileVisibility")

  return (
    <div className={cn("space-y-6", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
      <div className="mb-6">
        <div className={cn("flex items-center gap-2 mb-2", isRTL && "flex-row-reverse")}>
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">{t("title")}</h2>
        </div>
        <p className="text-muted-foreground">
          {t("description")}
        </p>
      </div>

      <Form {...form}>
        <div className="space-y-6">
          {/* Search Visibility */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("searchability.title")}</CardTitle>
              <CardDescription>{t("searchability.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="isSearchable"
                render={({ field }) => (
                  <FormItem className={cn("flex flex-row items-center justify-between", isRTL && "flex-row-reverse")}>
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">{t("searchability.allowSearch")}</FormLabel>
                      <FormDescription>{t("searchability.searchHint")}</FormDescription>
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
            </CardContent>
          </Card>

          {/* Profile Visibility */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("visibility.title")}</CardTitle>
              <CardDescription>{t("visibility.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="profileVisibility"
                render={({ field }) => (
                  <FormItem>
                    <div className="space-y-3">
                      {visibilityOptions.map((option) => (
                        <div
                          key={option.value}
                          className={cn(
                            "flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50",
                            profileVisibility === option.value && "border-primary bg-primary/5",
                            isRTL && "flex-row-reverse"
                          )}
                          onClick={() => field.onChange(option.value)}
                        >
                          <div className="flex-shrink-0 mt-1">
                            <option.icon className={cn(
                              "h-5 w-5",
                              profileVisibility === option.value ? "text-primary" : "text-muted-foreground"
                            )} />
                          </div>
                          <div className="space-y-1">
                            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                              <h4 className="font-medium">{option.label}</h4>
                              {profileVisibility === option.value && (
                                <div className="w-2 h-2 bg-primary rounded-full" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{option.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Granular Privacy Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("profileInfo.title")}</CardTitle>
              <CardDescription>{t("profileInfo.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="showEmail"
                render={({ field }) => (
                  <FormItem className={cn("flex flex-row items-center justify-between", isRTL && "flex-row-reverse")}>
                    <div className="space-y-0.5">
                      <FormLabel>{t("profileInfo.showEmail")}</FormLabel>
                      <FormDescription className="text-xs">{t("profileInfo.emailHint")}</FormDescription>
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
                  <FormItem className={cn("flex flex-row items-center justify-between", isRTL && "flex-row-reverse")}>
                    <div className="space-y-0.5">
                      <FormLabel>{t("profileInfo.showPhone")}</FormLabel>
                      <FormDescription className="text-xs">{t("profileInfo.phoneHint")}</FormDescription>
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
                  <FormItem className={cn("flex flex-row items-center justify-between", isRTL && "flex-row-reverse")}>
                    <div className="space-y-0.5">
                      <FormLabel>{t("profileInfo.showWork")}</FormLabel>
                      <FormDescription className="text-xs">{t("profileInfo.workHint")}</FormDescription>
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
                  <FormItem className={cn("flex flex-row items-center justify-between", isRTL && "flex-row-reverse")}>
                    <div className="space-y-0.5">
                      <FormLabel>{t("profileInfo.showSocial")}</FormLabel>
                      <FormDescription className="text-xs">{t("profileInfo.socialHint")}</FormDescription>
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
                  <FormItem className={cn("flex flex-row items-center justify-between", isRTL && "flex-row-reverse")}>
                    <div className="space-y-0.5">
                      <FormLabel>{t("profileInfo.showLocation")}</FormLabel>
                      <FormDescription className="text-xs">{t("profileInfo.locationHint")}</FormDescription>
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
            </CardContent>
          </Card>

        </div>
      </Form>
    </div>
  )
}
