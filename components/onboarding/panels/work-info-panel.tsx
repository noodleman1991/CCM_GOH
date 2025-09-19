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
  workTypes?: Array<{ _id: string; key: string; label: string; description?: string }>
  expertiseAreas?: Array<{ _id: string; key: string; label: string; description?: string }>
  isSubmitting?: boolean
}

export function WorkInfoPanel({ form, content, workTypes = [], expertiseAreas = [] }: WorkInfoPanelProps) {
  const t = useTranslations("onboarding.steps.workInfo")
  const locale = useLocale()
  const isRTL = rtlLocales.includes(locale)

  const getLocalizedText = (text: string | undefined, fallback: string) => {
    return text || fallback
  }

  return (
    <div className={cn(
      "space-y-6",
      isRTL && "text-right [&_input]:text-right [&_textarea]:text-right"
    )} dir={isRTL ? "rtl" : "ltr"}>
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
                  {content?.fieldLabels?.workInfo?.workTypes || t("workTypes")}
                  <span className="text-red-500">*</span>
                </FormLabel>
                <FormDescription>
                  {content?.workInfoFieldHints?.workTypesHint || t("workTypesHint")}
                </FormDescription>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                              {getLocalizedText(item.label, `Work Type ${item.key || item._id}`)}
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
                  {content?.fieldLabels?.workInfo?.expertiseAreas || t("expertiseAreas")}
                  <span className="text-red-500">*</span>
                </FormLabel>
                <FormDescription>
                  {content?.workInfoFieldHints?.expertiseAreasHint || t("expertiseAreasHint")}
                </FormDescription>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                              {getLocalizedText(item.label, `Expertise ${item.key || item._id}`)}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <FormField
            control={form.control}
            name="workInfo.organization"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{content?.fieldLabels?.workInfo?.organization || t("organization")}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={content?.fieldLabels?.workInfo?.organizationPlaceholder || t("organizationPlaceholder")} />
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
                <FormLabel>{content?.fieldLabels?.workInfo?.position || t("position")}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={content?.fieldLabels?.workInfo?.positionPlaceholder || t("positionPlaceholder")} />
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
              <FormLabel>{content?.fieldLabels?.workInfo?.workBio || t("workBio")}</FormLabel>
              <FormControl>
                <Textarea {...field} rows={4} placeholder={content?.fieldLabels?.workInfo?.workBioPlaceholder || t("workBioPlaceholder")} />
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
          <h3 className="text-lg font-medium">{content?.fieldLabels?.workInfo?.socialLinks || t("socialLinks")}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <FormField
              control={form.control}
              name="workInfo.linkedinProfile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{content?.fieldLabels?.workInfo?.linkedin || t("linkedin")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={content?.fieldLabels?.workInfo?.linkedinPlaceholder || "https://linkedin.com/in/username"} />
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
                  <FormLabel>{content?.fieldLabels?.workInfo?.portfolio || t("portfolio")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={content?.fieldLabels?.workInfo?.portfolioPlaceholder || "https://yourportfolio.com"} />
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
                  <FormLabel>{content?.fieldLabels?.workInfo?.github || t("github")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={content?.fieldLabels?.workInfo?.githubPlaceholder || "https://github.com/username"} />
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
                  <FormLabel>{content?.fieldLabels?.workInfo?.website || t("website")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={content?.fieldLabels?.workInfo?.websitePlaceholder || "https://yourwebsite.com"} />
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