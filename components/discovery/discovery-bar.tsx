"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PillFilterGroup, type PillOption } from "@/components/ui/pill-filter-group";
import { FilterChip, RemovableChip } from "@/components/ui/filter-chip";
import { TIME_FRAMES, type TimeFrame } from "@/lib/filters/time-frame";
import type { DiscoveryConfig } from "@/lib/discovery/registry";
import {
  type DiscoveryState,
  serializeDiscoveryState,
  toggleFacetValue,
  hasActiveFilters,
  emptyState,
} from "@/lib/discovery/url-state";

/** Localized options per facet id, resolved server-side and passed in. */
export type DiscoveryOptions = Record<string, PillOption[]>;

export function DiscoveryBar({
  config,
  initial,
  options,
}: {
  config: DiscoveryConfig;
  initial: DiscoveryState;
  options: DiscoveryOptions;
}) {
  const t = useTranslations("discovery");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<DiscoveryState>(initial);

  const apply = useCallback(
    (next: DiscoveryState) => {
      setState(next);
      const params = serializeDiscoveryState(config, next);
      // Preserve any unrelated params (e.g. pagination handled elsewhere).
      const preserved = new URLSearchParams(searchParams.toString());
      for (const key of [...preserved.keys()]) {
        if (key === "q" || key === "sort" || key === "tf" || config.facets.some((f) => f.id === key)) {
          preserved.delete(key);
        }
      }
      for (const [k, v] of params) preserved.set(k, v);
      startTransition(() => {
        router.replace(`${pathname}?${preserved.toString()}`, { scroll: false });
      });
    },
    [config, pathname, router, searchParams]
  );

  const labelFor = (facetId: string, value: string) =>
    options[facetId]?.find((o) => o.value === value)?.label ?? value;

  return (
    <div className="space-y-4">
      {/* Search + sort */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 text-muted-foreground ms-3" />
          <Input
            value={state.q}
            onChange={(e) => setState({ ...state, q: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") apply(state);
            }}
            placeholder={t("searchPlaceholder")}
            className="ps-9"
            aria-label={t("searchPlaceholder")}
          />
        </div>
        <Select value={state.sort} onValueChange={(v) => apply({ ...state, sort: v as DiscoveryState["sort"] })}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder={t("sortLabel")} />
          </SelectTrigger>
          <SelectContent>
            {config.sorts.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {t(s.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Time-frame pills */}
      {config.timeFrame && (
        <div className="flex flex-wrap gap-2">
          {TIME_FRAMES.map((tf) => (
            <FilterChip
              key={tf}
              label={t(`timeFrame.${tf}`)}
              active={state.timeFrame === tf}
              onClick={() => apply({ ...state, timeFrame: tf as TimeFrame })}
            />
          ))}
        </div>
      )}

      {/* Facet pill groups — only those this content type declares */}
      <div className="grid gap-4 sm:grid-cols-2">
        {config.facets.map((facet) => {
          const opts = options[facet.id] ?? [];
          if (opts.length === 0) return null;
          return (
            <PillFilterGroup
              key={facet.id}
              legend={t(facet.legendKey)}
              options={opts}
              selected={state.facets[facet.id] ?? []}
              onToggle={(value) => apply(toggleFacetValue(state, facet.id, value, facet.multi ?? true))}
            />
          );
        })}
      </div>

      {/* Active filter summary */}
      {hasActiveFilters(config, state) && (
        <div className="flex flex-wrap items-center gap-2">
          {config.facets.flatMap((facet) =>
            (state.facets[facet.id] ?? []).map((value) => (
              <RemovableChip
                key={`${facet.id}:${value}`}
                label={labelFor(facet.id, value)}
                onRemove={() => apply(toggleFacetValue(state, facet.id, value, facet.multi ?? true))}
              />
            ))
          )}
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => apply(emptyState(config))}
            className="text-muted-foreground"
          >
            {t("clearAll")}
          </Button>
        </div>
      )}
    </div>
  );
}
