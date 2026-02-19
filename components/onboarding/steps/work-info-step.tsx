"use client"

import { useEffect, useCallback } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations, useLocale } from "next-intl"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { cn } from "@/lib/utils"
import { rtlLocales } from "@/i18n/routing"
import type { OnboardingData } from "../onboarding-container"

interface UserOption {
  key: string
  label?: string
  labelFallback?: string
  description?: string
  descriptionFallback?: string
}

interface OnboardingContent {
  workInfoTitle?: string
  workInfoDescription?: string
  navigationTexts?: {
    continue?: string
  }
}

// Base work info schema using string arrays for flexibility
const workInfoSchema = z.object({
  workTypes: z.array(z.string()).min(1, "Please select at least one work type"),
  expertiseAreas: z.array(z.string()).min(1, "Please select at least one expertise area"),
  organization: z.string().optional(),
  position: z.string().optional(),
  workBio: z.string().max(1000, "Work bio must be less than 1000 characters").optional(),
  personalWebsite: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  linkedinProfile: z.string().optional(),
  otherSocialLinks: z.array(z.object({
    platform: z.string().min(1, "Platform name is required"),
    url: z.string().url("Please enter a valid URL")
  })).default([])
})

// Form values will be inferred from schema

interface WorkInfoStepProps {
  data: OnboardingData
  updateDataAction: (data: Partial<OnboardingData>) => void
  onNextAction: () => void
  onPrev: () => void
  isFirst: boolean
  isLast: boolean
  content?: OnboardingContent
  workTypes?: UserOption[]
  expertiseAreas?: UserOption[]
  onValidationChange?: (isValid: boolean) => void
}

