"use client"

import React from "react"
import { UseFormReturn } from "react-hook-form"
import { useTranslations, useLocale } from "next-intl"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
              <FormLabel>{content?.fieldLabels?.basicInfo?.bio || t("bio")}</FormLabel>
              <FormControl>
                <Textarea {...field} rows={3} placeholder={content?.fieldLabels?.basicInfo?.bioPlaceholder || t("bioPlaceholder")} />
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
              <FormLabel>{content?.fieldLabels?.basicInfo?.ageGroup || t("ageGroup")}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={content?.fieldLabels?.basicInfo?.selectAge || t("selectAge")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="UNDER_18">{content?.fieldLabels?.basicInfo?.under18 || t("under18")}</SelectItem>
                  <SelectItem value="ABOVE_18">{content?.fieldLabels?.basicInfo?.above18 || t("above18")}</SelectItem>
                </SelectContent>
              </Select>
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={content?.fieldLabels?.basicInfo?.preferredLanguage || t("preferredLanguage")} />
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