import Blocks from "@/components/blocks";
import { fetchSanityPageBySlug } from "@/sanity/lib/fetch";
import { generatePageMetadata } from "@/sanity/lib/metadata";
import MissingSanityPage from "@/components/ui/missing-sanity-page";
import {
  getDynamicFetchOptions,
  sanityFetchMetadata,
  type DynamicFetchOptions,
} from "@/sanity/lib/live";
import { PAGE_QUERY_RESULT } from "@/sanity.types";
import { PAGE_QUERY } from "@/sanity/queries/page";
import { draftMode } from "next/headers";
import { Suspense } from "react";

function PageFallback() {
  return (
    <div aria-busy className="container py-16">
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
    </div>
  );
}

export async function generateMetadata() {
  const { perspective } = await getDynamicFetchOptions();
  const { data: page } = (await sanityFetchMetadata({
    query: PAGE_QUERY,
    params: { slug: "index" },
    perspective,
  })) as { data: PAGE_QUERY_RESULT };

  return generatePageMetadata({ page, slug: "index" });
}

export default async function IndexPage() {
  const { isEnabled: isDraftMode } = await draftMode();

  if (isDraftMode) {
    return (
      <Suspense fallback={<PageFallback />}>
        <DynamicIndexPage />
      </Suspense>
    );
  }

  return <CachedIndexPage perspective="published" stega={false} />;
}

async function DynamicIndexPage() {
  const { perspective, stega } = await getDynamicFetchOptions();
  return <CachedIndexPage perspective={perspective} stega={stega} />;
}

async function CachedIndexPage({ perspective, stega }: DynamicFetchOptions) {
  const page = await fetchSanityPageBySlug({
    slug: "index",
    perspective,
    stega,
  });

  if (!page) {
    return MissingSanityPage({ document: "page", slug: "index" });
  }

  return (
    <Blocks
      blocks={page?.blocks ?? []}
      perspective={perspective}
      stega={stega}
    />
  );
}
