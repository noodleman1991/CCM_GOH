import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import PostHero from "@/components/blocks/post-hero";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { fetchSanityPostBySlug, POSTS_SLUGS_QUERY } from "@/sanity/lib/fetch";
import { generatePageMetadata } from "@/sanity/lib/metadata";
import {
  getDynamicFetchOptions,
  sanityFetchMetadata,
  sanityFetchStaticParams,
  type DynamicFetchOptions,
} from "@/sanity/lib/live";
import { POST_QUERY_RESULT, POSTS_SLUGS_QUERY_RESULT } from "@/sanity.types";
import { POST_QUERY } from "@/sanity/queries/post";
import { draftMode } from "next/headers";
import { Suspense } from "react";

type BreadcrumbLink = {
  label: string;
  href: string;
};

function PageFallback() {
  return (
    <section aria-busy>
      <div className="container py-16 xl:py-20">
        <article className="max-w-3xl mx-auto">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        </article>
      </div>
    </section>
  );
}

export async function generateStaticParams() {
  const { data: posts } = (await sanityFetchStaticParams({
    query: POSTS_SLUGS_QUERY,
  })) as { data: POSTS_SLUGS_QUERY_RESULT };

  return posts.map((post) => ({
    slug: post.slug?.current,
  }));
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}) {
  const [{ slug }, { perspective }] = await Promise.all([
    props.params,
    getDynamicFetchOptions(),
  ]);
  const { data: post } = (await sanityFetchMetadata({
    query: POST_QUERY,
    params: { slug },
    perspective,
  })) as { data: POST_QUERY_RESULT };

  if (!post) {
    notFound();
  }

  return generatePageMetadata({ page: post, slug: `blog/${slug}` });
}

export default async function PostPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { isEnabled: isDraftMode } = await draftMode();

  if (isDraftMode) {
    return (
      <Suspense fallback={<PageFallback />}>
        <DynamicPostPage params={props.params} />
      </Suspense>
    );
  }

  const { slug } = await props.params;
  return <CachedPostPage slug={slug} perspective="published" stega={false} />;
}

async function DynamicPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [{ slug }, { perspective, stega }] = await Promise.all([
    params,
    getDynamicFetchOptions(),
  ]);

  return <CachedPostPage slug={slug} perspective={perspective} stega={stega} />;
}

async function CachedPostPage({
  slug,
  perspective,
  stega,
}: { slug: string } & DynamicFetchOptions) {
  const post = await fetchSanityPostBySlug({ slug, perspective, stega });

  if (!post) {
    notFound();
  }

  const links: BreadcrumbLink[] = [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Blog",
      href: "/blog",
    },
    {
      label: post.title as string,
      href: "#",
    },
  ];

  return (
    <section>
      <div className="container py-16 xl:py-20">
        <article className="max-w-3xl mx-auto">
          <Breadcrumbs links={links} />
          <PostHero {...post} />
          {post.body && <PortableTextRenderer value={post.body} />}
        </article>
      </div>
    </section>
  );
}
