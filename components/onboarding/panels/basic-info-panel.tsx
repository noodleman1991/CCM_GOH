"use client"

import React, { useEffect, useState, useTransition } from "react"
import { useTranslations, useLocale } from "next-intl"
import { useRouter, usePathname } from "@/i18n/navigation"
import { Check, Loader2 } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { rtlLocales } from "@/i18n/routing"
import type { OnboardingContent, OnboardingForm } from "../types"
import { LIMITS } from "@/lib/validation/limits"
import { CharCounter } from "@/components/ui/char-counter"
import { ChoiceChips } from "@/components/profile/choice-chips"
import ProfilePictureUpload from "@/components/blocks/profile/profile-picture-upload"

/** The hub's four languages, each in its own words; members can add any other. */
const SPOKEN_LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "ar", label: "العربية" },
]

interface BasicInfoPanelProps {
  form: OnboardingForm
  content?: OnboardingContent | null
  isSubmitting?: boolean
}

export function BasicInfoPanel({ form, content }: BasicInfoPanelProps) {
  const t = useTranslations("onboarding.steps.basicInfo")
  const locale = useLocale()
  const isRTL = rtlLocales.includes(locale)
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const languageOptions = [
    { value: "EN", label: "English", isRTL: false },
    { value: "ES", label: "Español", isRTL: false },
    { value: "FR", label: "Français", isRTL: false },
    { value: "AR", label: "العربية", isRTL: true }
  ]

  // --- Live username availability check (debounced) ---
  const usernameValue = form.watch("basicInfo.username")
  // The user's current username (server-provided default) — no need to check it
  const currentUsername: string = form.formState.defaultValues?.basicInfo?.username || ""
  // The last completed check, keyed by the value it checked. The displayed
  // status is DERIVED during render (no setState inside the effect body):
  // skip-conditions → "idle"; a stale/absent result → "checking"; otherwise
  // the recorded result.
  const [checkResult, setCheckResult] = useState<{
    value: string
    status: "idle" | "available" | "taken"
  } | null>(null)

  const trimmedUsername = (usernameValue || "").trim()
  // Skip: empty, below min length, invalid format (zod handles those),
  // or unchanged from the user's current username
  const shouldCheckUsername = !(
    trimmedUsername.length < 3 ||
    !/^[a-zA-Z0-9_]+$/.test(trimmedUsername) ||
    (currentUsername && trimmedUsername.toLowerCase() === currentUsername.toLowerCase())
  )
  const usernameStatus: "idle" | "checking" | "available" | "taken" = !shouldCheckUsername
    ? "idle"
    : checkResult?.value === trimmedUsername
      ? checkResult.status
      : "checking"

  useEffect(() => {
    if (!shouldCheckUsername) return

    const value = trimmedUsername
    const controller = new AbortController()
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/username/check?username=${encodeURIComponent(value)}`,
          { signal: controller.signal }
        )
        if (!response.ok) {
          // Auth/server errors: don't block typing, fall back to submit-time check
          setCheckResult({ value, status: "idle" })
          return
        }
        const data = await response.json()
        if (data.available) {
          setCheckResult({ value, status: "available" })
          // Only clear our own manual error, never zod validation errors
          if (form.formState.errors?.basicInfo?.username?.type === "manual") {
            form.clearErrors("basicInfo.username")
          }
        } else {
          setCheckResult({ value, status: "taken" })
          form.setError("basicInfo.username", {
            type: "manual",
            message: data.message || t("usernameTaken")
          })
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setCheckResult({ value, status: "idle" })
        }
      }
    }, 500)

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [trimmedUsername, shouldCheckUsername, currentUsername, form])

  return (
    <div className={cn(
      "space-y-5",
      "text-start [&_input]:text-start [&_textarea]:text-start"
    )} dir={isRTL ? "rtl" : "ltr"}>
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {content?.basicInfoTitle || t("title")}
        </h2>
        <p className="text-lg text-muted-foreground">
          {content?.basicInfoDescription || t("description")}
        </p>
      </div>

      <div className="space-y-4">
        {/* Photo — optional; saved straight to the account (Clerk), like Edit profile */}
        <ProfilePictureUpload firstName={form.watch("basicInfo.firstName")} lastName={form.watch("basicInfo.lastName")} />

        {/* Name Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <FormField
            control={form.control}
            name="basicInfo.firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1">
                  {content?.fieldLabels?.basicInfo?.firstName || t("firstName")}
                  <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder={content?.fieldLabels?.basicInfo?.firstNamePlaceholder || t("firstNamePlaceholder")} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="basicInfo.lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1">
                  {content?.fieldLabels?.basicInfo?.lastName || t("lastName")}
                  <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder={content?.fieldLabels?.basicInfo?.lastNamePlaceholder || t("lastNamePlaceholder")} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Username */}
        <FormField
          control={form.control}
          name="basicInfo.username"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1">
                {content?.fieldLabels?.basicInfo?.username || t("username")}
                <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input {...field} placeholder={content?.fieldLabels?.basicInfo?.usernamePlaceholder || t("usernamePlaceholder")} />
              </FormControl>
              {usernameStatus === "checking" && (
                <p className={cn("flex items-center gap-1.5 text-sm text-muted-foreground")}>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {t("usernameChecking")}
                </p>
              )}
              {usernameStatus === "available" && (
                <p className={cn("flex items-center gap-1.5 text-sm text-green-600")}>
                  <Check className="h-3.5 w-3.5" />
                  {t("usernameAvailable")}
                </p>
              )}
              <FormDescription>
                {content?.basicInfoFieldHints?.usernameHint || t("usernameHint")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Pronouns — optional, in the member's own words */}
        <FormField
          control={form.control}
          name="basicInfo.pronouns"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("pronouns")}</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ""} placeholder={t("pronounsPlaceholder")} maxLength={LIMITS.profile.pronouns} className="max-w-xs" />
              </FormControl>
              <FormDescription>{t("pronounsHint")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Languages they speak — the hub's four, or any other */}
        <FormField
          control={form.control}
          name="basicInfo.languages"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("languages")}</FormLabel>
              <FormDescription>{t("languagesHint")}</FormDescription>
              <ChoiceChips
                label={t("languages")}
                options={SPOKEN_LANGUAGES}
                value={field.value ?? []}
                onChange={field.onChange}
                max={10}
                other={{ placeholder: t("languagesOther"), addLabel: t("languagesAdd"), maxLength: LIMITS.profile.language }}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Bio */}
        <FormField
          control={form.control}
          name="basicInfo.bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{content?.fieldLabels?.basicInfo?.bio || t("bio")}</FormLabel>
              <FormControl>
                <Textarea {...field} rows={3} placeholder={content?.fieldLabels?.basicInfo?.bioPlaceholder || t("bioPlaceholder")} maxLength={LIMITS.profile.bio} />
              </FormControl>
                <CharCounter value={field.value} max={LIMITS.profile.bio} />
              <FormDescription>
                {content?.basicInfoFieldHints?.bioHint || t("bioHint")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Age Group */}
        <FormField
          control={form.control}
          name="basicInfo.ageGroup"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{content?.fieldLabels?.basicInfo?.ageGroup || t("ageGroup")}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={content?.fieldLabels?.basicInfo?.selectAge || t("selectAge")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent dir={isRTL ? "rtl" : "ltr"} className="text-start">
                  <SelectItem value="UNDER_18">{content?.fieldLabels?.basicInfo?.under18 || t("under18")}</SelectItem>
                  <SelectItem value="ABOVE_18">{content?.fieldLabels?.basicInfo?.above18 || t("above18")}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <FormField
            control={form.control}
            name="basicInfo.country"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1">
                  {content?.fieldLabels?.basicInfo?.country || t("country")}
                  <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder={content?.fieldLabels?.basicInfo?.countryPlaceholder || t("countryPlaceholder")} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="basicInfo.city"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1">
                  {content?.fieldLabels?.basicInfo?.city || t("city")}
                  <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder={content?.fieldLabels?.basicInfo?.cityPlaceholder || t("cityPlaceholder")} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Preferred Language */}
        <FormField
          control={form.control}
          name="basicInfo.preferredLanguage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{content?.fieldLabels?.basicInfo?.preferredLanguage || t("preferredLanguage")}</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value)
                  // Switch the site language
                  const newLocale = value.toLowerCase()
                  startTransition(() => {
                    router.replace(pathname, { locale: newLocale })
                  })
                }}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={content?.fieldLabels?.basicInfo?.preferredLanguage || t("preferredLanguage")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {languageOptions.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className={cn(option.isRTL && "text-right")}
                      dir={option.isRTL ? "rtl" : "ltr"}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                {content?.basicInfoFieldHints?.languageHint || t("languageHint")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}