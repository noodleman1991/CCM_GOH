import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { listMyContributions } from "@/lib/content/contributions"

/**
 * Returns the signed-in member's contributions that need changes — any kind
 * (case studies, lived experiences, research outputs, events), for the
 * sign-in alert (my-contributions spec M5). The path keeps its old name so
 * the alert keeps working.
 *
 * Why this is a server route and not a browser query: a `submittedBy ==
 * $userId` filter from the browser is not a security boundary — anyone could
 * read every member's review notes. Here the user id comes from the trusted
 * Clerk session.
 */
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const submissions = (await listMyContributions(userId, "en"))
      .filter((c) => c.status === "revision" && c.editHref)
      .map((c) => ({
        _id: c.id,
        kind: c.kind,
        title: { en: c.title ?? "" },
        reviewNotes: c.reviewNotes ?? undefined,
        editHref: c.editHref,
      }))

    return NextResponse.json({ submissions })
  } catch (error) {
    console.error("Failed to fetch revision submissions:", error)
    return NextResponse.json(
      { error: "Failed to fetch revision submissions" },
      { status: 500 }
    )
  }
}
