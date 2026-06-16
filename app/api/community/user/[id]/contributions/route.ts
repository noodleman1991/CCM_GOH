import { NextRequest, NextResponse } from "next/server";
import { getUserContributions } from "@/lib/community/region-data";

export const revalidate = 300;

/** A user's public contributions (approved case studies, content, recent work). */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const locale = req.nextUrl.searchParams.get("locale") || "en";
  const contributions = await getUserContributions(id, locale);
  return NextResponse.json({ userId: id, contributions });
}
