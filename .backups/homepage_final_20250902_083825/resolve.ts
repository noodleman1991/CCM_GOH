import {
  defineLocations,
  defineDocuments,
  PresentationPluginOptions,
} from "sanity/presentation";

export const resolve: PresentationPluginOptions["resolve"] = {
  locations: {
    // Homepage
    homepage: defineLocations({
      select: {
        title: "title",
        slug: "slug.current",
        language: "language",
      },
      resolve: (doc) => ({
        locations: [
          {
            title: doc?.title || "Homepage",
            href: doc?.slug === "index" ? "/" : `/${doc?.slug}`,
          },
        ],
      }),
    }),

    // Add more locations for other post types
    post: defineLocations({
      select: {
        title: "title",
        slug: "slug.current",
      },
      resolve: (doc) => ({
        locations: [
          {
            title: doc?.title || "Untitled",
            href: `/blog/${doc?.slug}`,
          },
          { title: "Blog", href: `/blog` },
        ],
      }),
    }),
  },
  mainDocuments: defineDocuments([
    // Homepage
    {
      route: "/",
      filter: `_type == 'homepage' && slug.current == 'index'`,
    },

    {
      route: "/",
      filter: `_type == 'page' && slug.current == 'index'`,
    },
    {
      route: "/:slug",
      filter: `_type == 'page' && slug.current == $slug`,
    },
    {
      route: "/blog/:slug",
      filter: `_type == 'post' && slug.current == $slug`,
    },
  ]),
};
