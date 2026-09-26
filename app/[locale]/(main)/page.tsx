import type { Metadata } from "next"
import type { ComponentProps } from "react";
import Blocks from "@/components/blocks";
import Homepage from "@/components/pages/homepage";
import {
  getPageBySlug,
  getHomepage,
} from "@/lib/content/pages";
import type { Locale } from "@/lib/content/types";
import { generatePageMetadata, type MetadataSource } from "@/lib/content/metadata";
import MissingSanityPage from "@/components/ui/missing-sanity-page";
import { isRTL } from "@/i18n/i18n-helpers";
import { getViewerUserId } from "@/lib/authz";

export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params;

    let page: unknown = await getHomepage(locale as Locale);

    if (!page) {
        page = await getPageBySlug("index", locale as Locale);
    }

    // getHomepage / getPageBySlug keep meta_title/meta_description/noindex/
    // ogImage as top-level fields, matching generatePageMetadata's
    // MetadataSource — see lib/content/pages.ts's comment on why.
    return generatePageMetadata({ page: page as MetadataSource, slug: "index", locale });
}

interface IndexPageProps {
    params: Promise<{ locale: string }>
}

export default async function IndexPage({ params }: IndexPageProps) {
    const { locale } = await params;

    // Determine text direction for RTL languages
    const rtl = isRTL(locale);

    // Resilient homepage fetch: a transient Sanity failure must NEVER swap the
    // front door to the legacy `page` doc (users saw the redesign "revert").
    // Retry the flake; only a genuine null (doc absent) reaches the fallback.
    let homepage = null;
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            homepage = await getHomepage(locale as Locale);
            break;
        } catch (error) {
            if (attempt === 2) throw error;
            await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
        }
    }

    if (homepage) {
        // Homepage (lib/content/pages.ts) is a loose pass-through of
        // HOMEPAGE_QUERY's result; components/pages/homepage.tsx's own
        // HomepageDoc type is stricter (each slot typed as the block
        // component's own props). Cast at this seam rather than loosen
        // either side's types — same precedent as the [...slug] catch-all's
        // Blocks casts.
        // `userId` reaches the agenda download buttons (see [...slug]/page.tsx
        // for why); the (main) layout already reads the session.
        return (
            <Homepage
                homepage={homepage as unknown as Parameters<typeof Homepage>[0]["homepage"]}
                locale={locale}
                userId={await getViewerUserId()}
            />
        );
    }

    // Fallback to regular page
    const page = await getPageBySlug("index", locale as Locale);

    if (!page) {
        return MissingSanityPage({ document: "homepage or page", slug: "index" });
    }

    return (
        <main dir={rtl ? 'rtl' : 'ltr'}>
            <Blocks
                blocks={(page?.blocks ?? []) as unknown as ComponentProps<typeof Blocks>["blocks"]}
                locale={locale}
                userId={await getViewerUserId()}
            />
        </main>
    );
}
