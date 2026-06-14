import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { writeClient } from "@/sanity/lib/write-client"

/**
 * Returns the authenticated user's case-study submissions that need revision.
 *
 * Why this is a server route and not a client-side Sanity query: the dataset is
 * publicly readable, so a `submittedBy == $userId` filter from the browser is
 * not a security boundary — any visitor could query every user's reviewNotes.
 * Here the userId comes from the trusted Clerk session, and the read uses the
 * tokened server client.
 */
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const submissions = await writeClient.fetch(
      `*[_type == "caseStudy" && submittedBy == $userId && status == "revision"]{
        _id,
        title,
        status,
        reviewNotes,
        submittedAt
      }`,
      { userId }
    )

    return NextResponse.json({ submissions })
  } catch (error) {
    console.error("Failed to fetch revision submissions:", error)
    return NextResponse.json(
      { error: "Failed to fetch revision submissions" },
      { status: 500 }
    )
  }
}
