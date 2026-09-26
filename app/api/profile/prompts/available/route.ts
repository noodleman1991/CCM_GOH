import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getActiveProfilePrompts } from "@/lib/content/onboarding"

/**
 * The active prompt library (id + per-locale text) for the picker. Auth-gated
 * since it's only used by the signed-in editor / onboarding flow.
 */
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const prompts = await getActiveProfilePrompts()
  return NextResponse.json({ prompts })
}
