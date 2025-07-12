import Blocks from "@/components/blocks";
import { fetchSanityPageBySlug } from "@/sanity/lib/fetch";
import { generatePageMetadata } from "@/sanity/lib/metadata";
import MissingSanityPage from "@/components/ui/missing-sanity-page";

import { Metadata } from 'next'
import { routing } from '@/i18n/routing';
// import { i18n } from '@/i18n/languages.json'

// Generate static params for all locales
export async function generateStaticParams() {
    // This will create a version of the index page for each language
    return routing.locales.map((locale) => ({
        locale,
    }));
}

// export async function generateMetadata() {
//     const page = await fetchSanityPageBySlug({ slug: "index" });
//
//     return generatePageMetadata({ page, slug: "index" });
// }

export async function generateMetadata({
                                           params
                                       }: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params;
    const page = await fetchSanityPageBySlug({ slug: "index", locale });
    return generatePageMetadata({ page, slug: "index" });
}

export default async function IndexPage(props: { params: { locale: string } }) {
    const { locale } = await props.params;

    // Fetch page with locale parameter
    const page = await fetchSanityPageBySlug({
        slug: "index",
        locale,
    });

    if (!page) {
        return MissingSanityPage({ document: "page", slug: "index" });
    }

    // const translations = i18n.languages.map((lang) => {
    //     return {
    //         language: lang.id,
    //         path: `/${lang.id}`,
    //         title: lang.title,
    //     }
    // })

    return (
        <>
            {/* You could add a Header component with language switcher here */}
            <Blocks
                blocks={page?.blocks ?? []}
                locale={locale}
                // translations={translations}
            />
        </>
    );
}
