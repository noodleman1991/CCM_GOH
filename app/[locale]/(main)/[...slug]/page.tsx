import type { Metadata } from "next"
import type { ComponentProps } from "react";
import Blocks from "@/components/blocks";
import {
  getPageBySlug,
  getRegionalCommunityPage,
} from "@/lib/content/pages";
import type { Locale } from "@/lib/content/types";
import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { generatePageMetadata, type MetadataSource } from "@/lib/content/metadata";
import { isRTL } from "@/i18n/i18n-helpers";
import { getActor, getViewerUserId, isStaff } from "@/lib/authz";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
    params
}: {
    params: Promise<{ slug: string[]; locale: string }> // Catch-all route: slug is array
}): Promise<Metadata> {
    const { slug: slugArray, locale } = await params;
    const slug = slugArray.join('/'); // Join array to create full slug path

    // Try regional community page first, then generic page
    let page: unknown = await getRegionalCommunityPage(slug, locale as Locale);

    if (!page) {
        page = await getPageBySlug(slug, locale as Locale);
    }

    if (!page) {
        notFound();
    }

    // Both getRegionalCommunityPage and getPageBySlug keep meta_title/
    // meta_description/noindex/ogImage as top-level fields, matching
    // generatePageMetadata's MetadataSource — see lib/content/pages.ts's
    // comment on `Page` for why.
    return generatePageMetadata({ page: page as MetadataSource, slug: slug, locale });
}

export default async function Page({
    params
}: {
    params: Promise<{ locale: string; slug: string[] }> // Catch-all route: slug is array
}) {
    const {locale, slug: slugArray} = await params;
    const slug = slugArray.join('/'); // Join array to create full slug path

    // Regional community pages render via their dedicated template at
    // /communities/<slug> — this catch-all only has the generic-page fields, so
    // redirect RC slugs to the canonical URL instead of rendering them empty.
    const rcPage = await getRegionalCommunityPage(slug, locale as Locale);
    if (rcPage) {
        redirect({ href: `/communities/${slug}`, locale });
    }

    const page = await getPageBySlug(slug, locale as Locale);

    if (!page) {
        notFound();
    }

    // Determine text direction for RTL languages
    const rtl = isRTL(locale);

    // Who is looking: agenda blocks gate their download buttons on
    // `accessLevel`, and without this every non-public agenda locked for
    // everyone, signed in or not (audit M4). The (main) layout already reads
    // the session, so this adds no new dynamic dependency.
    const userId = await getViewerUserId();

    // Staff get an "Edit this section" link per section once the page is built
    // from the CMS Sections list (CMS project 4). The old per-language list has
    // no row anchors to link to.
    const canEdit = Boolean(page.fromSections && page.id) && isStaff(await getActor());
    const editLabel = canEdit ? (await getTranslations({ locale, namespace: "blocks" }))("editSection") : undefined;

    return (
        <main dir={rtl ? 'rtl' : 'ltr'}>
            {/* Generic page: render its block array. (RC pages are redirected
                above to their dedicated /communities/<slug> template.) Raw
                Sanity block shape (_type/_key) passed straight through — see
                lib/content/pages.ts's comment on why `Page.blocks` isn't
                remapped to the loose ContentBlock alias name's own fields. */}
            <Blocks
                blocks={page.blocks as unknown as ComponentProps<typeof Blocks>["blocks"]}
                locale={locale}
                userId={userId}
                editHref={canEdit ? (i) => `/admin/collections/pages/${page.id}#sections-row-${i}` : undefined}
                editLabel={editLabel}
            />
        </main>
    );
}
