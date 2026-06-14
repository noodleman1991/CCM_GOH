import { NextRequest, NextResponse } from "next/server"
import { writeClient } from "@/sanity/lib/write-client"
import { onboardingContentQueryWithFallback } from "@/sanity/queries/onboarding-content"

/**
 * Returns localized onboarding-dialog copy from Sanity.
 *
 * This is public CMS content, but it is fetched server-side (tokened client) so
 * it keeps working when the Sanity dataset is set to private — the browser must
 * not depend on a public dataset for any read.
 */
export async function GET(request: NextRequest) {
  try {
    const locale = request.nextUrl.searchParams.get("locale") || "en"
    const data = await writeClient.fetch(onboardingContentQueryWithFallback, { locale })
    return NextResponse.json({ content: data ?? null })
  } catch (error) {
    console.error("Failed to fetch onboarding content:", error)
    // Let the client fall back to its built-in default copy.
    return NextResponse.json({ content: null }, { status: 200 })
  }
}
