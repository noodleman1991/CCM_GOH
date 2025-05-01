import Blocks from "@/components/blocks";
import { fetchSanityPageBySlug } from "@/sanity/lib/fetch";
import { generatePageMetadata } from "@/sanity/lib/metadata";
import MissingSanityPage from "@/components/ui/missing-sanity-page";

export async function generateMetadata(props: { params: { locale: string } | Promise<{ locale: string }> }) {
    const params = await props.params;
    const locale = params.locale;

    const page = await fetchSanityPageBySlug({ slug: "index", locale });

    return generatePageMetadata({ page, slug: "index" });
}

export default async function IndexPage(props: { params: { locale: string } | Promise<{ locale: string }> }) {
    const params = await props.params;
    const locale = params.locale;

    const page = await fetchSanityPageBySlug({ slug: "index", locale });

    if (!page) {
        return MissingSanityPage({ document: "page", slug: "index" });
    }

    return <Blocks blocks={page?.blocks ?? []} />;
}
