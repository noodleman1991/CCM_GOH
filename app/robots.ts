import { MetadataRoute } from "next";

// Private / authenticated / staff areas — never index, never crawl.
const DISALLOW = [
  "/dashboard",
  "/messages",
  "/moderation",
  "/onboarding",
  "/api/",
  "/studio",
  "/sign-in",
  "/sign-up",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Everyone (incl. search engines): crawl public content, skip private.
        userAgent: "*",
        allow: "/",
        disallow: DISALLOW,
      },
      {
        // AI training crawlers: explicit so the policy is unambiguous. Allows
        // public content; keeps private areas out. Adjust per the team's stance.
        userAgent: ["GPTBot", "ChatGPT-User", "CCBot", "Google-Extended", "anthropic-ai", "ClaudeBot", "PerplexityBot"],
        allow: "/",
        disallow: DISALLOW,
      },
    ],
    sitemap: [`${process.env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`],
  };
}
