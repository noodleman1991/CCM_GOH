"use client"

import React from "react"
import { UseFormReturn } from "react-hook-form"
import { useTranslations, useLocale } from "next-intl"
import { format } from "date-fns"
import { User, Briefcase, Globe, Shield, Calendar, ExternalLink } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProfilePromptsEditor } from "@/components/profile/profile-prompts-editor"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { rtlLocales } from "@/i18n/routing"
import type { OnboardingFormData } from "@/lib/schemas/onboarding-schema"

interface ReviewPanelProps {
  form: any
  content?: any
  workTypes?: Array<{ _id: string; label: any }>
  expertiseAreas?: Array<{ _id: string; label: any }>
  isSubmitting?: boolean
}

export function ReviewPanel({ form, content, workTypes = [], expertiseAreas = [] }: ReviewPanelProps) {
  const t = useTranslations("onboarding.steps.review")
  const tPrompts = useTranslations("profile.prompts")
  const locale = useLocale()
  const isRTL = rtlLocales.includes(locale)

  const formData = form.watch()

  const getLocalizedText = (labelArray: any, fallback: string) => {
    if (!labelArray) return fallback
    if (typeof labelArray === 'string') return labelArray

    // Sanity returns: [{_key: 'en', value: 'Label'}, {_key: 'es', value: 'Etiqueta'}]
    if (Array.isArray(labelArray)) {
      const localizedItem = labelArray.find((item: any) => item._key === locale)
      if (localizedItem?.value) return localizedItem.value

      const enItem = labelArray.find((item: any) => item._key === 'en')
      if (enItem?.value) return enItem.value

      if (labelArray[0]?.value) return labelArray[0].value
    }

    return fallback
  }

  const getWorkTypeTitle = (id: any) => {
    const workType = workTypes.find((wt: any) => wt._id === id)
    return workType ? getLocalizedText(workType.label, `Work Type ${id}`) : id
  }

  const getExpertiseAreaTitle = (id: any) => {
    const area = expertiseAreas.find((ea: any) => ea._id === id)
    return area ? getLocalizedText(area.label, `Expertise ${id}`) : id
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM yyyy")
    } catch {
      return dateString
    }
  }

  const getVisibilityText = (visibility: string) => {
    switch (visibility) {
      case "PUBLIC": return t("visibility.public")
      case "MEMBERS": return t("visibility.members")
      case "PRIVATE": return t("visibility.private")
      default: return visibility
    }
  }

  const languageMap: Record<string, string> = {
    "EN": "English",
    "ES": "Español",
    "FR": "Français",
    "AR": "العربية"
  }

  return (
    <div className={cn("space-y-5", "text-start")} dir={isRTL ? "rtl" : "ltr"}>
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {content?.reviewTitle || t("title")}
        </h2>
        <p className="text-lg text-muted-foreground">
          {content?.reviewDescription || t("description")}
        </p>
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <User className="h-5 w-5 text-primary" />
              {content?.reviewFieldLabels?.basicInfo || t("basicInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">{content?.reviewFieldLabels?.name || t("name")}</p>
                <p className="text-foreground">
                  {formData.basicInfo.firstName} {formData.basicInfo.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{content?.reviewFieldLabels?.username || t("username")}</p>
                <p className="text-foreground">{formData.basicInfo.username}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{content?.reviewFieldLabels?.location || t("location")}</p>
                <p className="text-foreground">
                  {formData.basicInfo.city}, {formData.basicInfo.country}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{content?.reviewFieldLabels?.language || t("language")}</p>
                <p className="text-foreground">
                  {languageMap[formData.basicInfo.preferredLanguage] || formData.basicInfo.preferredLanguage}
                </p>
              </div>
              {formData.basicInfo.ageGroup && (
                <div>
                  <p className="text-sm font-medium text-gray-500">{content?.reviewFieldLabels?.ageGroup || t("ageGroup")}</p>
                  <p className="text-foreground">
                    {formData.basicInfo.ageGroup === "UNDER_18" ? t("under18") : t("above18")}
                  </p>
                </div>
              )}
            </div>
            {formData.basicInfo.bio && (
              <div>
                <p className="text-sm font-medium text-gray-500">{content?.reviewFieldLabels?.bio || t("bio")}</p>
                <p className="text-foreground">{formData.basicInfo.bio}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Work Information */}
        <Card>
          <CardHeader>
            <CardTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <Briefcase className="h-5 w-5 text-primary" />
              {content?.reviewFieldLabels?.workInfo || t("workInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Work Types */}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-2">{content?.reviewFieldLabels?.workTypes || t("workTypes")}</p>
              <div className={cn("flex flex-wrap gap-2", isRTL && "flex-row-reverse")}>
                {[...new Set(formData.workInfo.workTypes)]
                  .map((id: any, index: number) => {
                    const workType = workTypes.find((wt: any) => wt._id === id)
                    if (!workType) return null
                    const title = getLocalizedText(workType.label, "")
                    if (!title) return null
                    return { id, title, index }
                  })
                  .filter(Boolean)
                  .map((item: any) => (
                    <Badge key={`${item.id}-${item.index}`} variant="secondary">
                      {item.title}
                    </Badge>
                  ))
                }
              </div>
            </div>

            {/* Expertise Areas */}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-2">{content?.reviewFieldLabels?.expertiseAreas || t("expertiseAreas")}</p>
              <div className={cn("flex flex-wrap gap-2", isRTL && "flex-row-reverse")}>
                {[...new Set(formData.workInfo.expertiseAreas)]
                  .map((id: any, index: number) => {
                    const area = expertiseAreas.find((ea: any) => ea._id === id)
                    if (!area) return null
                    const title = getLocalizedText(area.label, "")
                    if (!title) return null
                    return { id, title, index }
                  })
                  .filter(Boolean)
                  .map((item: any) => (
                    <Badge key={`${item.id}-${item.index}`} variant="outline">
                      {item.title}
                    </Badge>
                  ))
                }
              </div>
            </div>

            {/* Organization & Position */}
            {(formData.workInfo.organization || formData.workInfo.position) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.workInfo.organization && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">{content?.reviewFieldLabels?.organization || t("organization")}</p>
                    <p className="text-foreground">{formData.workInfo.organization}</p>
                  </div>
                )}
                {formData.workInfo.position && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">{content?.reviewFieldLabels?.position || t("position")}</p>
                    <p className="text-foreground">{formData.workInfo.position}</p>
                  </div>
                )}
              </div>
            )}

            {/* Work Bio */}
            {formData.workInfo.workBio && (
              <div>
                <p className="text-sm font-medium text-gray-500">{content?.reviewFieldLabels?.workBio || t("workBio")}</p>
                <p className="text-foreground">{formData.workInfo.workBio}</p>
              </div>
            )}

            {/* Social Links */}
            {(formData.workInfo.linkedinProfile || formData.workInfo.personalWebsite ||
              (formData.workInfo.otherSocialLinks && formData.workInfo.otherSocialLinks.length > 0)) && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">{content?.reviewFieldLabels?.socialLinks || t("socialLinks")}</p>
                <div className="space-y-2">
                  {formData.workInfo.linkedinProfile && (
                    <a
                      href={formData.workInfo.linkedinProfile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn("flex items-center gap-2 text-primary hover:underline", isRTL && "flex-row-reverse")}
                    >
                      <ExternalLink className="h-4 w-4" />
                      LinkedIn
                    </a>
                  )}
                  {formData.workInfo.personalWebsite && (
                    <a
                      href={formData.workInfo.personalWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn("flex items-center gap-2 text-primary hover:underline", isRTL && "flex-row-reverse")}
                    >
                      <ExternalLink className="h-4 w-4" />
                      Website
                    </a>
                  )}
                  {formData.workInfo.otherSocialLinks?.map((link: {platform: string, url: string}, index: number) => (
                    link.platform && link.url && (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn("flex items-center gap-2 text-primary hover:underline", isRTL && "flex-row-reverse")}
                      >
                        <ExternalLink className="h-4 w-4" />
                        {link.platform}
                      </a>
                    )
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Work */}
        {formData.recentWork && formData.recentWork.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <Globe className="h-5 w-5 text-primary" />
                {content?.reviewFieldLabels?.recentWork || t("recentWork")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {formData.recentWork.map((work: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className={cn("flex items-start justify-between mb-2", isRTL && "flex-row-reverse")}>
                      <h4 className="font-medium">{work.title}</h4>
                      <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", isRTL && "flex-row-reverse")}>
                        <Calendar className="h-4 w-4" />
                        <span>
                          {formatDate(work.startDate)} - {work.isOngoing ? (content?.reviewFieldLabels?.ongoing || t("ongoing")) : formatDate(work.endDate || "")}
                        </span>
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-2">{work.description}</p>
                    {work.link && (
                      <a
                        href={work.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn("inline-flex items-center gap-1 text-primary hover:underline", isRTL && "flex-row-reverse")}
                      >
                        <ExternalLink className="h-4 w-4" />
                        {content?.reviewFieldLabels?.viewProject || t("viewProject")}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <Shield className="h-5 w-5 text-primary" />
              {content?.reviewFieldLabels?.privacySettings || t("privacySettings")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">{content?.reviewFieldLabels?.profileVisibility || t("profileVisibility")}</p>
                <p className="text-foreground">{getVisibilityText(formData.privacy.profileVisibility)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{content?.reviewFieldLabels?.searchable || t("searchable")}</p>
                <p className="text-foreground">{formData.privacy.isSearchable ? (content?.reviewFieldLabels?.yes || t("yes")) : (content?.reviewFieldLabels?.no || t("no"))}</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  formData.privacy.showEmail ? "bg-green-500" : "bg-gray-300"
                )} />
                <span className="text-sm">{content?.reviewFieldLabels?.showEmail || t("showEmail")}</span>
              </div>
              <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  formData.privacy.showPhoneNumber ? "bg-green-500" : "bg-gray-300"
                )} />
                <span className="text-sm">{content?.reviewFieldLabels?.showPhone || t("showPhone")}</span>
              </div>
              <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  formData.privacy.showWorkDetails ? "bg-green-500" : "bg-gray-300"
                )} />
                <span className="text-sm">{content?.reviewFieldLabels?.showWork || t("showWork")}</span>
              </div>
              <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  formData.privacy.showSocialLinks ? "bg-green-500" : "bg-gray-300"
                )} />
                <span className="text-sm">{content?.reviewFieldLabels?.showSocial || t("showSocial")}</span>
              </div>
              <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  formData.privacy.showLocation ? "bg-green-500" : "bg-gray-300"
                )} />
                <span className="text-sm">{content?.reviewFieldLabels?.showLocation || t("showLocation")}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile prompts (K5) — an inviting last step; saved independently. */}
      <Card>
        <CardHeader>
          <CardTitle>{tPrompts("title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{tPrompts("description")}</p>
          <ProfilePromptsEditor />
        </CardContent>
      </Card>

      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-xl space-y-2">
        <h3 className="font-semibold text-foreground">
          {content?.reviewFieldLabels?.readyToSubmit || t("readyToSubmit")}
        </h3>
        <p className="text-muted-foreground">
          {content?.reviewFieldLabels?.submissionNote || t("submissionNote")}
        </p>
        {/* No separate confirmation checkbox: pressing the Complete button below
            IS the confirmation. The review above is the user's chance to check. */}
        <p className="text-xs text-muted-foreground">
          You can always update your profile from the dashboard.
        </p>
      </div>
    </div>
  )
}