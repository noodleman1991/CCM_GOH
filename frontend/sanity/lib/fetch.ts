import { sanityFetch, type DynamicFetchOptions } from "@/sanity/lib/live";
import { PAGE_QUERY, PAGES_SLUGS_QUERY } from "@/sanity/queries/page";
import { NAVIGATION_QUERY } from "@/sanity/queries/navigation";
import { SETTINGS_QUERY } from "@/sanity/queries/settings";
import {
  POST_QUERY,
  POSTS_QUERY,
  POSTS_SLUGS_QUERY,
} from "@/sanity/queries/post";
import {
  PAGE_QUERY_RESULT,
  POST_QUERY_RESULT,
  POSTS_QUERY_RESULT,
  NAVIGATION_QUERY_RESULT,
  SETTINGS_QUERY_RESULT,
} from "@/sanity.types";

export async function fetchSanityPageBySlug({
  slug,
  perspective,
  stega,
}: {
  slug: string;
} & DynamicFetchOptions): Promise<PAGE_QUERY_RESULT> {
  "use cache";
  const { data } = await sanityFetch({
    query: PAGE_QUERY,
    params: { slug },
    perspective,
    stega,
  });

  return data as PAGE_QUERY_RESULT;
}

export async function fetchSanityPosts({
  perspective,
  stega,
}: DynamicFetchOptions): Promise<POSTS_QUERY_RESULT> {
  "use cache";
  const { data } = await sanityFetch({
    query: POSTS_QUERY,
    perspective,
    stega,
  });

  return data as POSTS_QUERY_RESULT;
}

export async function fetchSanityPostBySlug({
  slug,
  perspective,
  stega,
}: {
  slug: string;
} & DynamicFetchOptions): Promise<POST_QUERY_RESULT> {
  "use cache";
  const { data } = await sanityFetch({
    query: POST_QUERY,
    params: { slug },
    perspective,
    stega,
  });

  return data as POST_QUERY_RESULT;
}

export async function fetchSanityNavigation({
  perspective,
  stega,
}: DynamicFetchOptions): Promise<NAVIGATION_QUERY_RESULT> {
  "use cache";
  const { data } = await sanityFetch({
    query: NAVIGATION_QUERY,
    perspective,
    stega,
  });

  return data as NAVIGATION_QUERY_RESULT;
}

export async function fetchSanitySettings({
  perspective,
  stega,
}: DynamicFetchOptions): Promise<SETTINGS_QUERY_RESULT> {
  "use cache";
  const { data } = await sanityFetch({
    query: SETTINGS_QUERY,
    perspective,
    stega,
  });

  return data as SETTINGS_QUERY_RESULT;
}

export async function getCurrentYear(): Promise<number> {
  "use cache";
  return new Date().getFullYear();
}

export { PAGES_SLUGS_QUERY, POSTS_SLUGS_QUERY };
