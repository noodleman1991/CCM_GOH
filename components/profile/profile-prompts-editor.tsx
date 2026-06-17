"use client"

import { useEffect, useState, useCallback } from "react"
import { useLocale, useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, X, Loader2, Check } from "lucide-react"
import { cn } from "@/lib/utils"

type Prompt = { id: string; prompt: Record<string, string>; category?: string }
type Answer = { promptId: string; answer: string }

const MAX = 5
type Locale = "en" | "es" | "fr" | "ar"
const promptText = (p: Prompt | undefined, locale: Locale) =>
  p ? p.prompt[locale] || p.prompt.en || Object.values(p.prompt)[0] || "" : ""

/**
 * Pick-and-answer "Hinge-style" prompt editor. Self-contained: loads the active
 * prompt library + the user's existing answers, manages add/edit/remove, and
 * saves to /api/profile/prompts. Reused by the profile edit form and onboarding.
 */
export function ProfilePromptsEditor({ className }: { className?: string }) {
  const locale = useLocale() as Locale
  const t = useTranslations("profile.prompts")
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [answers, setAnswers] = useState<Answer[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([
      fetch("/api/profile/prompts/available").then((r) => (r.ok ? r.json() : { prompts: [] })),
      fetch("/api/profile/prompts").then((r) => (r.ok ? r.json() : { answers: [] })),
    ])
      .then(([lib, mine]) => {
        if (!active) return
        setPrompts(lib.prompts || [])
        setAnswers((mine.answers || []).map((a: any) => ({ promptId: a.promptId, answer: a.answer })))
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const usedIds = new Set(answers.map((a) => a.promptId))
  const available = prompts.filter((p) => !usedIds.has(p.id))

  const addAnswer = () => {
    const next = available[0]
    if (next && answers.length < MAX) setAnswers((a) => [...a, { promptId: next.id, answer: "" }])
  }
  const removeAnswer = (i: number) => setAnswers((a) => a.filter((_, idx) => idx !== i))
  const setPromptId = (i: number, promptId: string) =>
    setAnswers((a) => a.map((x, idx) => (idx === i ? { ...x, promptId } : x)))
  const setText = (i: number, answer: string) =>
    setAnswers((a) => a.map((x, idx) => (idx === i ? { ...x, answer } : x)))

  const save = useCallback(async () => {
    setSaving(true)
    setSaved(false)
    try {
      const payload = answers.filter((a) => a.answer.trim().length > 0)
      const res = await fetch("/api/profile/prompts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: payload }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      }
    } finally {
      setSaving(false)
    }
  }, [answers])

  if (loading) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
        <Loader2 className="size-4 animate-spin" /> {t("loading")}
      </div>
    )
  }

  if (prompts.length === 0) return null

  return (
    <div className={cn("space-y-4", className)}>
      {answers.map((a, i) => {
        // The dropdown for THIS row offers its current prompt + any unused ones.
        const options = prompts.filter((p) => p.id === a.promptId || !usedIds.has(p.id))
        return (
          <div key={i} className="rounded-lg border p-4 space-y-3">
            <div className="flex items-start gap-2">
              <Select value={a.promptId} onValueChange={(v) => setPromptId(i, v)}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {options.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {promptText(p, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeAnswer(i)}
                aria-label={t("remove")}
              >
                <X className="size-4" />
              </Button>
            </div>
            <Textarea
              value={a.answer}
              onChange={(e) => setText(i, e.target.value)}
              rows={3}
              maxLength={600}
              placeholder={t("answerPlaceholder")}
            />
          </div>
        )
      })}

      <div className="flex flex-wrap items-center gap-3">
        {answers.length < MAX && available.length > 0 && (
          <Button type="button" variant="outline" size="sm" onClick={addAnswer}>
            <Plus className="size-4 me-1" /> {t("add")}
          </Button>
        )}
        <Button type="button" size="sm" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="size-4 me-1 animate-spin" /> : saved ? <Check className="size-4 me-1" /> : null}
          {saved ? t("saved") : t("save")}
        </Button>
      </div>
    </div>
  )
}
