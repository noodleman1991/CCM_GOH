"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Menu, BookText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

type Chapter = { slug: string; title: string; order: number };

function ChapterList({ chapters, currentSlug }: { chapters: Chapter[]; currentSlug: string }) {
  return (
    <nav className="space-y-0.5">
      {chapters.map((c) => (
        <Link
          key={c.slug}
          href={`/reader/${c.slug}`}
          className={cn(
            "block rounded-md px-3 py-2 text-sm transition-colors",
            c.slug === currentSlug
              ? "bg-ccm-sky/20 font-medium text-ccm-sea"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <span className="me-2 tabular-nums text-xs text-ccm-water">{c.order}</span>
          <bdi>{c.title}</bdi>
        </Link>
      ))}
    </nav>
  );
}

export function ReaderNav({ chapters, currentSlug }: { chapters: Chapter[]; currentSlug: string }) {
  const t = useTranslations("reader");

  return (
    <>
      {/* Mobile: chapters in a drawer */}
      <div className="lg:hidden">
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline" className="w-full justify-start gap-2">
              <Menu className="size-4" />
              {t("chapters")}
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <div className="max-h-[70vh] overflow-y-auto p-4">
              <ChapterList chapters={chapters} currentSlug={currentSlug} />
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      {/* Desktop: sticky sidebar */}
      <aside className="hidden lg:block">
        <div className="sticky top-20">
          <p className="mb-3 flex items-center gap-2 px-3 text-xs font-semibold uppercase tracking-wider text-ccm-water">
            <BookText className="size-4" />
            {t("chapters")}
          </p>
          <ChapterList chapters={chapters} currentSlug={currentSlug} />
        </div>
      </aside>
    </>
  );
}
