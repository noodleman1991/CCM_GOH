"use client";

import * as React from "react";
import type { SearchClient } from "algoliasearch";
import { ALGOLIA_INDICES } from "@/lib/algolia";
import type {
  CaseStudySearchRecord,
  NewsSearchRecord,
  UserSearchRecord,
} from "@/lib/algolia";
import { useAlgoliaSearchClient } from "@/lib/algolia-client";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@clerk/nextjs";
import { useRouter, Link } from "@/i18n/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookOpen, Newspaper, ArrowRight, Loader2 } from "lucide-react";
import { getLocalizedTitle } from "@/lib/localization-utils";
import {
  REGION_CODES,
  REGION_I18N_KEY,
  REGION_TO_RC_SLUG,
} from "@/lib/maps/region-codes";
import { regionColor } from "@/lib/ccm-colors";
import { cn } from "@/lib/utils";

/** A flat, keyboard-navigable command-palette result. */
type Item = {
  id: string;
  href: string;
  title: string;
  group: "caseStudies" | "news" | "people" | "regions";
  icon: React.ReactNode;
};

const PER_GROUP = 4;

/**
 * Live, in-modal search results (Algolia command-palette style). Runs ONE
 * multi-index query on the debounced term across case studies, news and people,
 * plus a client-side match over the fixed regions. Results are a flat list so
 * ↑/↓/Enter navigate the whole palette; a footer routes to the full /search page.
 *
 * Signed-in state is read HERE, not in the always-mounted SearchModal shell:
 * with ClerkProvider `dynamic`, useAuth() reads a promise-backed store, and
 * touching it during the shell's hydration pass skewed the useId tree for the
 * modal's later siblings (the report-issue trigger's aria-controls mismatch).
 * This component only mounts once the dialog opens, safely after hydration.
 */
