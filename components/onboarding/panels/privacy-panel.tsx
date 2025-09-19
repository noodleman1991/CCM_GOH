"use client"

import React from "react"
import { UseFormReturn } from "react-hook-form"
import { useTranslations, useLocale } from "next-intl"
import { Shield, Eye, EyeOff, Users, Globe, Lock } from "lucide-react"

import { Switch } from "@/components/ui/switch"
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { rtlLocales } from "@/i18n/routing"
import type { OnboardingFormData } from "@/lib/schemas/onboarding-schema"

interface PrivacyPanelProps {
  form: any
  content?: any
  isSubmitting?: boolean
}

export function PrivacyPanel({ form, content }: PrivacyPanelProps) {
  const t = useTranslations("onboarding.steps.privacy")
  const locale = useLocale()
  const isRTL = rtlLocales.includes(locale)

  const profileVisibility = form.watch("privacy.profileVisibility")

  const visibilityOptions = [
    {
      value: "PUBLIC" as const,
      label: content?.privacyFieldLabels?.visibilityPublicTitle || t("visibility.public.title"),
      description: content?.privacyFieldLabels?.visibilityPublicDescription || t("visibility.public.description"),
      icon: Globe
    },
    {
      value: "MEMBERS" as const,
      label: content?.privacyFieldLabels?.visibilityMembersTitle || t("visibility.members.title"),
      description: content?.privacyFieldLabels?.visibilityMembersDescription || t("visibility.members.description"),
      icon: Users
    },
    {
      value: "PRIVATE" as const,
      label: content?.privacyFieldLabels?.visibilityPrivateTitle || t("visibility.private.title"),
      description: content?.privacyFieldLabels?.visibilityPrivateDescription || t("visibility.private.description"),
      icon: Lock
    }
  ]

  return (
    <div className={cn("space-y-6", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
      <div className="mb-6">
        <div className={cn("flex items-center gap-2 mb-2", isRTL && "flex-row-reverse")}>
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold text-gray-900">{content?.privacyTitle || t("title")}</h2>
        </div>
        <p className="text-muted-foreground">
          {content?.privacyDescription || t("description")}
        </p>
      </div>

      <div className="space-y-6">
        {/* Search Visibility */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{content?.privacyFieldLabels?.searchabilityTitle || t("searchability.title")}</CardTitle>
            <CardDescription>{content?.privacyFieldLabels?.searchabilityDescription || t("searchability.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="privacy.isSearchable"
              render={({ field }) => (
                <FormItem className={cn("flex flex-row items-center justify-between", isRTL && "flex-row-reverse")}>
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">{content?.privacyFieldLabels?.allowSearch || t("searchability.allowSearch")}</FormLabel>
                    <FormDescription>{content?.privacyFieldLabels?.searchHint || t("searchability.searchHint")}</FormDescription>
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
            <CardTitle className="text-lg">{content?.privacyFieldLabels?.visibilityTitle || t("visibility.title")}</CardTitle>
            <CardDescription>{content?.privacyFieldLabels?.visibilityDescription || t("visibility.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="privacy.profileVisibility"
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
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Granular Privacy Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{content?.privacyFieldLabels?.profileInfoTitle || t("profileInfo.title")}</CardTitle>
            <CardDescription>{content?.privacyFieldLabels?.profileInfoDescription || t("profileInfo.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="privacy.showEmail"
              render={({ field }) => (
                <FormItem className={cn("flex flex-row items-center justify-between", isRTL && "flex-row-reverse")}>
                  <div className="space-y-0.5">
                    <FormLabel>{content?.privacyFieldLabels?.showEmail || t("profileInfo.showEmail")}</FormLabel>
                    <FormDescription className="text-xs">{content?.privacyFieldLabels?.emailHint || t("profileInfo.emailHint")}</FormDescription>
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
              name="privacy.showPhoneNumber"
              render={({ field }) => (
                <FormItem className={cn("flex flex-row items-center justify-between", isRTL && "flex-row-reverse")}>
                  <div className="space-y-0.5">
                    <FormLabel>{content?.privacyFieldLabels?.showPhone || t("profileInfo.showPhone")}</FormLabel>
                    <FormDescription className="text-xs">{content?.privacyFieldLabels?.phoneHint || t("profileInfo.phoneHint")}</FormDescription>
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
              name="privacy.showWorkDetails"
              render={({ field }) => (
                <FormItem className={cn("flex flex-row items-center justify-between", isRTL && "flex-row-reverse")}>
                  <div className="space-y-0.5">
                    <FormLabel>{content?.privacyFieldLabels?.showWork || t("profileInfo.showWork")}</FormLabel>
                    <FormDescription className="text-xs">{content?.privacyFieldLabels?.workHint || t("profileInfo.workHint")}</FormDescription>
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
              name="privacy.showSocialLinks"
              render={({ field }) => (
                <FormItem className={cn("flex flex-row items-center justify-between", isRTL && "flex-row-reverse")}>
                  <div className="space-y-0.5">
                    <FormLabel>{content?.privacyFieldLabels?.showSocial || t("profileInfo.showSocial")}</FormLabel>
                    <FormDescription className="text-xs">{content?.privacyFieldLabels?.socialHint || t("profileInfo.socialHint")}</FormDescription>
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
              name="privacy.showLocation"
              render={({ field }) => (
                <FormItem className={cn("flex flex-row items-center justify-between", isRTL && "flex-row-reverse")}>
                  <div className="space-y-0.5">
                    <FormLabel>{content?.privacyFieldLabels?.showLocation || t("profileInfo.showLocation")}</FormLabel>
                    <FormDescription className="text-xs">{content?.privacyFieldLabels?.locationHint || t("profileInfo.locationHint")}</FormDescription>
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
    </div>
  )
}