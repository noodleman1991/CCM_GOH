import Blocks from "@/components/blocks";
import { fetchSanityPageBySlug, PAGES_SLUGS_QUERY } from "@/sanity/lib/fetch";
import { notFound } from "next/navigation";
import { generatePageMetadata } from "@/sanity/lib/metadata";
import {
  getDynamicFetchOptions,
  sanityFetchMetadata,
  sanityFetchStaticParams,
  type DynamicFetchOptions,
} from "@/sanity/lib/live";
import { PAGE_QUERY_RESULT, PAGES_SLUGS_QUERY_RESULT } from "@/sanity.types";
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

export async function generateStaticParams() {
  const { data: pages } = (await sanityFetchStaticParams({
    query: PAGES_SLUGS_QUERY,
  })) as { data: PAGES_SLUGS_QUERY_RESULT };

  return (
    pages
      // Home is served by (main)/page.tsx at /. /index redirects there in next.config.
      .filter((page) => page.slug?.current && page.slug.current !== "index")
      .map((page) => ({
        slug: page.slug?.current,
      }))
  );
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}) {
  const [{ slug }, { perspective }] = await Promise.all([
    props.params,
    getDynamicFetchOptions(),
  ]);
  const { data: page } = (await sanityFetchMetadata({
    query: PAGE_QUERY,
    params: { slug },
    perspective,
  })) as { data: PAGE_QUERY_RESULT };

  if (!page) {
    notFound();
  }

  return generatePageMetadata({ page, slug });
}

export default async function Page(props: {
  params: Promise<{ slug: string }>;
}) {
  const { isEnabled: isDraftMode } = await draftMode();

  if (isDraftMode) {
    return (
      <Suspense fallback={<PageFallback />}>
        <DynamicPage params={props.params} />
      </Suspense>
    );
  }

  const { slug } = await props.params;
  return <CachedPage slug={slug} perspective="published" stega={false} />;
}

async function DynamicPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, { perspective, stega }] = await Promise.all([
    params,
    getDynamicFetchOptions(),
  ]);

  return <CachedPage slug={slug} perspective={perspective} stega={stega} />;
}

async function CachedPage({
  slug,
  perspective,
  stega,
}: { slug: string } & DynamicFetchOptions) {
  const page = await fetchSanityPageBySlug({ slug, perspective, stega });

  if (!page) {
    notFound();
  }

  return (
    <Blocks
      blocks={page?.blocks ?? []}
      perspective={perspective}
      stega={stega}
    />
  );
}
