import { NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"

/**
 * Returns the LinkedIn name / photo / headline from the user's Clerk external
 * account (if they signed in with LinkedIn) — for the profile editor to PREFILL,
 * not silently overwrite. The user reviews and saves via the normal profile PUT.
 * No scraping: this is the data Clerk's "Sign in with LinkedIn" OIDC provides.
 */
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)

    // Find a LinkedIn external account (provider id varies: oauth_linkedin /
    // oauth_linkedin_oidc / custom_linkedin).
    const linkedin = (user.externalAccounts || []).find((a: any) =>
      String(a.provider || "").toLowerCase().includes("linkedin")
    )

    if (!linkedin) {
      return NextResponse.json({ connected: false })
    }

    // Headline isn't a first-class field on every Clerk SDK version; it can land
    // in publicMetadata or the raw verification payload. Probe the common spots.
    const meta = (linkedin as any).publicMetadata || {}
    const headline =
      meta.headline ||
      (linkedin as any).headline ||
      (user.publicMetadata as any)?.linkedinHeadline ||
      null

    return NextResponse.json({
      connected: true,
      data: {
        firstName: linkedin.firstName || user.firstName || null,
        lastName: linkedin.lastName || user.lastName || null,
        imageUrl: (linkedin as any).imageUrl || (linkedin as any).avatarUrl || user.imageUrl || null,
        headline: typeof headline === "string" ? headline.slice(0, 120) : null,
      },
    })
  } catch (error) {
    console.error("LinkedIn import failed:", error)
    return NextResponse.json({ error: "LinkedIn import failed" }, { status: 500 })
  }
}
