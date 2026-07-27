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

  return pages.flatMap((page) => {
    const slug = page.slug?.current;
    // Home is served by (main)/page.tsx at /. /index redirects there in next.config.
    if (!slug || slug === "index") {
      return [];
    }

    return [{ slug: slug.split("/").filter(Boolean) }];
  });
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string[] }>;
}) {
  const [{ slug }, { perspective }] = await Promise.all([
    props.params,
    getDynamicFetchOptions(),
  ]);
  const slugPath = slug.join("/");
  const { data: page } = (await sanityFetchMetadata({
    query: PAGE_QUERY,
    params: { slug: slugPath },
    perspective,
  })) as { data: PAGE_QUERY_RESULT };

  if (!page) {
    notFound();
  }

  return generatePageMetadata({ page, slug: slugPath });
}

export default async function Page(props: {
  params: Promise<{ slug: string[] }>;
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
  return (
    <CachedPage slug={slug.join("/")} perspective="published" stega={false} />
  );
}

async function DynamicPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const [{ slug }, { perspective, stega }] = await Promise.all([
    params,
    getDynamicFetchOptions(),
  ]);

  return (
    <CachedPage slug={slug.join("/")} perspective={perspective} stega={stega} />
  );
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
