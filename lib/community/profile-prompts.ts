import "server-only"
import { prisma } from "@/lib/prisma"
import { fetchActiveProfilePrompts } from "@/sanity/lib/fetch"
import { getLocalizedField } from "@/lib/localization-utils"

export type AnsweredPrompt = {
  id: string
  prompt: string
  answer: string
}

type SupportedLocale = "en" | "es" | "fr" | "ar"

/**
 * A user's answered prompts, joined with the CMS prompt text resolved for the
 * given locale. Answers whose prompt has been retired/deleted are dropped.
 */
export async function getAnsweredPrompts(
  userId: string,
  locale: string
): Promise<AnsweredPrompt[]> {
  const supported = (["en", "es", "fr", "ar"].includes(locale) ? locale : "en") as SupportedLocale

  const [answers, prompts] = await Promise.all([
    prisma.profilePromptAnswer.findMany({
      where: { userId },
      orderBy: { order: "asc" },
      select: { promptId: true, answer: true },
    }),
    fetchActiveProfilePrompts(),
  ])

  const textById = new Map(
    prompts.map((p) => [p.id, getLocalizedField(p.prompt, supported, "") || ""])
  )

  return answers
    .map((a) => {
      const prompt = textById.get(a.promptId)
      if (!prompt) return null // prompt retired/deleted → hide the answer
      return { id: a.promptId, prompt, answer: a.answer }
    })
    .filter((x): x is AnsweredPrompt => x !== null)
}
