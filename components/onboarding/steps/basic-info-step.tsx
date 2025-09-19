"use client"

import React, { useEffect, useCallback } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations, useLocale } from "next-intl"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { cn } from "@/lib/utils"
import { rtlLocales } from "@/i18n/routing"
import type { OnboardingData } from "../onboarding-container"

const basicInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  username: z.string().min(3, "Username must be at least 3 characters").max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers and underscores"),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  ageGroup: z.enum(["UNDER_18", "ABOVE_18"]).optional(),
  country: z.string().min(1, "Country is required"),
  city: z.string().min(1, "City is required"),
  preferredLanguage: z.enum(["EN", "ES", "FR", "AR"])
})

type BasicInfoFormValues = z.infer<typeof basicInfoSchema>

interface BasicInfoStepProps {
  data: OnboardingData
  updateDataAction: (data: Partial<OnboardingData>) => void
  onNextAction: () => void
  onPrev: () => void
  isFirst: boolean
  isLast: boolean
  content?: any
  onValidationChange?: (isValid: boolean) => void
}

export function BasicInfoStep({ data, updateDataAction, onNextAction, content, onValidationChange }: BasicInfoStepProps) {
  const t = useTranslations("onboarding.steps.basicInfo") // UI labels and placeholders
  const locale = useLocale()
  const isRTL = rtlLocales.includes(locale)

  const form = useForm<BasicInfoFormValues>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      firstName: data.firstName,
      lastName: data.lastName,
      username: data.username,
      bio: data.bio,
      ageGroup: data.ageGroup,
      country: data.country,
      city: data.city,
      preferredLanguage: data.preferredLanguage
    }
  })

  // Break the infinite loop by using a stable default value
  const stableDefaultValue = React.useMemo(() => ({
    firstName: data.firstName,
    lastName: data.lastName,
    username: data.username,
    bio: data.bio,
    ageGroup: data.ageGroup,
    country: data.country,
    city: data.city,
    preferredLanguage: data.preferredLanguage
  }), []) // Empty deps - only set once

  const watchedValues = useWatch({
    control: form.control
    // Remove defaultValue to prevent loop
  })

  // Use ref to track if this is user-initiated change vs prop change
  const userInitiatedRef = React.useRef(false)

  // Only update parent on user changes, not prop changes
  React.useEffect(() => {
    if (watchedValues && userInitiatedRef.current) {
      updateDataAction(watchedValues as BasicInfoFormValues)
    }
    userInitiatedRef.current = true // After first render, all changes are user-initiated
  }, [watchedValues, updateDataAction])

  // Simplified validation notification without unnecessary memoization
  React.useEffect(() => {
    if (onValidationChange) {
      onValidationChange(form.formState.isValid)
    }
  }, [form.formState.isValid, onValidationChange])

  const languageOptions = [
    { value: "EN", label: "English" },
    { value: "ES", label: "Español" },
    { value: "FR", label: "Français" },
    { value: "AR", label: "العربية" }
  ]

  return (
    <div className={cn("space-y-6", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
      <div className="mb-6">
        <p className="text-muted-foreground">
{content?.basicInfoDescription || "Help us get to know you better. This information will be used to create your profile."}
        </p>
      </div>

      <Form {...form}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    {t("firstName")}
                    <span className="text-red-500">*</span>
                  </FormLabel>
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
                  <FormLabel className="flex items-center gap-1">
                    {t("lastName")}
                    <span className="text-red-500">*</span>
                  </FormLabel>
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
                <FormLabel className="flex items-center gap-1">
                  {t("username")}
                  <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>
                  {content?.basicInfoFieldHints?.usernameHint || "This will be your unique identifier in the community."}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("bio")}</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={3} placeholder={t("bioPlaceholder")} />
                </FormControl>
                <FormDescription>
                  {content?.basicInfoFieldHints?.bioHint || "A brief introduction about yourself and your interests."}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ageGroup"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("ageGroup")}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectAge")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="UNDER_18">{t("under18")}</SelectItem>
                    <SelectItem value="ABOVE_18">{t("above18")}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    {t("country")}
                    <span className="text-red-500">*</span>
                  </FormLabel>
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
                  <FormLabel className="flex items-center gap-1">
                    {t("city")}
                    <span className="text-red-500">*</span>
                  </FormLabel>
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
            name="preferredLanguage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("preferredLanguage")}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {languageOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {content?.basicInfoFieldHints?.languageHint || "Select your preferred language for platform communications."}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

        </div>
      </Form>
    </div>
  )
}
