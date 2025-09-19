"use client"

import { useTranslations, useLocale } from "next-intl"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, User, Briefcase, FileText, Shield, Calendar, ExternalLink } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { rtlLocales } from "@/i18n/routing"
import type { OnboardingData } from "../onboarding-container"

interface ReviewStepProps {
  data: OnboardingData
  updateData?: (data: Partial<OnboardingData>) => void
  updateDataAction?: (data: Partial<OnboardingData>) => void
  onNext?: () => void
  onNextAction?: () => void
  onPrev: () => void
  isFirst: boolean
  isLast: boolean
  isSubmitting: boolean
  setIsSubmittingAction?: (submitting: boolean) => void
  setIsSubmitting?: (submitting: boolean) => void
}

export function ReviewStep({ data }: ReviewStepProps) {
  const t = useTranslations("onboarding.steps.review")
  const tCommon = useTranslations("onboarding.steps")
  const locale = useLocale()
  const isRTL = rtlLocales.includes(locale)

  const formatDateRange = (startDate: string, endDate?: string, isOngoing?: boolean) => {
    const start = format(new Date(startDate), "MMM yyyy")
    if (isOngoing) return `${start} - Present`
    if (!endDate) return start
    const end = format(new Date(endDate), "MMM yyyy")
    return start === end ? start : `${start} - ${end}`
  }

  const getVisibilityLabel = (visibility: string) => {
    switch (visibility) {
      case "PUBLIC": return t("visibility.public")
      case "MEMBERS": return t("visibility.members")
      case "PRIVATE": return t("visibility.private")
      default: return visibility
    }
  }

  const getLanguageLabel = (lang: string) => {
    switch (lang) {
      case "EN": return "English"
      case "ES": return "Español"
      case "FR": return "Français"
      case "AR": return "العربية"
      default: return lang
    }
  }

  return (
    <div className={cn("space-y-6", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-2">{t("title")}</h2>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <User className="h-5 w-5" />
            {tCommon("basicInfo.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">{t("fields.name")}</p>
              <p className="text-muted-foreground">{data.firstName} {data.lastName}</p>
            </div>
            <div>
              <p className="text-sm font-medium">{t("fields.username")}</p>
              <p className="text-muted-foreground">@{data.username}</p>
            </div>
            <div>
              <p className="text-sm font-medium">{t("fields.location")}</p>
              <p className="text-muted-foreground">{data.city}, {data.country}</p>
            </div>
            <div>
              <p className="text-sm font-medium">{t("fields.language")}</p>
              <p className="text-muted-foreground">{getLanguageLabel(data.preferredLanguage)}</p>
            </div>
          </div>
          {data.bio && (
            <div>
              <p className="text-sm font-medium">{t("fields.bio")}</p>
              <p className="text-muted-foreground">{data.bio}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Work Information */}
      <Card>
        <CardHeader>
          <CardTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <Briefcase className="h-5 w-5" />
            {tCommon("workInfo.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">{t("fields.workTypes")}</p>
            <div className="flex flex-wrap gap-2">
              {data.workTypes.map((type) => (
                <Badge key={type} variant="secondary">{type.replace(/_/g, ' ')}</Badge>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">{t("fields.expertise")}</p>
            <div className="flex flex-wrap gap-2">
              {data.expertiseAreas.map((area) => (
                <Badge key={area} variant="outline">{area.replace(/_/g, ' ')}</Badge>
              ))}
            </div>
          </div>

          {(data.organization || data.position) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.organization && (
                <div>
                  <p className="text-sm font-medium">{t("fields.organization")}</p>
                  <p className="text-muted-foreground">{data.organization}</p>
                </div>
              )}
              {data.position && (
                <div>
                  <p className="text-sm font-medium">{t("fields.position")}</p>
                  <p className="text-muted-foreground">{data.position}</p>
                </div>
              )}
            </div>
          )}

          {data.workBio && (
            <div>
              <p className="text-sm font-medium">{t("fields.workBio")}</p>
              <p className="text-muted-foreground">{data.workBio}</p>
            </div>
          )}

          {/* Social Links */}
          {(data.personalWebsite || data.linkedinProfile || data.twitterHandle) && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">{t("fields.socialLinks")}</p>
                <div className="space-y-1">
                  {data.personalWebsite && (
                    <a
                      href={data.personalWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn("flex items-center gap-2 text-sm text-primary hover:underline", isRTL && "flex-row-reverse")}
                    >
                      <ExternalLink className="h-3 w-3" />
                      {t("fields.website")}
                    </a>
                  )}
                  {data.linkedinProfile && (
                    <p className="text-sm text-muted-foreground">
                      LinkedIn: linkedin.com/in/{data.linkedinProfile}
                    </p>
                  )}
                  {data.twitterHandle && (
                    <p className="text-sm text-muted-foreground">
                      Twitter: twitter.com/{data.twitterHandle}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Recent Work */}
      {data.recentWork.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <FileText className="h-5 w-5" />
              {tCommon("recentWork.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentWork.map((work, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{work.title}</h4>
                    <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", isRTL && "flex-row-reverse")}>
                      <Calendar className="h-3 w-3" />
                      <span>{formatDateRange(work.startDate, work.endDate, work.isOngoing)}</span>
                      {work.isOngoing && (
                        <Badge variant="secondary" className="text-xs">
                          {t("ongoing")}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{work.description}</p>
                  {work.link && (
                    <a
                      href={work.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn("inline-flex items-center gap-1 text-xs text-primary hover:underline", isRTL && "flex-row-reverse")}
                    >
                      <ExternalLink className="h-3 w-3" />
                      {t("viewProject")}
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
            <Shield className="h-5 w-5" />
            {tCommon("privacy.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">{t("fields.searchable")}</p>
              <p className="text-muted-foreground">
                {data.isSearchable ? t("yes") : t("no")}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">{t("fields.visibility")}</p>
              <p className="text-muted-foreground">{getVisibilityLabel(data.profileVisibility)}</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">{t("fields.shownInProfile")}</p>
            <div className="flex flex-wrap gap-2">
              {data.showEmail && <Badge variant="outline">{t("email")}</Badge>}
              {data.showPhoneNumber && <Badge variant="outline">{t("phone")}</Badge>}
              {data.showWorkDetails && <Badge variant="outline">{t("workDetails")}</Badge>}
              {data.showSocialLinks && <Badge variant="outline">{t("socialLinks")}</Badge>}
              {data.showLocation && <Badge variant="outline">{t("location")}</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ready Message */}
      <div className="text-center pt-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className={cn("flex items-center justify-center gap-3 mb-4", isRTL && "flex-row-reverse")}>
              <CheckCircle2 className="h-6 w-6 text-primary" />
              <h3 className="text-lg font-semibold">{t("readyTitle")}</h3>
            </div>
            <p className="text-muted-foreground">{t("readyDescription")}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
