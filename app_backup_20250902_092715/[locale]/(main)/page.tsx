import Blocks from "@/components/blocks";
import Homepage from "@/components/pages/homepage";
import {
  fetchSanityPageBySlug,
  fetchSanityHomepageBySlug,
  fetchTranslationsForPage,
  fetchSanityHomepageStaticParams
} from "@/sanity/lib/fetch";
import { generatePageMetadata } from "@/sanity/lib/metadata";
import MissingSanityPage from "@/components/ui/missing-sanity-page";
import { routing } from '@/i18n/routing';

export async function generateStaticParams() {
    const homepages = await fetchSanityHomepageStaticParams();
    const params = [];

    for (const homepage of homepages) {
        if (homepage.language) {
            params.push({
                locale: homepage.language,
            });
        } else {
            params.push({
                locale: "en",
            });
        }

        try {
            const translations = homepage?._id ? await fetchTranslationsForPage(homepage._id) : [];
            if (translations?.length > 0) {
                for (const translation of translations) {
                    if (translation.language && translation.slug?.current) {
                        params.push({
                            locale: translation.language,
                        });
                    }
                }
            }
        } catch (e) {
            console.error(`Error fetching translations for ${homepage._id}:`, e);
        }
    }

    if (params.length === 0) {
        return routing.locales.map((locale) => ({
            locale,
        }));
    }

    return params;
}

export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }> // Fix: Promise type
}) {
    const { locale } = await params; // Fix: await params

    let page = await fetchSanityHomepageBySlug({ slug: "index", locale });

    if (!page) {
        page = await fetchSanityPageBySlug({ slug: "index", locale });
    }

    return generatePageMetadata({ page, slug: "index" });
}

interface IndexPageProps {
    params: Promise<{ locale: string }> // Fix: Promise type
}

export default async function IndexPage({ params }: IndexPageProps) {
    const { locale } = await params; // Fix: await params

    // Try to fetch homepage first (document-level internationalization)
    let homepage = await fetchSanityHomepageBySlug({
        slug: "index",
        locale,
    });

    if (homepage) {
        return <Homepage homepage={homepage} locale={locale} />;
    }

    // Fallback to regular page
    const page = await fetchSanityPageBySlug({
        slug: "index",
        locale,
    });

    if (!page) {
        return MissingSanityPage({ document: "homepage or page", slug: "index" });
    }

    return (
        <>
            <Blocks
                blocks={page?.blocks ?? []}
                locale={locale}
            />
        </>
    );
}
