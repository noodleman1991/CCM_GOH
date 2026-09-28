import { NextResponse } from "next/server";
import { draftMode } from "next/headers";
import { getActor } from "@/lib/authz";
import { isStaff } from "@/lib/authz-core";
import { safePreviewPath } from "@/lib/preview/safe-path";

/**
 * Live preview's entry point (spec §3.4): turns on draft mode for staff and
 * sends them to the page, which then reads its newest draft. The Payload admin
 * opens this in its preview frame (same site, so the sign-in comes along).
 * Only site paths are accepted — never a redirect to somewhere else.
 */
export async function GET(request: Request) {
  const actor = await getActor();
  if (!actor || !isStaff(actor)) return NextResponse.json({ error: "Not allowed" }, { status: 403 });

  const path = safePreviewPath(new URL(request.url).searchParams.get("path"));
  if (!path) return NextResponse.json({ error: "That isn't a page on this site." }, { status: 400 });

  (await draftMode()).enable();
  return NextResponse.redirect(new URL(path, request.url), 307);
}
