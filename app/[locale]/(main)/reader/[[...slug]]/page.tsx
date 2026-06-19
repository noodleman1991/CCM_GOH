export const revalidate = 300;

import type { Metadata } from "next";
import type { PortableTextBlock } from "@portabletext/types";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { heading } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { fetchDocsChapters, fetchDocsChapter } from "@/sanity/queries/docs-reader";
import { ReaderNav } from "@/components/reader/reader-nav";
import { ReaderToc } from "@/components/reader/reader-toc";
import { ReaderFootnotes } from "@/components/reader/reader-footnotes";
import { extractToc, extractFootnotes, stripLeadingTitleHeading } from "@/lib/portable-text-headings";

const COLLECTION = "global-agenda";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug?: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const current = slug?.[0];
  if (!current) return { title: "Global Research and Action Agenda" };
  const chapter = await fetchDocsChapter(COLLECTION, current);
  return { title: chapter?.title ?? "Reader" };
}

export default async function ReaderPage({
  params,
}: {
  params: Promise<{ locale: string; slug?: string[] }>;
}) {
  const { locale, slug } = await params;
  const isRTL = locale === "ar";

  const chapters = await fetchDocsChapters(COLLECTION);
  if (chapters.length === 0) {
    // Content not yet imported — show a calm placeholder rather than a 404.
    return (
      <div className="container max-w-prose py-16 text-center">
        <h1 className={cn("font-heading font-bold text-ccm-midnight", heading("lg"))}>
          Global Research and Action Agenda
        </h1>
        <p className="mt-4 text-muted-foreground">
          The chapter-by-chapter reader is being prepared.
        </p>
        <Button asChild className="mt-6">
          <Link href="/research-and-action/agendas">Browse the agendas</Link>
        </Button>
      </div>
    );
  }

  const currentSlug = slug?.[0] ?? chapters[0].slug;
  const idx = chapters.findIndex((c) => c.slug === currentSlug);
  if (idx === -1) notFound();

  const chapter = await fetchDocsChapter(COLLECTION, currentSlug);
  if (!chapter) notFound();

  const prev = idx > 0 ? chapters[idx - 1] : null;
  const next = idx < chapters.length - 1 ? chapters[idx + 1] : null;
  // Remove a leading body heading that just repeats the chapter title (shown
  // as <h1> below), so chapters don't render a "double title".
  const body = stripLeadingTitleHeading(
    (chapter.body ?? []) as PortableTextBlock[],
    chapter.title
  );
  const toc = extractToc(body);
  const { footnotes, numberByKey } = extractFootnotes(body);
  const tNav = await getTranslations("navigation");
  const documentTitle = "Global Research and Action Agenda";

  return (
    <div className="container max-w-7xl py-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Breadcrumb: Reader › Agenda › Chapter */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/research-and-action/global-agenda">{tNav("globalAgenda")}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="rtl:-scale-x-100" />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/reader">{documentTitle}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="rtl:-scale-x-100" />
          <BreadcrumbItem>
            <BreadcrumbPage><bdi>{chapter.title}</bdi></BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Docs layout: chapters · article · on-this-page */}
      <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_200px]">
        {/* Chapter nav — drawer on mobile, sticky sidebar at lg */}
        <ReaderNav chapters={chapters} currentSlug={currentSlug} />

        <article className="min-w-0">
          <div className="mx-auto max-w-prose">
            <p className="text-xs font-semibold uppercase tracking-wider text-ccm-water">
              {chapter.order}. <span className="capitalize">{COLLECTION.replace(/-/g, " ")}</span>
            </p>
            <h1 className={cn("mt-1 mb-6 text-balance font-heading font-bold text-ccm-midnight", heading("lg"))}>
              {chapter.title}
            </h1>
            {body.length > 0 && (
              <div className="text-base md:text-lg leading-relaxed">
                <PortableTextRenderer
                  value={body}
                  locale={locale}
                  isRTL={isRTL}
                  footnoteNumbers={numberByKey}
                />
              </div>
            )}

            {/* Footnotes — collapsible, small font, anchored to the markers */}
            <ReaderFootnotes footnotes={footnotes} />

            {/* Prev / next */}
            <nav className="mt-12 flex items-center justify-between gap-4 border-t pt-6">
              {prev ? (
                <Button asChild variant="ghost">
                  <Link href={`/reader/${prev.slug}`} className="flex items-center gap-2">
                    <ArrowLeft className="size-4 rtl:-scale-x-100" />
                    <span className="truncate"><bdi>{prev.title}</bdi></span>
                  </Link>
                </Button>
              ) : (
                <span />
              )}
              {next && (
                <Button asChild variant="ghost" className="ms-auto">
                  <Link href={`/reader/${next.slug}`} className="flex items-center gap-2">
                    <span className="truncate"><bdi>{next.title}</bdi></span>
                    <ArrowRight className="size-4 rtl:-scale-x-100" />
                  </Link>
                </Button>
              )}
            </nav>
          </div>
        </article>

        {/* On this page — scroll-spy TOC (xl only) */}
        <ReaderToc items={toc} />
      </div>
    </div>
  );
}
