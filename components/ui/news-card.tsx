import Link from "next/link";
import { cn } from "@/lib/utils";
import NewsPostCard from "./news-post-card";

interface NewsCardProps {
  post: {
    _id: string;
    title: Record<string, string> | string;
    slug: { current: string };
    excerpt?: Record<string, string> | string;
    publishedAt?: string;
    image?: {
      asset?: { _id?: string; url?: string; metadata?: { lqip?: string } };
      alt?: string;
      hotspot?: unknown;
      crop?: unknown;
    };
    author?: {
      name: string;
      slug?: { current: string };
    };
    tags?: Array<{
      _id: string;
      label: string;
      value: string;
      color?: string;
    }>;
    featured?: boolean;
  };
  locale: string;
  variant?: "default" | "minimal";
}

export function NewsCard({ post, locale, variant = "default" }: NewsCardProps) {
  if (!post) return null;

  const href = `/${locale}/news/${post.slug?.current}`;

  if (variant === "minimal") {
    return (
      <Link href={href} className="group block">
        <article className="space-y-2">
          {post.image && (
            <div className="aspect-video bg-muted rounded-md overflow-hidden">
              <img
                src={post.image.asset?.url}
                alt={post.image.alt || ""}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
              {typeof post.title === "string" ? post.title : post.title?.[locale] || post.title?.en}
            </h3>
            {post.publishedAt && (
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(post.publishedAt).toLocaleDateString(locale)}
              </p>
            )}
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link href={href} className="group block h-full">
      <NewsPostCard
        title={post.title}
        excerpt={post.excerpt}
        image={post.image}
        tags={post.tags?.map(tag => ({
          title: { [locale]: tag.label },
          color: tag.color
        }))}
        author={post.author}
        publishedAt={post.publishedAt}
        locale={locale}
        featured={post.featured}
      />
    </Link>
  );
}