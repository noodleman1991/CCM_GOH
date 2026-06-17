"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "@/i18n/navigation"
import { useTranslations, useLocale } from "next-intl"
import { toast } from "sonner"
import { Loader2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FilterChip } from "@/components/ui/filter-chip"
import { getLocalizedText } from "@/lib/localization-utils"
import { cn } from "@/lib/utils"
import { heading } from "@/lib/design-tokens"
import { livedExperienceSubmissionSchema } from "@/lib/validation/lived-experience"
import type { z } from "zod"

// Use the schema's INPUT type for the form (fields with .default are optional
// on input), avoiding the zodResolver input/output generics mismatch.
type LEFormValues = z.input<typeof livedExperienceSubmissionSchema>

type Tag = { _id: string; label: any; value?: { current: string } }
type Community = { _id: string; name: any; slug?: { current: string } }

export function LivedExperienceForm({
  availableTags,
  regionalCommunities,
}: {
  availableTags: Tag[]
  regionalCommunities: Community[]
}) {
  const t = useTranslations("livedExperienceSubmission")
  const locale = useLocale() as "en" | "es" | "fr" | "ar"
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<LEFormValues>({
    resolver: zodResolver(livedExperienceSubmissionSchema),
    defaultValues: {
      title: "",
      description: "",
      issue: "",
      personContext: "",
      videoLink: "",
      regionalCommunityId: "",
      tagIds: [],
      language: locale,
    },
  })

  const selectedTags = form.watch("tagIds") || []
  const toggleTag = (id: string) => {
    const next = selectedTags.includes(id)
      ? selectedTags.filter((t) => t !== id)
      : selectedTags.length < 6
        ? [...selectedTags, id]
        : selectedTags
    form.setValue("tagIds", next, { shouldDirty: true })
  }

  async function onSubmit(values: LEFormValues) {
    setSubmitting(true)
    try {
      const res = await fetch("/api/lived-experiences/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, language: locale }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Submission failed")
      }
      toast.success(t("success"))
      router.push("/lived-experiences")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Submission failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className={cn("font-bold font-heading text-ccm-midnight text-balance", heading("lg"))}>{t("pageTitle")}</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">{t("pageDescription")}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("story.title")}</CardTitle>
              <CardDescription>{t("story.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.title")}</FormLabel>
                  <FormControl><Input {...field} placeholder={t("fields.titlePlaceholder")} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="videoLink" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.videoLink")}</FormLabel>
                  <FormControl><Input {...field} placeholder="https://youtube.com/watch?v=…" /></FormControl>
                  <FormDescription>{t("fields.videoLinkHelp")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.description")}</FormLabel>
                  <FormControl><Textarea {...field} rows={4} placeholder={t("fields.descriptionPlaceholder")} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="issue" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.issue")}</FormLabel>
                  <FormControl><Textarea {...field} rows={2} placeholder={t("fields.issuePlaceholder")} /></FormControl>
                  <FormDescription>{t("fields.issueHelp")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="personContext" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.personContext")}</FormLabel>
                  <FormControl><Textarea {...field} value={field.value || ""} rows={2} placeholder={t("fields.personContextPlaceholder")} /></FormControl>
                  <FormDescription>{t("fields.personContextHelp")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("context.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="regionalCommunityId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.region")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder={t("fields.regionPlaceholder")} /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {regionalCommunities.map((c) => (
                        <SelectItem key={c._id} value={c._id}>{getLocalizedText(c.name, locale, "")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormItem>
                <FormLabel>{t("fields.tags")}</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <FilterChip
                      key={tag._id}
                      label={getLocalizedText(tag.label, locale, "")}
                      active={selectedTags.includes(tag._id)}
                      onClick={() => toggleTag(tag._id)}
                    />
                  ))}
                </div>
                <FormDescription>{t("fields.tagsHelp")}</FormDescription>
              </FormItem>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Send className="me-2 h-4 w-4" />}
              {t("submit")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
