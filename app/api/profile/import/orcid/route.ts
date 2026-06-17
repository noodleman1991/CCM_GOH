import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { fetchOrcid, orcidPath } from "@/lib/integrations/orcid";
import { fetchOpenAlexWorks } from "@/lib/integrations/openalex";
import type { ImportedWork } from "@/lib/integrations/types";

/**
 * Fetch a researcher's public works + affiliations from ORCID, supplemented by
 * OpenAlex (broader coverage). Returns them for the profile editor to PREFILL —
 * the user reviews and chooses what to save; nothing is written here.
 */
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orcid = request.nextUrl.searchParams.get("orcid") || "";
  if (!orcidPath(orcid)) {
    return NextResponse.json({ error: "Invalid ORCID iD" }, { status: 400 });
  }

  try {
    const [orcidResult, openAlexWorks] = await Promise.all([
      fetchOrcid(orcid),
      fetchOpenAlexWorks(orcid).catch(() => [] as ImportedWork[]),
    ]);

    // Merge works, de-duping by normalised title (ORCID first, OpenAlex fills gaps).
    const seen = new Set(orcidResult.works.map((w) => w.title.trim().toLowerCase()));
    const merged = [
      ...orcidResult.works,
      ...openAlexWorks.filter((w) => !seen.has(w.title.trim().toLowerCase())),
    ];
    // Newest first, capped.
    merged.sort((a, b) => (b.year || 0) - (a.year || 0));

    return NextResponse.json({
      works: merged.slice(0, 30),
      affiliations: orcidResult.affiliations,
    });
  } catch (error) {
    console.error("ORCID import failed:", error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
