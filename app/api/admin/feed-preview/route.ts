import { NextResponse } from "next/server";
import { getActor } from "@/lib/authz";
import { isStaff } from "@/lib/authz-core";
import { resolveContentFeed } from "@/lib/content/feeds/resolve";
import { contentFeedSettings } from "@/lib/content/internal/payload/blocks";
import type { FeedContext } from "@/lib/content/feeds/types";

const LOCALES: readonly FeedContext["locale"][] = ["en", "es", "fr", "ar"];

/**
 * "What will show now" for a Content feed being edited (spec §3.5): the same
 * resolution the page runs, on the settings as they are in the form, returned
 * as titles only. Staff only — it reads nothing a visitor can't see, but it
 * runs queries on demand.
 */
export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor || !isStaff(actor)) return NextResponse.json({ error: "Not allowed" }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as { block?: unknown; settings?: unknown; locale?: unknown; communityId?: unknown };
  // `block` is the section's raw form values — mapped exactly as the page maps them.
  const settings =
    body.block && typeof body.block === "object" ? contentFeedSettings(body.block as Record<string, unknown>) : (body.settings ?? {});
  const locale = LOCALES.includes(body.locale as FeedContext["locale"]) ? (body.locale as FeedContext["locale"]) : "en";
  const communityId = typeof body.communityId === "string" && body.communityId ? body.communityId : null;

  try {
    const result = await resolveContentFeed(settings, { locale, communityId });
    return NextResponse.json({
      items: result.items.map((item) => ({ title: item.title, kind: item.type, href: item.href })),
      skipped: result.skipped.map((s) => ({ kind: s.pick.kind, id: s.pick.id })),
    });
  } catch (error) {
    console.error("[feed-preview] failed", error);
    return NextResponse.json({ error: "Couldn't load the preview. Try again in a moment." }, { status: 500 });
  }
}
