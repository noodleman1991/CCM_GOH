import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

/**
 * The signed-in user's own prompt answers (for the editor).
 * Public display goes through getUserProfile / a server fetch, not this route.
 */
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const answers = await prisma.profilePromptAnswer.findMany({
    where: { userId },
    orderBy: { order: "asc" },
    select: { id: true, promptId: true, answer: true, order: true },
  })
  return NextResponse.json({ answers })
}

const SaveSchema = z.object({
  answers: z
    .array(
      z.object({
        promptId: z.string().min(1),
        answer: z.string().trim().min(1).max(600),
      })
    )
    .max(5), // cap how many prompts a profile shows
})

/** Replace the user's prompt answers with the submitted set (Clerk-authed). */
export async function PUT(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let parsed
  try {
    parsed = SaveSchema.parse(await request.json())
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid input", details: e instanceof z.ZodError ? e.errors : undefined },
      { status: 400 }
    )
  }

  // Dedupe by promptId (a user answers each prompt once) and persist in order.
  const seen = new Set<string>()
  const unique = parsed.answers.filter((a) => {
    if (seen.has(a.promptId)) return false
    seen.add(a.promptId)
    return true
  })

  await prisma.$transaction([
    prisma.profilePromptAnswer.deleteMany({ where: { userId } }),
    ...unique.map((a, i) =>
      prisma.profilePromptAnswer.create({
        data: { userId, promptId: a.promptId, answer: a.answer, order: i },
      })
    ),
  ])

  return NextResponse.json({ success: true, count: unique.length })
}
