import { sanityFetch } from "@/sanity/lib/live";
import { PAGE_QUERY, PAGES_SLUGS_QUERY } from "@/sanity/queries/page";
import {
  POST_QUERY,
  POSTS_QUERY,
  POSTS_SLUGS_QUERY,
} from "@/sanity/queries/post";
import {
  PAGE_QUERYResult,
  PAGES_SLUGS_QUERYResult,
  POST_QUERYResult,
  POSTS_QUERYResult,
  POSTS_SLUGS_QUERYResult,
} from "@/sanity.types";

// export const fetchSanityPageBySlug = async ({
//   slug,
// }: {
//   slug: string;
// }): Promise<PAGE_QUERYResult> => {
//   const { data } = await sanityFetch({
//     query: PAGE_QUERY,
//     params: { slug },
//   });
//
//   return data;
// };

export const fetchSanityPageBySlug = async ({
                                                slug,
                                                locale = 'en',
                                            }: {
    slug: string;
    locale?: string; // Make it optional with ?
}): Promise<PAGE_QUERYResult> => {
    const { data } = await sanityFetch({
        query: PAGE_QUERY,
        params: {
            slug,
            language: locale
        },
    });

    return data;
};

// export const fetchSanityPagesStaticParams =
//   async (): Promise<PAGES_SLUGS_QUERYResult> => {
//     const { data } = await sanityFetch({
//       query: PAGES_SLUGS_QUERY,
//       perspective: "published",
//       stega: false,
//     });
//
//     return data;
//   };

export const fetchSanityPagesStaticParams = async () => {
    const { data } = await sanityFetch({
        query: `*[_type == "page" && defined(slug)]{
      _id,
      slug { current },
      language
    }`,
        perspective: "published",
        stega: false,
    });

    return data;
};

export const fetchTranslationsForPage = async (pageId: string) => {
    const { data } = await sanityFetch({
        query: `
      *[_type == "translation.metadata" && references($pageId)][0]{
        "translations": translations[].value->{
          _id,
          language,
          slug
        }
      }.translations`,
        params: { pageId },
        perspective: "published",
        stega: false,
    });

    return data;
};

export const fetchSanityPosts = async (): Promise<POSTS_QUERYResult> => {
  const { data } = await sanityFetch({
    query: POSTS_QUERY,
  });

  return data;
};

export const fetchSanityPostBySlug = async ({
                                                slug,
                                                locale = 'en',
                                            }: {
    slug: string;
    locale?: string;
}): Promise<POST_QUERYResult> => {
    const { data } = await sanityFetch({
        query: POST_QUERY,
        params: {
            slug,
            language: locale
        },
    });

    return data;
};

export const fetchSanityPostsStaticParams =
  async (): Promise<POSTS_SLUGS_QUERYResult> => {
    const { data } = await sanityFetch({
      query: POSTS_SLUGS_QUERY,
      perspective: "published",
      stega: false,
    });

    return data;
  };