export function SearchDialogResults({
  query,
  onNavigate,
  footerHref,
}: {
  query: string;
  /** Called when a result is chosen (so the modal can close). */
  onNavigate: () => void;
  /** "See all results" target. */
  footerHref: string;
}) {
  const t = useTranslations("search");
  const tRoot = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { isSignedIn: isSignedInRaw } = useAuth();
  const isSignedIn = Boolean(isSignedInRaw);
  const { client: searchClient, isLoading: clientLoading } = useAlgoliaSearchClient();
  const [loading, setLoading] = React.useState(false);
  const [errored, setErrored] = React.useState(false);
  const [groups, setGroups] = React.useState<{
    caseStudies: Item[];
    news: Item[];
    people: Item[];
  }>({ caseStudies: [], news: [], people: [] });
  const [active, setActive] = React.useState(0);

  const q = query.trim();

  // Regions match client-side (no index).
  const regionItems = React.useMemo<Item[]>(() => {
    if (!q) return [];
    const lc = q.toLowerCase();
    return REGION_CODES.filter((code) => {
      const label = tRoot(`navigation.regions.${REGION_I18N_KEY[code]}`).toLowerCase();
      return label.includes(lc) || code.toLowerCase().includes(lc);
    }).map((code) => ({
      id: `region-${code}`,
      href: `/communities/${REGION_TO_RC_SLUG[code]}`,
      title: tRoot(`navigation.regions.${REGION_I18N_KEY[code]}`),
      group: "regions" as const,
      icon: (
        <span
          className="size-2.5 rounded-full"
          style={{ backgroundColor: regionColor(code) }}
          aria-hidden="true"
        />
      ),
    }));
  }, [q, tRoot]);

  // Debounced multi-index Algolia query.
  React.useEffect(() => {
    if (!q) {
      setGroups({ caseStudies: [], news: [], people: [] });
      setLoading(false);
      return;
    }
    // Search client still fetching its token (see lib/algolia-client) — keep
    // showing the loading state rather than a premature "unavailable".
    if (!searchClient) {
      setGroups({ caseStudies: [], news: [], people: [] });
      setLoading(clientLoading);
      setErrored(!clientLoading);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setErrored(false);
    const handle = setTimeout(async () => {
      try {
        const peopleFilter = isSignedIn
          ? "isSearchable:true AND (profileVisibility:PUBLIC OR profileVisibility:MEMBERS)"
          : "isSearchable:true AND profileVisibility:PUBLIC";
        const { results } = await searchClient.search([
          { indexName: ALGOLIA_INDICES.CASE_STUDIES, params: { query: q, hitsPerPage: PER_GROUP, filters: "status:approved AND accessLevel:public" } },
          { indexName: ALGOLIA_INDICES.NEWS, params: { query: q, hitsPerPage: PER_GROUP, filters: isSignedIn ? "accessLevel:public OR accessLevel:registered" : "accessLevel:public" } },
          { indexName: ALGOLIA_INDICES.USERS, params: { query: q, hitsPerPage: PER_GROUP, filters: peopleFilter } },
        ] as Parameters<SearchClient["search"]>[0]);
        if (cancelled) return;
        const [cs, news, users] = results as unknown as [
          { hits?: CaseStudySearchRecord[] },
          { hits?: NewsSearchRecord[] },
          { hits?: UserSearchRecord[] },
        ];
        setGroups({
          caseStudies: (cs?.hits || []).map((h: CaseStudySearchRecord) => ({
            id: h.objectID,
            href: `/research-and-action/case-studies/${h.slug}`,
            title: getLocalizedTitle(h.title, locale),
            group: "caseStudies" as const,
            icon: <BookOpen className="size-4 text-ccm-sea" />,
          })),
          news: (news?.hits || []).map((h: NewsSearchRecord) => ({
            id: h.objectID,
            href: `/news/${h.slug}`,
            title: getLocalizedTitle(h.title, locale),
            group: "news" as const,
            icon: <Newspaper className="size-4 text-ccm-sea" />,
          })),
          people: (users?.hits || []).map((h: UserSearchRecord) => ({
            id: h.objectID,
            href: `/profiles/${h.username}`,
            title: h.fullName || h.username,
            group: "people" as const,
            icon: (
              <Avatar className="size-5">
                <AvatarImage src={h.profileImage} alt={h.fullName} />
                <AvatarFallback className="text-[9px]">
                  {`${h.firstName?.[0] || ""}${h.lastName?.[0] || ""}`.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ),
          })),
        });
      } catch {
        // Algolia unreachable / bad key — surface a clear state, don't pretend
        // there are simply no matches (regions, which are client-side, still show).
        if (!cancelled) {
          setGroups({ caseStudies: [], news: [], people: [] });
          setErrored(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [q, isSignedIn, locale, searchClient, clientLoading]);

  // Flattened list in display order — drives ↑/↓/Enter.
  const flat = React.useMemo<Item[]>(
    () => [...groups.caseStudies, ...groups.news, ...groups.people, ...regionItems],
    [groups, regionItems]
  );

  React.useEffect(() => setActive(0), [flat.length]);

  // Expose keyboard nav to the parent input via a window-less handler: the parent
  // calls these through a ref-like contract. Simpler: handle keys here on document
  // while the modal is open and a query exists.
  React.useEffect(() => {
    if (!q) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((i) => Math.min(i + 1, flat.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        const item = flat[active];
        if (item) {
          e.preventDefault();
          onNavigate();
          router.push(item.href);
        } else {
          onNavigate();
          router.push(footerHref);
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [q, flat, active, router, onNavigate, footerHref]);

  if (!q) return null;

  const sectionLabel: Record<string, string> = {
    caseStudies: t("caseStudies"),
    news: t("news"),
    people: t("people"),
    regions: t("regions"),
  };

  const renderGroup = (key: string, items: Item[]) => {
    if (items.length === 0) return null;
    return (
      <div key={key} className="py-1.5">
        <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {sectionLabel[key]}
        </p>
        {items.map((item) => {
          const idx = flat.indexOf(item);
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={onNavigate}
              onMouseEnter={() => setActive(idx)}
              className={cn(
                "flex items-center gap-3 px-4 py-2 text-sm",
                idx === active ? "bg-muted text-foreground" : "text-foreground/80"
              )}
            >
              <span className="flex size-5 shrink-0 items-center justify-center">{item.icon}</span>
              <span className="truncate">{item.title}</span>
            </Link>
          );
        })}
      </div>
    );
  };

  const hasResults = flat.length > 0;

  return (
    <div className="max-h-[min(60vh,28rem)] overflow-y-auto border-t">
      {loading && (
        <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          {t("searching")}
        </div>
      )}

      {/* Regions are client-side, so they show even when Algolia is unavailable. */}
      {!loading && renderGroup("regions", regionItems)}

      {!loading && (
        <>
          {renderGroup("caseStudies", groups.caseStudies)}
          {renderGroup("news", groups.news)}
          {renderGroup("people", groups.people)}
        </>
      )}

      {/* Algolia errored (e.g. bad search key) — say so, don't imply "no matches". */}
      {!loading && errored && (
        <div className="px-4 py-6 text-center text-sm text-muted-foreground">
          {t("searchUnavailable")}
        </div>
      )}

      {/* Genuinely nothing (not an error, no regions, no hits). */}
      {!loading && !errored && !hasResults && (
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
          {t("nothingFound", { q: query })}
        </div>
      )}

      {/* Footer: full results page */}
      <Link
        href={footerHref}
        onClick={onNavigate}
        className="flex items-center justify-between gap-2 border-t px-4 py-3 text-sm font-medium text-ccm-water hover:bg-muted"
      >
        {t("seeAllResults", { q: query })}
        <ArrowRight className="size-4 rtl:-scale-x-100" />
      </Link>
    </div>
  );
}

export default SearchDialogResults;