export function WorkInfoStep({
  data,
  updateDataAction,
  onNextAction,
  content,
  workTypes = [],
  expertiseAreas = [],
  onValidationChange
}: WorkInfoStepProps) {
  const t = useTranslations("onboarding.steps.workInfo")
  const locale = useLocale()
  const isRTL = rtlLocales.includes(locale)

  const form = useForm({
    resolver: zodResolver(workInfoSchema),
    defaultValues: {
      workTypes: data.workTypes,
      expertiseAreas: data.expertiseAreas,
      organization: data.organization,
      position: data.position,
      workBio: data.workBio,
      personalWebsite: data.personalWebsite,
      linkedinProfile: data.linkedinProfile,
      otherSocialLinks: data.otherSocialLinks
    }
  })

  // Use useWatch instead of watch subscription to prevent infinite loops
  const watchedValues = useWatch({
    control: form.control,
    defaultValue: {
      workTypes: data.workTypes,
      expertiseAreas: data.expertiseAreas,
      organization: data.organization,
      position: data.position,
      workBio: data.workBio,
      personalWebsite: data.personalWebsite,
      linkedinProfile: data.linkedinProfile,
      otherSocialLinks: data.otherSocialLinks
    }
  })

  // Memoize the update function to prevent infinite loops
  const memoizedUpdateDataAction = useCallback((values: Partial<OnboardingData>) => {
    updateDataAction(values)
  }, [updateDataAction])

  // Update parent data when watched values change
  useEffect(() => {
    if (watchedValues) {
      memoizedUpdateDataAction(watchedValues as Partial<OnboardingData>)
    }
  }, [watchedValues, memoizedUpdateDataAction])

  // Memoize validation change callback
  const memoizedValidationChange = useCallback((isValid: boolean) => {
    if (onValidationChange) {
      onValidationChange(isValid)
    }
  }, [onValidationChange])

  // Notify parent about validation state using specific properties
  useEffect(() => {
    memoizedValidationChange(form.formState.isValid)
  }, [form.formState.isValid, memoizedValidationChange])

  // Use Sanity work types if available, otherwise fall back to translations
  const workTypeOptions = workTypes.length > 0
    ? workTypes.map(wt => ({
        value: wt.key,
        label: wt.labelFallback || wt.label || wt.key
      }))
    : [
        { value: "RESEARCH", label: t("workTypes.research") },
        { value: "POLICY", label: t("workTypes.policy") },
        { value: "LIVED_EXPERIENCE_EXPERT", label: t("workTypes.livedExperience") },
        { value: "NGO", label: t("workTypes.ngo") },
        { value: "COMMUNITY_ORGANIZATION", label: t("workTypes.communityOrg") },
        { value: "EDUCATION_TEACHING", label: t("workTypes.education") }
      ]

  // Use Sanity expertise areas if available, otherwise fall back to translations
  const expertiseOptions = expertiseAreas.length > 0
    ? expertiseAreas.map(ea => ({
        value: ea.key,
        label: ea.labelFallback || ea.label || ea.key
      }))
    : [
        { value: "CLIMATE_CHANGE", label: t("expertise.climate") },
        { value: "MENTAL_HEALTH", label: t("expertise.mentalHealth") },
        { value: "HEALTH", label: t("expertise.health") },
        { value: "EDUCATION", label: t("expertise.education") },
        { value: "SOCIAL_JUSTICE", label: t("expertise.socialJustice") }
      ]

  return (
    <div className={cn("space-y-6", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
      <div className="mb-6">
        <p className="text-muted-foreground">
          {content?.workInfoDescription || t("description")}
        </p>
      </div>

      <Form {...form}>
        <div className="space-y-6">
          {/* Work Types */}
          <FormField
            control={form.control}
            name="workTypes"
            render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel className="text-base flex items-center gap-1">
                    {t("workTypesLabel")}
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormDescription>{t("workTypesDescription")}</FormDescription>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {workTypeOptions.map((option) => (
                    <FormField
                      key={option.value}
                      control={form.control}
                      name="workTypes"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={option.value}
                            className={cn(
                              "flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 hover:bg-muted/50 transition-colors",
                              isRTL && "flex-row-reverse space-x-reverse"
                            )}
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(option.value)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, option.value])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value: string) => value !== option.value
                                        )
                                      )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              {option.label}
                            </FormLabel>
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
            name="expertiseAreas"
            render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel className="text-base flex items-center gap-1">
                    {t("expertiseLabel")}
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormDescription>{t("expertiseDescription")}</FormDescription>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {expertiseOptions.map((option) => (
                    <FormField
                      key={option.value}
                      control={form.control}
                      name="expertiseAreas"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={option.value}
                            className={cn(
                              "flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 hover:bg-muted/50 transition-colors",
                              isRTL && "flex-row-reverse space-x-reverse"
                            )}
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(option.value)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, option.value])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value: string) => value !== option.value
                                        )
                                      )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              {option.label}
                            </FormLabel>
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

          {/* Organization and Position */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="organization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("organization")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t("organizationPlaceholder")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("position")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t("positionPlaceholder")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Work Bio */}
          <FormField
            control={form.control}
            name="workBio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("workBio")}</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={4} placeholder={t("workBioPlaceholder")} />
                </FormControl>
                <FormDescription>
                  {t("workBioHint")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Social Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t("socialLinks")}</h3>
            <p className="text-sm text-muted-foreground">{t("socialLinksDescription")}</p>

            <FormField
              control={form.control}
              name="personalWebsite"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("personalWebsite")}</FormLabel>
                  <FormControl>
                    <Input {...field} type="url" placeholder="https://example.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="linkedinProfile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("linkedin")}</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">linkedin.com/in/</span>
                      <Input {...field} placeholder="your-profile" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Other Social Links */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>Other Social Links</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentLinks = form.getValues("otherSocialLinks") || []
                    form.setValue("otherSocialLinks", [...currentLinks, { platform: "", url: "" }])
                  }}
                >
                  Add Link
                </Button>
              </div>

              {form.watch("otherSocialLinks")?.map((_: {platform: string, url: string}, index: number) => (
                <div key={index} className="flex gap-2 items-start">
                  <FormField
                    control={form.control}
                    name={`otherSocialLinks.${index}.platform`}
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
                    name={`otherSocialLinks.${index}.url`}
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
                      const currentLinks = form.getValues("otherSocialLinks") || []
                      form.setValue("otherSocialLinks", currentLinks.filter((_: {platform: string, url: string}, i: number) => i !== index))
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>

        </div>
      </Form>
    </div>
  )
}
