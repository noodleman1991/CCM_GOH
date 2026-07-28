export const revalidate = 300;

import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Newspaper } from "lucide-react";
import { fetchSanityPosts } from "@/sanity/lib/fetch";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  return { title: t("pageTitle"), description: t("pageDescription") };
}

export default async function BlogIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  const posts = (await fetchSanityPosts()) ?? [];

  return (
    <div className="container py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
          {t("pageTitle")}
        </h1>
        <p className="text-muted-foreground max-w-2xl">{t("pageDescription")}</p>
      </div>

      {posts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map(
            (post) =>
              post.slug?.current && (
                <Link
                  key={post.slug.current}
                  href={`/blog/${post.slug.current}`}
                  className="group"
                >
                  <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
                    {post.image?.asset?.url && (
                      <div className="relative aspect-video">
                        <Image
                          src={post.image.asset.url}
                          alt={post.image.alt ?? ""}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                          placeholder={
                            post.image.asset.metadata?.lqip ? "blur" : "empty"
                          }
                          blurDataURL={post.image.asset.metadata?.lqip ?? undefined}
                        />
                      </div>
                    )}
                    <CardContent className="p-5 space-y-2">
                      <h2 className="font-semibold leading-snug line-clamp-2 group-hover:underline">
                        {post.title}
                      </h2>
                      {post.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {post.excerpt}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              )
          )}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <div className="space-y-3">
            <Newspaper className="w-12 h-12 mx-auto text-muted-foreground/50" />
            <h3 className="text-lg font-medium">{t("noPosts")}</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {t("noPostsDescription")}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
