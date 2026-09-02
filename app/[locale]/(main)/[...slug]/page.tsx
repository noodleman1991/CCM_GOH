export const revalidate = 120;

import type { Metadata } from "next"
import type { ComponentProps } from "react";
import Blocks from "@/components/blocks";
import {
  getPageBySlug,
  getPageSlugs,
  getPageTranslations,
  getRegionalCommunityPage,
  getRegionalCommunityPageSlugs,
} from "@/lib/content/pages";
import type { Locale } from "@/lib/content/types";
import { notFound, redirect } from "next/navigation";
import { generatePageMetadata } from "@/sanity/lib/metadata";
import { isRTL } from "@/i18n/i18n-helpers";

export async function generateStaticParams() {
    // Fetch both regional community pages AND generic pages
    const rcPages = await getRegionalCommunityPageSlugs();
    const genericPages = await getPageSlugs();
    const allPages = [...rcPages, ...genericPages];
    const params = [];

    for (const page of allPages) {
        // Split slug into segments for catch-all route [...slug]
        const slugSegments = page.slug.split('/');

        params.push({
            locale: page.locale,
            slug: slugSegments, // Array for catch-all route
        });

        try {
            const translations = page?.id ? await getPageTranslations(page.id) : [];
            if (translations?.length > 0) {
                for (const translation of translations) {
                    if (translation.language && translation.slug?.current) {
                        const translationSlugSegments = translation.slug.current.split('/');
                        params.push({
                            locale: translation.language,
                            slug: translationSlugSegments, // Array for catch-all route
                        });
                    }
                }
            }
        } catch (e) {
            console.error(`Error fetching translations for ${page.id}:`, e);
        }
    }

    return params;
}

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

    // generatePageMetadata (sanity/lib/metadata.ts) is still typed against the
    // generated @/sanity.types PAGE_QUERY_RESULT — Task 10b's file, not
    // converted here. Both getRegionalCommunityPage and getPageBySlug keep
    // meta_title/meta_description/noindex/ogImage as top-level fields
    // specifically so this call keeps working unchanged (see lib/content/
    // pages.ts's comment on `Page`).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- crossing into an unconverted Task 10b consumer still typed against @/sanity.types
    return generatePageMetadata({ page: page as any, slug: slug });
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
        redirect(`/${locale}/communities/${slug}`);
    }

    const page = await getPageBySlug(slug, locale as Locale);

    if (!page) {
        notFound();
    }

    // Determine text direction for RTL languages
    const rtl = isRTL(locale);

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
            />
        </main>
    );
}
