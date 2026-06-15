import SectionContainer from "@/components/ui/section-container";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { Calendar, User } from "lucide-react";
import { stegaClean } from "next-sanity";
import { getTranslations } from "next-intl/server";
import { PAGE_QUERY_RESULT } from "@/sanity.types";
import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";
import { urlFor } from "@/sanity/lib/image";
import { getLocalizedField } from "@/lib/localization-utils";

type AllPostsProps = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "all-posts" }
> & {
  locale?: string;
};

// Shared fragment for news post fields
const NEWS_POST_FIELDS = groq`
  _id,
  _type,
  title,
  subtitle,
  excerpt,
  "slug": slug.current,
  publishedAt,
  _updatedAt,
  featured,
  image{
    asset->{
      _id,
      url,
      mimeType,
      metadata {
        lqip,
        dimensions {
          width,
          height
        }
      }
    },
    alt,
    caption
  },
  author->{
    _id,
    name,
    image,
    bio
  },
  tags[]->{
    _id,
    label,
    value,
    color,
    category
  },
  language
`;

async function fetchNewsPosts(mode: string, limit: number, manualPosts?: any[]) {
  // Manual mode: fetch specific posts
  if (mode === "manual" && manualPosts && manualPosts.length > 0) {
    const manualPostIds = manualPosts.map(ref => ref._ref).filter(Boolean);

    if (manualPostIds.length === 0) {
      return [];
    }

    return await client.fetch(
      groq`*[_type == "newsPost" && _id in $ids] {
        ${NEWS_POST_FIELDS}
      }`,
      { ids: manualPostIds }
    );
  }

  // Featured mode: featured first, then recent to fill quota
  if (mode === "featured") {
    const featured = await client.fetch(
      groq`*[_type == "newsPost" &&
        featured == true &&
        publishedAt <= now()
      ] | order(publishedAt desc)[0...${limit}] {
        ${NEWS_POST_FIELDS}
      }`
    );

    // If we have enough featured posts, return them
    if (featured.length >= limit) {
      return featured.slice(0, limit);
    }

    // Otherwise, fetch recent posts to fill the quota
    const remaining = limit - featured.length;
    const recent = await client.fetch(
      groq`*[_type == "newsPost" &&
        (!defined(featured) || featured == false) &&
        publishedAt <= now()
      ] | order(publishedAt desc)[0...${remaining}] {
        ${NEWS_POST_FIELDS}
      }`
    );

    return [...featured, ...recent];
  }

  // Recent mode: most recent posts only
  return await client.fetch(
    groq`*[_type == "newsPost" &&
      publishedAt <= now()
    ] | order(publishedAt desc)[0...${limit}] {
      ${NEWS_POST_FIELDS}
    }`
  );
}

export default async function AllPosts({
  padding,
  mode,
  limit,
  manualPosts,
  locale = "en",
}: AllPostsProps) {
  const supportedLocale = locale as 'en' | 'es' | 'fr' | 'ar';
  const displayMode = stegaClean(mode) || "featured";
  const displayLimit = stegaClean(limit) || 6;

  const posts = await fetchNewsPosts(displayMode, displayLimit, manualPosts as any);

  if (!posts || posts.length === 0) {
    const t = await getTranslations({ locale: supportedLocale, namespace: "blocks" });
    return (
      <SectionContainer padding={padding}>
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">{t("noPostsTitle")}</p>
          <p className="text-sm mt-2">{t("noPostsBody")}</p>
        </div>
      </SectionContainer>
    );
  }

  return (
    <SectionContainer padding={padding}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post: any) => {
          // Extract localized content
          const title = typeof post.title === 'string'
            ? post.title
            : getLocalizedField(post.title, supportedLocale, '');
          const excerpt = typeof post.excerpt === 'string'
            ? post.excerpt
            : getLocalizedField(post.excerpt, supportedLocale, '');
          const imageUrl = post.image?.asset?._id
            ? urlFor(post.image).width(800).url()
            : post.image?.asset?.url || null;

          return (
            <Link key={post._id} href={`/news/${post.slug}`} className="group">
              <Card className="h-full overflow-hidden transition-shadow hover:shadow-lg">
                {imageUrl && (
                  <div className="relative h-48 w-full overflow-hidden">
                    <Image
                      src={imageUrl}
                      alt={post.image?.alt || title}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(min-width: 1024px) 384px, (min-width: 768px) 50vw, 100vw"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Calendar className="h-4 w-4" />
                    <time dateTime={post.publishedAt}>
                      {new Date(post.publishedAt).toLocaleDateString(supportedLocale, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </time>
                  </div>
                  <h3 className="text-xl font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                    {title}
                  </h3>
                </CardHeader>
                <CardContent>
                  {excerpt && (
                    <p className="text-muted-foreground line-clamp-3 mb-4">
                      {excerpt}
                    </p>
                  )}
                  {post.author && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{post.author.name}</span>
                    </div>
                  )}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {post.tags.slice(0, 3).map((tag: any) => {
                        const tagLabel = typeof tag.label === 'string'
                          ? tag.label
                          : getLocalizedField(tag.label, supportedLocale, '');
                        return (
                          <Badge key={tag._id} variant="secondary" style={{ backgroundColor: tag.color ? `${tag.color}20` : undefined }}>
                            {tagLabel}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </SectionContainer>
  );
}
