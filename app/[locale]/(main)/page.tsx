// import Blocks from "@/components/blocks";
// import { fetchSanityPageBySlug } from "@/sanity/lib/fetch";
// import { generatePageMetadata } from "@/sanity/lib/metadata";
// import MissingSanityPage from "@/components/ui/missing-sanity-page";
//
// import { routing } from '@/i18n/routing';
//
// // Generate static params for all locales
// export async function generateStaticParams() {
//     // This will create a version of the index page for each language
//     return routing.locales.map((locale) => ({
//         locale,
//     }));
// }
//
// export async function generateMetadata() {
//     const page = await fetchSanityPageBySlug({ slug: "index" });
//
//     return generatePageMetadata({ page, slug: "index" });
// }
//
// // export async function generateMetadata({
// //                                            params
// //                                        }: {
// //     params: Promise<{ slug: string, locale: string }>
// // }) {
// //     const { slug, locale } = await params;
// //     const page = await fetchSanityPageBySlug({ slug, locale });
// //     return generatePageMetadata({ page, slug });
// // }
//
// // export default async function IndexPage(props: { params: { slug: string, locale: string } }) {
// //     const { slug, locale } = await props.params;
// //
// //     // Fetch page with locale parameter
// //     const page = await fetchSanityPageBySlug({
// //         slug,
// //         locale,
// //     });
//
// export default async function IndexPage(props: { params: { locale: string } }) {
//     const { locale } = await props.params;
//
//     // For home page, use "index" as the slug
//     const page = await fetchSanityPageBySlug({
//         slug: "index",
//         locale,
//     });
//
//     if (!page) {
//         //return MissingSanityPage({ document: "page", slug: slug });
//         return MissingSanityPage({ document: "page", slug: "index" });
//     }
//
//     // const translations = i18n.languages.map((lang) => {
//     //     return {
//     //         language: lang.id,
//     //         path: `/${lang.id}`,
//     //         title: lang.title,
//     //     }
//     // })
//
//     return (
//         <>
//             <Blocks
//                 blocks={page?.blocks ?? []}
//                 locale={locale}
//                 // translations={translations}
//             />
//         </>
//     );
// }
import Blocks from "@/components/blocks";
import { fetchSanityPageBySlug } from "@/sanity/lib/fetch";
import { generatePageMetadata } from "@/sanity/lib/metadata";
import MissingSanityPage from "@/components/ui/missing-sanity-page";
import { routing } from '@/i18n/routing';

export async function generateStaticParams() {
    return routing.locales.map((locale) => ({
        locale,
    }));
}

export async function generateMetadata() {
    const page = await fetchSanityPageBySlug({ slug: "index" });
    return generatePageMetadata({ page, slug: "index" });
}

interface IndexPageProps {
    params: Promise<{ locale: string }>
}

export default async function IndexPage({ params }: IndexPageProps) {
    const { locale } = await params;

    const page = await fetchSanityPageBySlug({
        slug: "index",
        locale,
    });

    if (!page) {
        return MissingSanityPage({ document: "page", slug: "index" });
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
