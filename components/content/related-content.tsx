import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { getLocalizedText } from "@/lib/localization-utils";
import { SectionHeader } from "@/components/ui/section-header";
import { BookOpen, Heart, Newspaper, FileText, FolderKanban, Globe } from "lucide-react";

/** A resolved connection target (from RELATED_CONTENT_PROJECTION). */
interface RelatedTarget {
  _type: string;
  _id: string;
  slug?: string;
  title?: any;
  excerpt?: any;
  image?: { asset?: { url?: string }; alt?: string };
  status?: string;
}
interface Connection {
  relation?: string;
  target?: RelatedTarget | null;
}

// Per-type presentation: where it links, its icon, and a label — so a "Related"
// strip reads correctly across content types (case study layouts, lived
// experience formats, news, etc.).
const TYPE_META: Record<
  string,
  { href: (slug?: string) => string; icon: typeof BookOpen; labelKey: string }
> = {
  caseStudy: { href: (s) => `/research-and-action/case-studies/${s}`, icon: BookOpen, labelKey: "Case study" },
  livedExperience: { href: (s) => `/lived-experiences/${s}`, icon: Heart, labelKey: "Lived experience" },
  newsPost: { href: (s) => `/news/${s}`, icon: Newspaper, labelKey: "News" },
  report: { href: (s) => `/research-and-action/impact-reports`, icon: FileText, labelKey: "Report" },
  project: { href: (s) => `/collaborations/${s}`, icon: FolderKanban, labelKey: "Project" },
  regionalCommunity: { href: (s) => `/communities/${s}`, icon: Globe, labelKey: "Community" },
};

function plainTitle(title: any, locale: string): string {
  if (!title) return "";
  if (typeof title === "string") return title;
  return getLocalizedText(title, locale, "");
}

/**
 * Content-type-aware "Related" strip for the bottom of a detail page. Renders
 * each connection target as a compact card that links to the right place and is
 * badged by its type. Only renders when there are links (no empty section).
 */
export function RelatedContent({
  items,
  locale,
  heading,
}: {
  items?: Connection[] | null;
  locale: string;
  heading: string;
}) {
  const valid = (items || []).filter(
    (c): c is Connection & { target: RelatedTarget } =>
      Boolean(c?.target && TYPE_META[c.target._type])
  );
  if (valid.length === 0) return null;

  return (
    <section className="space-y-5">
      <SectionHeader title={heading} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {valid.map(({ target, relation }) => {
          const meta = TYPE_META[target._type];
          const Icon = meta.icon;
          const title = plainTitle(target.title, locale);
          const excerpt = plainTitle(target.excerpt, locale);
          const img = target.image?.asset?.url;
          return (
            <Link
              key={target._id}
              href={meta.href(target.slug)}
              className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition-shadow hover:border-primary/50 hover:shadow-md"
            >
              <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-ccm-sky/40 to-ccm-water/30">
                {img && (
                  <Image
                    src={img}
                    alt={target.image?.alt || title}
                    fill
                    className="object-cover transition-transform duration-200 group-hover:scale-105"
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  />
                )}
                <span className="absolute inset-x-3 top-3 inline-flex w-fit items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-ccm-midnight">
                  <Icon className="size-3" />
                  {meta.labelKey}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-1.5 p-4">
                {relation && relation !== "related" && (
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-ccm-water">
                    {relation.replace(/-/g, " ")}
                  </span>
                )}
                <h3 className="font-heading text-base font-semibold leading-snug text-balance line-clamp-2 text-ccm-midnight group-hover:text-primary">
                  {title}
                </h3>
                {excerpt && <p className="line-clamp-2 text-sm text-muted-foreground">{excerpt}</p>}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default RelatedContent;
