"use client"

import { useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "@/i18n/navigation"
import { useTranslations, useLocale } from "next-intl"
import { toast } from "sonner"
import { FileText, Loader2, Plus, Send, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FilterChip } from "@/components/ui/filter-chip"
import PortableTextEditor from "@/components/forms/portable-text-editor"
import { ReviewContext } from "@/components/forms/review-context"
import { getLocalizedText } from "@/lib/localization-utils"
import { cn } from "@/lib/utils"
import { heading } from "@/lib/design-tokens"
import {
  RO_OUTPUT_TYPES,
  RO_VERSION_KINDS,
  RO_LANGS,
  RO_REGIONS,
  RO_DOC_MAX_BYTES,
  RO_DOC_MIME_TYPES,
} from "@/lib/validation/research-output"
import { REGION_OPTIONS, THEME_OPTIONS } from "@/sanity/schemas/shared/taxonomy-options"
import type { EditableResearchOutput } from "@/lib/research-outputs/edit"

type Tag = { _id: string; label: Record<string, string>; value?: { current: string } }
type Community = { _id: string; name: Record<string, string>; slug?: { current: string } }

/** One not-yet-uploaded document row (file travels as multipart `version-<i>`). */
type NewDoc = { file: File; kind: (typeof RO_VERSION_KINDS)[number]; lang: (typeof RO_LANGS)[number] }

const RO_DOC_ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"

export function ResearchOutputForm({
  availableTags,
  regionalCommunities,
  workspaceId,
  editDoc,
}: {
  availableTags: Tag[]
  regionalCommunities: Community[]
  workspaceId?: string | null
  /** X7 ?edit= — reopen an existing draft/pending doc; resubmits in place. */
  editDoc?: EditableResearchOutput | null
}) {
  const t = useTranslations("researchOutputSubmission")
  const locale = useLocale() as "en" | "es" | "fr" | "ar"
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  // Documents live outside react-hook-form (multipart, the LE video pattern).
  const [newDocs, setNewDocs] = useState<NewDoc[]>([])
  const [keptVersions, setKeptVersions] = useState(editDoc?.versions ?? [])
  const [fileError, setFileError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const schema = z.object({
    title: z.string().trim().min(3, t("validation.titleMin")).max(200),
    outputType: z.enum(RO_OUTPUT_TYPES),
    excerpt: z.string().trim().max(600).optional().or(z.literal("")),
    body: z.array(z.any()).optional(),
    region: z.string().optional().or(z.literal("")),
    themes: z.array(z.string()).max(8).optional().default([]),
    tagIds: z.array(z.string()).max(6).optional().default([]),
    communityIds: z.array(z.string()).max(7).optional().default([]),
  })
  type Values = z.input<typeof schema>

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: editDoc?.title ?? "",
      outputType: (editDoc?.outputType as Values["outputType"]) ?? "report",
      excerpt: editDoc?.excerpt ?? "",
      body: editDoc?.body ?? [],
      region: editDoc?.region ?? "",
      themes: editDoc?.themes ?? [],
      tagIds: editDoc?.tagIds ?? [],
      communityIds: editDoc?.communityIds ?? [],
    },
  })

  const onSelectFile = (file: File | null) => {
    setFileError(null)
    if (!file) return
    if (!RO_DOC_MIME_TYPES.includes(file.type)) {
      setFileError(t("docs.fileWrongType"))
      return
    }
    if (file.size > RO_DOC_MAX_BYTES) {
      setFileError(t("docs.fileTooLarge"))
      return
    }
    setNewDocs((d) => [...d, { file, kind: "full", lang: locale }])
  }

  const setDocMeta = (i: number, patch: Partial<Pick<NewDoc, "kind" | "lang">>) =>
    setNewDocs((d) => d.map((doc, j) => (j === i ? { ...doc, ...patch } : doc)))

  const toggle = (name: "themes" | "tagIds" | "communityIds", id: string, max: number) => {
    const current = form.watch(name) || []
    const next = current.includes(id)
      ? current.filter((x: string) => x !== id)
      : current.length < max
        ? [...current, id]
        : current
    form.setValue(name, next, { shouldDirty: true })
  }

  async function onSubmit(values: Values) {
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append(
        "data",
        JSON.stringify({
          ...values,
          newVersions: newDocs.map(({ kind, lang }) => ({ kind, lang })),
          keptVersionKeys: keptVersions.map((v) => v._key),
          language: editDoc?.language ?? locale,
          ...(workspaceId ? { collaborationId: workspaceId } : {}),
          ...(editDoc ? { editId: editDoc._sanityId } : {}),
        })
      )
      newDocs.forEach((d, i) => formData.append(`version-${i}`, d.file))
      const res = await fetch("/api/research-outputs/submit", { method: "POST", body: formData })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Submission failed")
      }
      toast.success(t("success"))
      router.push(workspaceId ? `/collaborations/${workspaceId}` : "/research-and-action/case-studies")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Submission failed")
    } finally {
      setSubmitting(false)
    }
  }

  const selectedThemes = form.watch("themes") || []
  const selectedTags = form.watch("tagIds") || []
  const selectedCommunities = form.watch("communityIds") || []

  const docRow =
    "flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2"

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
              <CardTitle>{t("about.title")}</CardTitle>
              <CardDescription>{t("about.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.title")}</FormLabel>
                  <FormControl><Input {...field} placeholder={t("fields.titlePlaceholder")} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="outputType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fields.type")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "report"}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {RO_OUTPUT_TYPES.map((v) => (
                          <SelectItem key={v} value={v}>{t(`types.${v}`)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="region" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fields.region")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder={t("fields.regionPlaceholder")} /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {REGION_OPTIONS.filter((r) => (RO_REGIONS as readonly string[]).includes(r.value)).map((r) => (
                          <SelectItem key={r.value} value={r.value}>{r.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="excerpt" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.excerpt")}</FormLabel>
                  <FormControl><Textarea {...field} value={field.value || ""} rows={3} placeholder={t("fields.excerptPlaceholder")} /></FormControl>
                  <FormDescription>{t("fields.excerptHelp")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          {/* The documents readers download — the heart of a research output. */}
          <Card>
            <CardHeader>
              <CardTitle>{t("docs.title")}</CardTitle>
              <CardDescription>{t("docs.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {keptVersions.map((v) => (
                <div key={v._key} className={docRow}>
                  <FileText className="size-4 shrink-0 text-ccm-sea" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-sm">
                    <bdi>{v.fileName ?? t(`kinds.${v.kind}` as never)}</bdi>{" "}
                    <span className="text-muted-foreground">
                      {t(`kinds.${v.kind}` as never)} · {v.lang.toUpperCase()}
                    </span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="min-h-9 shrink-0"
                    onClick={() => setKeptVersions((k) => k.filter((x) => x._key !== v._key))}
                  >
                    <X className="size-4 me-1" aria-hidden="true" />
                    {t("docs.remove")}
                  </Button>
                </div>
              ))}

              {newDocs.map((d, i) => (
                <div key={`${d.file.name}-${i}`} className={docRow}>
                  <FileText className="size-4 shrink-0 text-ccm-sea" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-sm">
                    <bdi>{d.file.name}</bdi>{" "}
                    <span className="text-muted-foreground">({(d.file.size / (1024 * 1024)).toFixed(1)} MB)</span>
                  </span>
                  <Select value={d.kind} onValueChange={(v) => setDocMeta(i, { kind: v as NewDoc["kind"] })}>
                    <SelectTrigger className="h-9 w-32 shrink-0 text-xs" aria-label={t("docs.kind")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RO_VERSION_KINDS.map((k) => (
                        <SelectItem key={k} value={k}>{t(`kinds.${k}`)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={d.lang} onValueChange={(v) => setDocMeta(i, { lang: v as NewDoc["lang"] })}>
                    <SelectTrigger className="h-9 w-20 shrink-0 text-xs" aria-label={t("docs.language")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RO_LANGS.map((l) => (
                        <SelectItem key={l} value={l}>{l.toUpperCase()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="min-h-9 shrink-0"
                    onClick={() => setNewDocs((docs) => docs.filter((_, j) => j !== i))}
                  >
                    <X className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              ))}

              <input
                ref={fileInputRef}
                type="file"
                accept={RO_DOC_ACCEPT}
                className="hidden"
                aria-hidden="true"
                tabIndex={-1}
                onChange={(e) => {
                  onSelectFile(e.target.files?.[0] ?? null)
                  e.target.value = ""
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex min-h-16 w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-4 text-center transition-colors hover:border-ccm-sea/50 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Plus className="size-4 text-muted-foreground" aria-hidden="true" />
                <span className="text-sm font-medium">{t("docs.addFile")}</span>
                <span className="text-xs text-muted-foreground">{t("docs.fileHint")}</span>
              </button>
              {fileError && <p className="text-sm text-destructive">{fileError}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("reading.title")}</CardTitle>
              <CardDescription>{t("reading.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField control={form.control} name="body" render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <PortableTextEditor
                      value={(field.value as unknown[] as never) || []}
                      onChangeAction={field.onChange}
                      language={locale}
                      placeholder={t("fields.bodyPlaceholder")}
                    />
                  </FormControl>
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
              <FormItem>
                <FormLabel>{t("fields.themes")}</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {THEME_OPTIONS.map((th) => (
                    <FilterChip
                      key={th.value}
                      label={th.title}
                      active={selectedThemes.includes(th.value)}
                      onClick={() => toggle("themes", th.value, 8)}
                    />
                  ))}
                </div>
              </FormItem>

              <FormItem>
                <FormLabel>{t("fields.tags")}</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <FilterChip
                      key={tag._id}
                      label={getLocalizedText(tag.label, locale, "")}
                      active={selectedTags.includes(tag._id)}
                      onClick={() => toggle("tagIds", tag._id, 6)}
                    />
                  ))}
                </div>
                <FormDescription>{t("fields.tagsHelp")}</FormDescription>
              </FormItem>

              <FormItem>
                <FormLabel>{t("fields.communities")}</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {regionalCommunities.map((c) => (
                    <FilterChip
                      key={c._id}
                      label={getLocalizedText(c.name, locale, "")}
                      active={selectedCommunities.includes(c._id)}
                      onClick={() => toggle("communityIds", c._id, 7)}
                    />
                  ))}
                </div>
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
