"use client"

import React from "react"
import { UseFormReturn } from "react-hook-form"
import { useTranslations, useLocale } from "next-intl"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { cn } from "@/lib/utils"
import { rtlLocales } from "@/i18n/routing"
import type { OnboardingFormData } from "@/lib/schemas/onboarding-schema"

interface WorkInfoPanelProps {
  form: any
  content?: any
  workTypes?: Array<{ _id: string; title: any; description?: any }>
  expertiseAreas?: Array<{ _id: string; title: any; description?: any }>
  isSubmitting?: boolean
}

export function WorkInfoPanel({ form, content, workTypes = [], expertiseAreas = [] }: WorkInfoPanelProps) {
  const t = useTranslations("onboarding.steps.workInfo")
  const locale = useLocale()
  const isRTL = rtlLocales.includes(locale)

  const getLocalizedText = (item: any, fallback: string) => {
    if (!item) return fallback
    if (typeof item === 'string') return item
    return item[locale] || item['en'] || item.labelFallback || fallback
  }

  return (
    <div className={cn("space-y-6", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {content?.workInfoTitle || t("title")}
        </h2>
        <p className="text-muted-foreground">
          {content?.workInfoDescription || t("description")}
        </p>
      </div>

      <div className="space-y-6">
        {/* Work Types */}
        <FormField
          control={form.control}
          name="workInfo.workTypes"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base flex items-center gap-1">
                  {content?.fieldLabels?.workTypes || t("workTypes")}
                  <span className="text-red-500">*</span>
                </FormLabel>
                <FormDescription>
                  {content?.workInfoFieldHints?.workTypesHint || t("workTypesHint")}
                </FormDescription>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {workTypes.map((item) => (
                  <FormField
                    key={item._id}
                    control={form.control}
                    name="workInfo.workTypes"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={item._id}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(item._id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, item._id])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value: any) => value !== item._id
                                      )
                                    )
                              }}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="font-normal">
                              {getLocalizedText(item.title, `Work Type ${item._id}`)}
                            </FormLabel>
                            {item.description && (
                              <FormDescription>
                                {getLocalizedText(item.description, '')}
                              </FormDescription>
                            )}
                          </div>
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

        {/* Expertise Areas */}
        <FormField
          control={form.control}
          name="workInfo.expertiseAreas"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base flex items-center gap-1">
                  {content?.fieldLabels?.expertiseAreas || t("expertiseAreas")}
                  <span className="text-red-500">*</span>
                </FormLabel>
                <FormDescription>
                  {content?.workInfoFieldHints?.expertiseAreasHint || t("expertiseAreasHint")}
                </FormDescription>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {expertiseAreas.map((item) => (
                  <FormField
                    key={item._id}
                    control={form.control}
                    name="workInfo.expertiseAreas"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={item._id}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(item._id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, item._id])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value: any) => value !== item._id
                                      )
                                    )
                              }}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="font-normal">
                              {getLocalizedText(item.title, `Expertise ${item._id}`)}
                            </FormLabel>
                            {item.description && (
                              <FormDescription>
                                {getLocalizedText(item.description, '')}
                              </FormDescription>
                            )}
                          </div>
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

        {/* Organization & Position */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="workInfo.organization"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{content?.fieldLabels?.organization || t("organization")}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={content?.fieldPlaceholders?.organization || t("organizationPlaceholder")} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="workInfo.position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{content?.fieldLabels?.position || t("position")}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={content?.fieldPlaceholders?.position || t("positionPlaceholder")} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Work Bio */}
        <FormField
          control={form.control}
          name="workInfo.workBio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{content?.fieldLabels?.workBio || t("workBio")}</FormLabel>
              <FormControl>
                <Textarea {...field} rows={4} placeholder={content?.fieldPlaceholders?.workBio || t("workBioPlaceholder")} />
              </FormControl>
              <FormDescription>
                {content?.workInfoFieldHints?.workBioHint || t("workBioHint")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Social Links */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">{content?.fieldLabels?.socialLinks || t("socialLinks")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="workInfo.linkedinProfile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{content?.fieldLabels?.linkedin || t("linkedin")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={content?.fieldPlaceholders?.linkedin || "https://linkedin.com/in/username"} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="workInfo.portfolio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{content?.fieldLabels?.portfolio || t("portfolio")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={content?.fieldPlaceholders?.portfolio || "https://yourportfolio.com"} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="workInfo.githubProfile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{content?.fieldLabels?.github || t("github")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={content?.fieldPlaceholders?.github || "https://github.com/username"} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="workInfo.personalWebsite"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{content?.fieldLabels?.website || t("website")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={content?.fieldPlaceholders?.website || "https://yourwebsite.com"} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  )
}