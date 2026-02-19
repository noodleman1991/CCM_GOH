"use client"

import React from "react"
import { UseFormReturn } from "react-hook-form"
import { useTranslations, useLocale } from "next-intl"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { cn } from "@/lib/utils"
import { rtlLocales } from "@/i18n/routing"
import type { OnboardingFormData } from "@/lib/schemas/onboarding-schema"

interface WorkInfoPanelProps {
  form: any
  content?: any
  workTypes?: Array<{ _id: string; key: string; label: string; description?: string; order?: number }>
  expertiseAreas?: Array<{ _id: string; key: string; label: string; description?: string; order?: number }>
  communities?: Array<{ id: string; name: string; regionalName: string | null; type: string }>
  isSubmitting?: boolean
}

export function WorkInfoPanel({ form, content, workTypes = [], expertiseAreas = [], communities = [] }: WorkInfoPanelProps) {
  const t = useTranslations("onboarding.steps.workInfo")
  const tNav = useTranslations("navigation")
  const locale = useLocale()
  const isRTL = rtlLocales.includes(locale)

  const getLocalizedText = (text: string | undefined, fallback: string) => {
    return text || fallback
  }

  // Map regional name enum values to translation keys (same as profile-edit and collaborate)
  const REGIONAL_NAME_TO_TRANSLATION_KEY: Record<string, string> = {
    'SUB_SAHARAN_AFRICA': 'subSaharanAfrica',
    'NORTHERN_AFRICA_AND_WESTERN_ASIA': 'northernAfricaWesternAsia',
    'CENTRAL_AND_SOUTHERN_ASIA': 'centralSouthernAsia',
    'EASTERN_AND_SOUTH_EASTERN_ASIA': 'easternSouthEasternAsia',
    'LATIN_AMERICA_AND_THE_CARIBBEAN': 'latinAmericaCaribbean',
    'OCEANIA': 'oceania',
    'EUROPE_AND_NORTH_AMERICA': 'europeNorthAmerica'
  }

  return (
    <div className={cn(
      "space-y-5",
      isRTL && "text-right [&_input]:text-right [&_textarea]:text-right"
    )} dir={isRTL ? "rtl" : "ltr"}>
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {content?.workInfoTitle || t("title")}
        </h2>
        <p className="text-lg text-muted-foreground">
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
              <div className="grid grid-cols-1 gap-4">
                {workTypes.map((item) => (
                  <FormField
                    key={item._id}
                    control={form.control}
                    name="workInfo.workTypes"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={item._id}
                          className={cn(
                            "flex flex-row items-start gap-3 space-y-0 p-4 rounded-lg border-2 transition-all hover:bg-gray-50",
                            isRTL && "flex-row-reverse"
                          )}
                          style={{
                            borderColor: field.value?.includes(item._id) ? 'rgb(59 130 246)' : 'rgb(229 231 235)'
                          }}
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
                          <div className="space-y-1 leading-none flex-1">
                            <FormLabel className="font-medium text-base">
                              {getLocalizedText(item.label, `Work Type ${item.key || item._id}`)}
                            </FormLabel>
                            {item.description && (
                              <FormDescription className="text-sm">
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
              <div className="grid grid-cols-1 gap-4">
                {expertiseAreas.map((item) => (
                  <FormField
                    key={item._id}
                    control={form.control}
                    name="workInfo.expertiseAreas"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={item._id}
                          className={cn(
                            "flex flex-row items-start gap-3 space-y-0 p-4 rounded-lg border-2 transition-all hover:bg-gray-50",
                            isRTL && "flex-row-reverse"
                          )}
                          style={{
                            borderColor: field.value?.includes(item._id) ? 'rgb(59 130 246)' : 'rgb(229 231 235)'
                          }}
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
                          <div className="space-y-1 leading-none flex-1">
                            <FormLabel className="font-medium text-base">
                              {getLocalizedText(item.label, `Expertise ${item.key || item._id}`)}
                            </FormLabel>
                            {item.description && (
                              <FormDescription className="text-sm">
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

        {/* Regional Communities */}
        <FormField
          control={form.control}
          name="workInfo.communityIds"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">
                  {content?.fieldLabels?.workInfo?.regionalCommunities || t("regionalCommunities")}
                </FormLabel>
                <FormDescription>
                  {content?.workInfoFieldHints?.communitiesDescription || t("regionalCommunitiesHint")}
                </FormDescription>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {communities.filter(c => c.type === 'REGIONAL').map((community) => (
                  <FormField
                    key={community.id}
                    control={form.control}
                    name="workInfo.communityIds"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={community.id}
                          className={cn(
                            "flex flex-row items-start gap-3 space-y-0 p-4 rounded-lg border-2 transition-all hover:bg-gray-50",
                            isRTL && "flex-row-reverse"
                          )}
                          style={{
                            borderColor: field.value?.includes(community.id) ? 'rgb(59 130 246)' : 'rgb(229 231 235)'
                          }}
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(community.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, community.id])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value: any) => value !== community.id
                                      )
                                    )
                              }}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none flex-1">
                            <FormLabel className="font-medium text-base">
                              {community.regionalName && REGIONAL_NAME_TO_TRANSLATION_KEY[community.regionalName]
                                ? tNav(`regions.${REGIONAL_NAME_TO_TRANSLATION_KEY[community.regionalName]}`)
                                : community.name}
                            </FormLabel>
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
        <div className="grid grid-cols-1 gap-4">
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

          {/* Fixed Social Links */}
          <div className="grid grid-cols-1 gap-4">
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

          {/* Other Social Links */}
          <div className="space-y-4">
            <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
              <FormLabel>{content?.fieldLabels?.workInfo?.otherLinks || "Other Professional Links"}</FormLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const currentLinks = form.getValues("workInfo.otherSocialLinks") || []
                  form.setValue("workInfo.otherSocialLinks", [...currentLinks, { platform: "", url: "" }])
                }}
                className="text-xs"
              >
                Add Link
              </Button>
            </div>

            {form.watch("workInfo.otherSocialLinks")?.map((_: {platform: string, url: string}, index: number) => (
              <div key={index} className={cn("flex gap-2 items-start", isRTL && "flex-row-reverse")}>
                <FormField
                  control={form.control}
                  name={`workInfo.otherSocialLinks.${index}.platform`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input {...field} placeholder="Platform (e.g., Twitter, GitHub)" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`workInfo.otherSocialLinks.${index}.url`}
                  render={({ field }) => (
                    <FormItem className="flex-[2]">
                      <FormControl>
                        <Input {...field} placeholder="https://..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const currentLinks = form.getValues("workInfo.otherSocialLinks") || []
                    form.setValue("workInfo.otherSocialLinks", currentLinks.filter((_: {platform: string, url: string}, i: number) => i !== index))
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </Button>
              </div>
            ))}

            {(!form.watch("workInfo.otherSocialLinks") || form.watch("workInfo.otherSocialLinks")?.length === 0) && (
              <p className="text-sm text-gray-500">
                {content?.fieldLabels?.workInfo?.otherLinksHint || "Add links to your professional profiles (Twitter, GitHub, Portfolio, etc.)"}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
