"use client";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { FilterChip } from "@/components/ui/filter-chip";
import { FilterRow, FilterRowGroup } from "@/components/atlas/atlas-filters";
import { SearchInput } from "@/components/ui/search-input";
import { isFiltering, type ActiveFilters, type FilterOptions } from "@/lib/filters/core";
import { toSearchParams } from "@/lib/filters/params";

type Row = "regions" | "communities" | "themes";
const ROWS: Array<[Row, string]> = [["regions", "region"], ["communities", "communities"], ["themes", "themes"]];
const DEFAULT_WHEN = ["past-year", "past-3-years", "earlier"];

/** The hub's one filter bar (spec 2026-09-30): Region · Communities · Themes · When · Search. */
export function FilterBar({ options, active, whenOptions = DEFAULT_WHEN }: { options: FilterOptions; active: ActiveFilters; whenOptions?: string[] }) {
  const t = useTranslations("filters");
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(active.q);
  const go = (next: ActiveFilters) => {
    const qs = toSearchParams(next).toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };
  const toggle = (row: Row, value: string) =>
    go({ ...active, [row]: active[row].includes(value) ? active[row].filter((v) => v !== value) : [...active[row], value] });

  return (
    <div className="space-y-3">
      <SearchInput
        containerClassName="max-w-md"
        defaultValue={active.q}
        placeholder={t("search")}
        aria-label={t("search")}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") go({ ...active, q: q.trim() }); }}
        onClear={active.q ? () => go({ ...active, q: "" }) : undefined}
        clearLabel={t("clearSearch")}
      />
      <FilterRowGroup>
        {ROWS.filter(([row]) => options[row].length > 0).map(([row, key]) => (
          <FilterRow key={row} label={t(key)}>
            {options[row].map((o) => (
              <FilterChip key={o.value} label={o.label} count={o.count} active={active[row].includes(o.value)} onClick={() => toggle(row, o.value)} />
            ))}
          </FilterRow>
        ))}
        <FilterRow label={t("when")}>
          {whenOptions.map((w) => (
            <FilterChip key={w} label={t(`whenOptions.${w}`)} active={active.when === w} onClick={() => go({ ...active, when: active.when === w ? null : w })} />
          ))}
        </FilterRow>
      </FilterRowGroup>
      {isFiltering(active) && (
        <button type="button" className="text-sm font-semibold text-ccm-sea hover:underline" onClick={() => go({ regions: [], communities: [], themes: [], when: null, q: "" })}>
          {t("clear")}
        </button>
      )}
    </div>
  );
}
