export const revalidate = 120;

import type { Metadata } from "next"
import Blocks from "@/components/blocks";
import {
  fetchSanityPageBySlug,
  fetchSanityPagesStaticParams,
  fetchSanityRCPageBySlug,
  fetchSanityRCPagesStaticParams,
  fetchTranslationsForPage,
} from "@/sanity/lib/fetch";
import { notFound, redirect } from "next/navigation";
import { generatePageMetadata } from "@/sanity/lib/metadata";
import { isRTL } from "@/i18n/i18n-helpers";

export async function generateStaticParams() {
    // Fetch both regional community pages AND generic pages
    const rcPages = await fetchSanityRCPagesStaticParams();
    const genericPages = await fetchSanityPagesStaticParams();
    const allPages = [...rcPages, ...genericPages];
    const params = [];

    for (const page of allPages) {
        // Split slug into segments for catch-all route [...slug]
        const slugSegments = page.slug.current.split('/');

        if (page.language) {
            params.push({
                locale: page.language,
                slug: slugSegments, // Array for catch-all route
            });
        } else {
            params.push({
                locale: "en",
                slug: slugSegments, // Array for catch-all route
            });
        }

        try {
            const translations = page?._id ? await fetchTranslationsForPage(page._id) : [];
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
            console.error(`Error fetching translations for ${page._id}:`, e);
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
    let page = await fetchSanityRCPageBySlug({ slug, locale });

    if (!page) {
        page = await fetchSanityPageBySlug({ slug, locale });
    }

    if (!page) {
        notFound();
    }

    return generatePageMetadata({ page, slug: slug });
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
    const rcPage = await fetchSanityRCPageBySlug({slug, locale});
    if (rcPage) {
        redirect(`/${locale}/communities/${slug}`);
    }

    const page = await fetchSanityPageBySlug({slug, locale});

    if (!page) {
        notFound();
    }

    // Determine text direction for RTL languages
    const rtl = isRTL(locale);

    return (
        <main dir={rtl ? 'rtl' : 'ltr'}>
            {/* Generic page: render its block array. (RC pages are redirected
                above to their dedicated /communities/<slug> template.) */}
            <Blocks blocks={page.blocks ?? []} locale={locale} />
        </main>
    );
}
