export const revalidate = 60;

import type { Metadata } from "next"
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import PostHero from "@/components/blocks/post-hero";
import { BreadcrumbLink } from "@/types";
import PortableTextRenderer from "@/components/portable-text-renderer";
import {
  fetchSanityPostBySlug,
  fetchSanityPostsStaticParams,
} from "@/sanity/lib/fetch";
import { getTranslations } from "next-intl/server";

export async function generateStaticParams() {
  const posts = await fetchSanityPostsStaticParams();
  const locales = ["en", "es", "fr", "ar"];

  // Emit one entry per (post, locale) so every localized URL is pre-rendered.
  // Posts without a translation fall back to English at request time
  // (fetchSanityPostBySlug handles the fallback).
  return posts.flatMap((post) =>
    post.slug?.current
      ? locales.map((locale) => ({ locale, slug: post.slug!.current }))
      : []
  );
}

// export async function generateMetadata(props: {
//   params: Promise<{ slug: string }>;
// }) {
//   const params = await props.params;
//   const post = await fetchSanityPostBySlug({ slug: params.slug });
//
//   if (!post) {
//     notFound();
//   }
//
//   return generatePageMetadata({ page: post, slug: `/blog/${params.slug}` });
// }

export default async function PostPage(props: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const params = await props.params;
  const post = await fetchSanityPostBySlug(params);

  if (!post) {
    notFound();
  }

  const t = await getTranslations({ locale: params.locale, namespace: "navigation" });

  const links: BreadcrumbLink[] = post
    ? [
        {
          label: t("home"),
          href: "/",
        },
        {
          label: t("blog"),
          href: "/blog",
        },
        {
          label: post.title as string,
          href: "#",
        },
      ]
    : [];

  return (
    <section>
      <div className="container py-16 xl:py-20">
        <article className="max-w-3xl mx-auto">
          <Breadcrumbs links={links} />
          <PostHero {...post} />
          {post.body && <PortableTextRenderer value={post.body} locale={params.locale} />}
        </article>
      </div>
    </section>
  );
}
