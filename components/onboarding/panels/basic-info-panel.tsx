"use client"

import React from "react"
import { UseFormReturn } from "react-hook-form"
import { useTranslations, useLocale } from "next-intl"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { cn } from "@/lib/utils"
import { rtlLocales } from "@/i18n/routing"
import type { OnboardingFormData } from "@/lib/schemas/onboarding-schema"

interface BasicInfoPanelProps {
  form: any
  content?: any
  isSubmitting?: boolean
}

export function BasicInfoPanel({ form, content }: BasicInfoPanelProps) {
  const t = useTranslations("onboarding.steps.basicInfo")
  const locale = useLocale()
  const isRTL = rtlLocales.includes(locale)

  const languageOptions = [
    { value: "EN", label: "English" },
    { value: "ES", label: "Español" },
    { value: "FR", label: "Français" },
    { value: "AR", label: "العربية" }
  ]

  return (
    <div className={cn("space-y-6", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {content?.basicInfoTitle || t("title")}
        </h2>
        <p className="text-muted-foreground">
          {content?.basicInfoDescription || t("description")}
        </p>
      </div>

      <div className="space-y-4">
        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="basicInfo.firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1">
                  {content?.fieldLabels?.firstName || t("firstName")}
                  <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder={content?.fieldPlaceholders?.firstName || t("firstNamePlaceholder")} />
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
                  {content?.fieldLabels?.lastName || t("lastName")}
                  <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder={content?.fieldPlaceholders?.lastName || t("lastNamePlaceholder")} />
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
                {content?.fieldLabels?.username || t("username")}
                <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input {...field} placeholder={content?.fieldPlaceholders?.username || t("usernamePlaceholder")} />
              </FormControl>
              <FormDescription>
                {content?.basicInfoFieldHints?.usernameHint || t("usernameHint")}
              </FormDescription>
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
              <FormLabel>{content?.fieldLabels?.bio || t("bio")}</FormLabel>
              <FormControl>
                <Textarea {...field} rows={3} placeholder={content?.fieldPlaceholders?.bio || t("bioPlaceholder")} />
              </FormControl>
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
              <FormLabel>{content?.fieldLabels?.ageGroup || t("ageGroup")}</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">{content?.fieldPlaceholders?.ageGroup || t("selectAge")}</option>
                  <option value="UNDER_18">{content?.fieldOptions?.under18 || t("under18")}</option>
                  <option value="ABOVE_18">{content?.fieldOptions?.above18 || t("above18")}</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="basicInfo.country"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1">
                  {content?.fieldLabels?.country || t("country")}
                  <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder={content?.fieldPlaceholders?.country || t("countryPlaceholder")} />
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
                  {content?.fieldLabels?.city || t("city")}
                  <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder={content?.fieldPlaceholders?.city || t("cityPlaceholder")} />
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
              <FormLabel>{content?.fieldLabels?.preferredLanguage || t("preferredLanguage")}</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {languageOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FormControl>
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