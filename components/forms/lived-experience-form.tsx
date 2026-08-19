"use client"

import { useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "@/i18n/navigation"
import { useTranslations, useLocale } from "next-intl"
import { toast } from "sonner"
import { CheckCircle2, Loader2, Send, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FilterChip } from "@/components/ui/filter-chip"
import PortableTextEditor from "@/components/forms/portable-text-editor"
import { ReviewContext } from "@/components/forms/review-context"
import { INSERT_SLASH_MENU_ITEMS } from "@/components/forms/editor/slash-menu-list"
import { getLocalizedText } from "@/lib/localization-utils"
import { cn } from "@/lib/utils"
import { heading } from "@/lib/design-tokens"
import {
  makeLivedExperienceSchema,
  livedExperienceSubmissionSchema,
  LE_VIDEO_MAX_BYTES,
  LE_VIDEO_MIME_TYPES,
} from "@/lib/validation/lived-experience"
import type { EditableLivedExperience } from "@/lib/lived-experiences/edit"
import type { LocalizedString } from "@/types/case-study"
import { youtubeId } from "@/lib/youtube"
import { vimeoId } from "@/lib/vimeo"
import { useMemo } from "react"
import type { z } from "zod"

// Use the schema's INPUT type for the form (fields with .default are optional
// on input), avoiding the zodResolver input/output generics mismatch.
type LEFormValues = z.input<typeof livedExperienceSubmissionSchema>

type Tag = { _id: string; label: LocalizedString | string; value?: { current: string } }
type Community = { _id: string; name: LocalizedString | string; slug?: { current: string } }

export function LivedExperienceForm({
  availableTags,
  regionalCommunities,
  workspaceId,
  editDoc,
}: {
  availableTags: Tag[]
  regionalCommunities: Community[]
  workspaceId?: string | null
  /** X7 ?edit= — reopen an existing draft/pending doc; resubmits in place. */
  editDoc?: EditableLivedExperience | null
}) {
  const t = useTranslations("livedExperienceSubmission")
  const locale = useLocale() as "en" | "es" | "fr" | "ar"
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  // Direct-upload state (the file travels outside react-hook-form, as
  // multipart alongside the JSON payload — the case-study image pattern).
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Localized schema so validation errors show in the user's language.
  const schema = useMemo(
    () =>
      makeLivedExperienceSchema({
        titleMin: t("validation.titleMin"),
        descriptionMin: t("validation.descriptionMin"),
        issueMin: t("validation.issueMin"),
        videoUrl: t("validation.videoUrl"),
        youtubeUrl: t("validation.youtubeUrl"),
        vimeoUrl: t("validation.vimeoUrl"),
      }),
    [t]
  )

  const form = useForm<LEFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: editDoc?.title ?? "",
      description: editDoc?.description ?? "",
      issue: editDoc?.issue ?? "",
      personContext: editDoc?.personContext ?? "",
      videoSource: editDoc?.videoSource ?? "youtube",
      videoLink: editDoc?.videoLink ?? "",
      body: editDoc?.body ?? [],
      regionalCommunityId: editDoc?.regionalCommunityId ?? "",
      tagIds: editDoc?.tagIds ?? [],
      // Edit keeps the original submission language so localized fields
      // re-wrap under the same key regardless of the UI locale.
      language: editDoc?.language ?? locale,
    },
  })

  const videoSource = form.watch("videoSource") || "youtube"
  const videoLink = form.watch("videoLink") || ""
  const youtubeVideoId = videoSource === "youtube" ? youtubeId(videoLink) : null
  const vimeoVideoId = videoSource === "vimeo" ? vimeoId(videoLink) : null

  const onSelectFile = (file: File | null) => {
    setFileError(null)
    if (!file) return
    if (!LE_VIDEO_MIME_TYPES.includes(file.type)) {
      setFileError(t("video.fileWrongType"))
      return
    }
    if (file.size > LE_VIDEO_MAX_BYTES) {
      setFileError(t("video.fileTooLarge"))
      return
    }
    setVideoFile(file)
  }

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
    // In edit mode a missing file keeps the existing upload.
    if (values.videoSource === "upload" && !videoFile && !editDoc?.hasVideoFile) {
      setFileError(t("video.fileRequired"))
      return
    }
    setSubmitting(true)
    try {
      // Multipart: JSON payload in `data` + the optional video file — the
      // same shape the case-study submit route uses for its image.
      const formData = new FormData()
      formData.append(
        "data",
        JSON.stringify({
          ...values,
          language: editDoc?.language ?? locale,
          ...(workspaceId ? { collaborationId: workspaceId } : {}),
          ...(editDoc ? { editId: editDoc._sanityId } : {}),
        })
      )
      if (values.videoSource === "upload" && videoFile) {
        formData.append("video", videoFile)
      }
      const res = await fetch("/api/lived-experiences/submit", {
        method: "POST",
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || t("submitError"))
      }
      toast.success(t("success"))
      router.push("/lived-experiences")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("submitError"))
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

      {editDoc && <ReviewContext status={editDoc.status} reviewNotes={editDoc.reviewNotes} />}

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

              {/* Video — three sources: direct upload / YouTube / Vimeo. */}
              <div className="space-y-2">
                <FormLabel>{t("fields.videoLink")}</FormLabel>
                <Tabs
                  value={videoSource}
                  onValueChange={(v) => {
                    form.setValue("videoSource", v as LEFormValues["videoSource"], { shouldDirty: true })
                    form.clearErrors("videoLink")
                    setFileError(null)
                  }}
                >
                  <TabsList className="h-auto w-full flex-wrap gap-1">
                    <TabsTrigger value="upload" className="h-auto min-h-11 px-3">
                      {t("video.uploadVideo")}
                    </TabsTrigger>
                    <TabsTrigger value="youtube" className="h-auto min-h-11 px-3">
                      {t("video.youtubeLink")}
                    </TabsTrigger>
                    <TabsTrigger value="vimeo" className="h-auto min-h-11 px-3">
                      {t("video.vimeoLink")}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={LE_VIDEO_MIME_TYPES.join(",")}
                      className="hidden"
                      aria-hidden="true"
                      tabIndex={-1}
                      onChange={(e) => {
                        onSelectFile(e.target.files?.[0] ?? null)
                        e.target.value = ""
                      }}
                    />
                    {videoFile ? (
                      <div className="flex min-h-11 items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2">
                        <Upload className="size-4 shrink-0 text-ccm-sea" aria-hidden="true" />
                        <span className="min-w-0 flex-1 truncate text-sm">
                          <bdi>{videoFile.name}</bdi>{" "}
                          <span className="text-muted-foreground">
                            ({(videoFile.size / (1024 * 1024)).toFixed(1)} MB)
                          </span>
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="min-h-11 shrink-0"
                          onClick={() => { setVideoFile(null); setFileError(null) }}
                        >
                          <X className="size-4 me-1" aria-hidden="true" />
                          {t("video.removeFile")}
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex min-h-24 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-4 text-center transition-colors hover:border-ccm-sea/50 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Upload className="size-5 text-muted-foreground" aria-hidden="true" />
                        <span className="text-sm font-medium">{t("video.chooseFile")}</span>
                        <span className="text-xs text-muted-foreground">{t("video.fileHint")}</span>
                      </button>
                    )}
                    {fileError && <p className="text-sm text-destructive">{fileError}</p>}
                    {videoFile && <p className="text-xs text-muted-foreground">{t("video.fileHint")}</p>}
                    {!videoFile && editDoc?.hasVideoFile && (
                      <p className="text-xs text-muted-foreground">{t("video.keepExisting")}</p>
                    )}
                  </TabsContent>

                  <TabsContent value="youtube" className="space-y-2">
                    <FormField control={form.control} name="videoLink" render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input {...field} inputMode="url" dir="ltr" placeholder="https://www.youtube.com/watch?v=…" />
                        </FormControl>
                        <FormDescription>{t("fields.videoLinkHelp")}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                    {youtubeVideoId && (
                      <div className="space-y-1.5">
                        <p className="flex items-center gap-1.5 text-sm text-ccm-sea">
                          <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
                          {t("video.youtubeValid")}
                        </p>
                        {/* img.youtube.com is the CSP-allowed YouTube thumb host. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`}
                          alt={t("video.youtubePreviewAlt")}
                          className="aspect-video w-full max-w-xs rounded-lg border object-cover"
                        />
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="vimeo" className="space-y-2">
                    <FormField control={form.control} name="videoLink" render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input {...field} inputMode="url" dir="ltr" placeholder="https://vimeo.com/…" />
                        </FormControl>
                        <FormDescription>{t("fields.videoLinkHelp")}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                    {vimeoVideoId && (
                      <p className="flex items-center gap-1.5 text-sm text-ccm-sea">
                        <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
                        {t("video.vimeoValid")}
                      </p>
                    )}
                  </TabsContent>
                </Tabs>
              </div>

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

              {/* Long-form story body — the shared editor (slash menu + toolbar
                  image upload with caption), blog-post feel. Optional. */}
              <FormField control={form.control} name="body" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.body")}</FormLabel>
                  <FormControl>
                    <PortableTextEditor
                      value={(field.value as unknown[]) || []}
                      onChangeAction={field.onChange}
                      language={locale}
                      placeholder={t("fields.bodyPlaceholder")}
                      // Lived experiences stay blog-post-like: no "Data &
                      // story" group (charts/diagrams) here — plan constraint.
                      enabledBlocks={INSERT_SLASH_MENU_ITEMS}
                    />
                  </FormControl>
                  <FormDescription>{t("fields.bodyHelp")}</FormDescription>
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
