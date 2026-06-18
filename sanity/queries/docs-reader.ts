import { groq } from "next-sanity";
import { client } from "@/sanity/lib/client";

/** Chapter list (nav) for a document collection. */
export const DOCS_CHAPTERS_QUERY = groq`
  *[_type == "docsChapter" && collection == $collection] | order(order asc){
    "slug": slug.current,
    title,
    order
  }
`;

/** One chapter's full body by slug. */
export const DOCS_CHAPTER_QUERY = groq`
  *[_type == "docsChapter" && collection == $collection && slug.current == $slug][0]{
    title,
    order,
    body
  }
`;

export async function fetchDocsChapters(collection: string) {
  return client.fetch<{ slug: string; title: string; order: number }[]>(DOCS_CHAPTERS_QUERY, { collection });
}

export async function fetchDocsChapter(collection: string, slug: string) {
  return client.fetch(DOCS_CHAPTER_QUERY, { collection, slug });
}
