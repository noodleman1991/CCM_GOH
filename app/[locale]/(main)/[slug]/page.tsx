import Blocks from "@/components/blocks";
import Hero1 from "@/components/blocks/hero/hero-1"
import {
  fetchSanityRCPageBySlug,
  fetchSanityRCPagesStaticParams,
  fetchTranslationsForPage,
} from "@/sanity/lib/fetch";
import { notFound } from "next/navigation";
import { generatePageMetadata } from "@/sanity/lib/metadata";

export async function generateStaticParams() {
    const pages = await fetchSanityRCPagesStaticParams();
    const params = [];

    for (const page of pages) {
        if (page.language) {
            params.push({
                locale: page.language,
                slug: page.slug.current,
            });
        } else {
            params.push({
                locale: "en",
                slug: page.slug.current,
            });
        }

        try {
            const translations = page?._id ? await fetchTranslationsForPage(page._id) : [];
            if (translations?.length > 0) {
                for (const translation of translations) {
                    if (translation.language && translation.slug?.current) {
                        params.push({
                            locale: translation.language,
                            slug: translation.slug.current,
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
    params: Promise<{ slug: string; locale: string }> // Fix: Promise type
}) {
    const { slug, locale } = await params; // Fix: await params

    const page = await fetchSanityRCPageBySlug({ slug, locale });

    if (!page) {
        notFound();
    }

    return generatePageMetadata({ page, slug: slug });
}

export default async function Page({
    params
}: {
    params: Promise<{ locale: string; slug: string }> // Fix: Promise type
}) {
    const {locale, slug} = await params; // Fix: await params
    const page = await fetchSanityRCPageBySlug({slug, locale});

    if (!page) {
        notFound();
    }

    return (
        <>
            {/* Use titleHero to match your schema */}
            {page.titleHero && (
                <Hero1 {...page.titleHero} locale={locale} />
            )}

            {/* Render listHero if it exists */}
            {page.listHero && (
                <Hero1 {...page.listHero} locale={locale} />
            )}

            {/* Render blocks */}
            <Blocks blocks={page.blocks ?? []} locale={locale} />
        </>
    );
}
