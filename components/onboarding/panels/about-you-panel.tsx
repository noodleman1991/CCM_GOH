"use client"

import { useTranslations, useLocale } from "next-intl"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CharCounter } from "@/components/ui/char-counter"
import { ChoiceChips } from "@/components/profile/choice-chips"
import { useCollaboration } from "@/hooks/use-collaboration"
import { cn } from "@/lib/utils"
import { rtlLocales } from "@/i18n/routing"
import { LIMITS } from "@/lib/validation/limits"
import type { AboutYouContent } from "@/lib/content/onboarding-about-you"
import type { OnboardingContent, OnboardingForm } from "../types"

/** How many choices a member can tick in each list. */
const MAX_CHOICES = 5

interface AboutYouPanelProps {
  form: OnboardingForm
  content?: OnboardingContent | null
  aboutYou?: AboutYouContent | null
  prompts?: { id: string; prompt: string }[]
}

/**
 * Step 3: About you (dashboard/profile spec D4) — the words a profile now
 * shows. Every field is optional and the step can be skipped; its words and
 * choices come from Settings → Onboarding → Step 3: About you.
 */
export function AboutYouPanel({ form, content, aboutYou, prompts = [] }: AboutYouPanelProps) {
  const t = useTranslations("onboarding.steps.aboutYou")
  const tBasic = useTranslations("onboarding.steps.basicInfo")
  const tOpen = useTranslations("collaborate.openCard")
  const access = useCollaboration()
  const locale = useLocale()
  const isRTL = rtlLocales.includes(locale)
  const labels = content?.fieldLabels?.basicInfo
  const hints = content?.basicInfoFieldHints

  return (
    <div className={cn("space-y-5", "text-start [&_input]:text-start [&_textarea]:text-start")} dir={isRTL ? "rtl" : "ltr"}>
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-foreground mb-2">{aboutYou?.title || t("title")}</h2>
        <p className="text-lg text-muted-foreground">{aboutYou?.description || t("description")}</p>
      </div>

      <div className="space-y-6">
        {/* Headline — a one-line self-description */}
        <FormField
          control={form.control}
          name="aboutYou.headline"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{labels?.headline || tBasic("headline")}</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ""} placeholder={labels?.headlinePlaceholder || tBasic("headlinePlaceholder")} maxLength={LIMITS.profile.headline} />
              </FormControl>
              <CharCounter value={field.value} max={LIMITS.profile.headline} />
              <FormDescription>{hints?.headlineHint || tBasic("headlineHint")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* What brought you here */}
        <FormField
          control={form.control}
          name="aboutYou.motivation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{labels?.motivation || tBasic("motivation")}</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value || ""} rows={3} placeholder={labels?.motivationPlaceholder || tBasic("motivationPlaceholder")} maxLength={LIMITS.profile.motivation} />
              </FormControl>
              <CharCounter value={field.value} max={LIMITS.profile.motivation} />
              <FormDescription>{hints?.motivationHint || tBasic("motivationHint")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {aboutYou && (
          <>
            <FormField
              control={form.control}
              name="aboutYou.lookingFor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("lookingFor")}</FormLabel>
                  <FormDescription>{t("lookingForHint", { max: MAX_CHOICES })}</FormDescription>
                  <ChoiceChips label={t("lookingFor")} options={aboutYou.lookingFor} value={field.value ?? []} onChange={field.onChange} max={MAX_CHOICES} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="aboutYou.focusTopics"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("focusTopics")}</FormLabel>
                  <FormDescription>{t("focusTopicsHint", { max: MAX_CHOICES })}</FormDescription>
                  <ChoiceChips label={t("focusTopics")} options={aboutYou.focusTopics} value={field.value ?? []} onChange={field.onChange} max={MAX_CHOICES} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {/* One prompt — pick a question, answer it in your own words */}
        {prompts.length > 0 && (
          <div className="space-y-3 rounded-xl border border-ccm-midnight/10 p-4">
            <p className="font-semibold text-foreground">{aboutYou?.promptIntro || t("promptIntro")}</p>
            <FormField
              control={form.control}
              name="aboutYou.promptId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">{t("promptQuestion")}</FormLabel>
                  <Select value={field.value || undefined} onValueChange={field.onChange} dir={isRTL ? "rtl" : "ltr"}>
                    <FormControl>
                      <SelectTrigger className="min-h-11 w-full">
                        <SelectValue placeholder={t("promptPlaceholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {prompts.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.prompt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            {form.watch("aboutYou.promptId") && (
              <FormField
                control={form.control}
                name="aboutYou.promptAnswer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("promptAnswer")}</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} rows={3} maxLength={LIMITS.profile.promptAnswer} />
                    </FormControl>
                    <CharCounter value={field.value} max={LIMITS.profile.promptAnswer} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        )}

        {/* Open to collaborate (opening-collaboration spec C4) — only while the team has it on */}
        {access.people && (
          <div className="space-y-3 rounded-xl border border-ccm-midnight/10 p-4">
            <FormField
              control={form.control}
              name="aboutYou.openToCollaboration"
              render={({ field }) => (
                <FormItem className="flex items-start gap-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value === true} onCheckedChange={(v) => field.onChange(v === true)} />
                  </FormControl>
                  <div className="space-y-1">
                    <FormLabel className="font-semibold">{tOpen("title")}</FormLabel>
                    <FormDescription>{tOpen("body")}</FormDescription>
                  </div>
                </FormItem>
              )}
            />
            {form.watch("aboutYou.openToCollaboration") && (
              <FormField
                control={form.control}
                name="aboutYou.collaborationInterests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tOpen("interestsLabel")}</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value ?? ""} maxLength={LIMITS.profile.collaborationInterests} rows={2} placeholder={tOpen("interestsPlaceholder")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        )}

        <p className="text-sm text-muted-foreground">{t("skipHint")}</p>
      </div>
    </div>
  )
}
