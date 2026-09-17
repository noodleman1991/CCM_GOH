import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

/**
 * Hosts Clerk serves profile images from — the same two `next.config.mjs`
 * lists under `images.remotePatterns`, which is the authoritative set of hosts
 * `<Image>` will render. Before 2026-09-16 the route stored whatever string
 * the body carried, so a signed-in user could point their public avatar at
 * any host (a tracking pixel, an oversized file, a `javascript:` URL in a
 * place that renders `<img src>`). Exact host match: a look-alike such as
 * `img.clerk.com.evil.example` is a different host.
 */
const CLERK_IMAGE_HOSTS = new Set(["img.clerk.com", "images.clerk.dev"])

/** `null` clears the image; a string must be an https URL on a Clerk image host. */
function parseImageUrl(value: unknown): { ok: true; image: string | null } | { ok: false } {
    if (value === null || value === undefined || value === "") return { ok: true, image: null }
    if (typeof value !== "string") return { ok: false }
    let url: URL
    try {
        url = new URL(value)
    } catch {
        return { ok: false }
    }
    if (url.protocol !== "https:" || !CLERK_IMAGE_HOSTS.has(url.hostname)) return { ok: false }
    return { ok: true, image: url.toString() }
}

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        let body: { imageUrl?: unknown }
        try {
            body = await request.json()
        } catch {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
        }

        const parsed = parseImageUrl(body?.imageUrl)
        if (!parsed.ok) {
            return NextResponse.json(
                { error: "imageUrl must be an https URL on a Clerk image host" },
                { status: 400 }
            )
        }

        await prisma.user.update({
            where: { id: userId },
            data: { image: parsed.image }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Failed to sync profile image:", error)
        return NextResponse.json(
            { error: "Failed to sync image" },
            { status: 500 }
        )
    }
}
