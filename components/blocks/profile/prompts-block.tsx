import { getAnsweredPrompts } from "@/lib/community/profile-prompts"
import { Card, CardContent } from "@/components/ui/card"

/**
 * Renders a user's answered "Hinge-style" prompts as the most human part of the
 * profile — the quiet prompt as a label, the answer as the content. Server
 * component; renders nothing if there are no answers.
 */
export async function PromptsBlock({ userId, locale }: { userId: string; locale: string }) {
  const prompts = await getAnsweredPrompts(userId, locale)
  if (prompts.length === 0) return null

  return (
    <div className="space-y-4">
      {prompts.map((p) => (
        <Card key={p.id} className="bg-[var(--color-ccm-sky)]/10">
          <CardContent className="pt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-ccm-sea mb-2">{p.prompt}</p>
            <p className="text-pretty text-base text-ccm-midnight whitespace-pre-line">{p.answer}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
