import Blocks from "@/components/blocks";
import Hero1 from "@/components/blocks/hero/hero-1"
import {
  fetchSanityPageBySlug,
  fetchSanityRCPageBySlug,
  fetchSanityPagesStaticParams,
  fetchSanityRCPagesStaticParams,
  fetchTranslationsForPage,
} from "@/sanity/lib/fetch";
import { notFound } from "next/navigation";
import { generatePageMetadata } from "@/sanity/lib/metadata";

// export async function generateStaticParams() {
//   const pages = await fetchSanityPagesStaticParams();
//
//   return pages.map((page) => ({
//     slug: page.slug?.current,
//   }));
// }

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
            // Default to English for pages without language field
            params.push({
                locale: "en",
                slug: page.slug.current,
            });
        }

        // Add translations if they exist
        try {
            const translations = await fetchTranslationsForPage(page._id);
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
    params: Promise<{ slug: string; locale: string }>
}) {
    const { slug, locale } = await params;

    const page = await fetchSanityRCPageBySlug({ slug, locale });

    if (!page) {
        notFound();
    }

    return generatePageMetadata({ page, slug: slug });
}

export default async function Page({
                                       params
                                   }: {
    params: { locale: string; slug: string }
}) {
    const { locale, slug } = await params;
    const page = await fetchSanityRCPageBySlug({ slug, locale });

    if (!page) {
        notFound();
    }



    return
    {
        // <Hero1 title={page?.welcome}></Hero1>
        <Blocks blocks={page?.blocks ?? []} locale={locale}/>;
    }
}
