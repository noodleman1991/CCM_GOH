"use client";

import { useState } from "react";

import { RegionChoropleth } from "@/components/maps/region-choropleth";
import { FilterBar, FilterBarLabel, FilterBarSeparator } from "@/components/ui/filter-bar";
import { FilterChip, RemovableChip } from "@/components/ui/filter-chip";
import { Tabs, TabsContent, TabsCount, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { RegionCode } from "@/lib/maps/region-codes";

/** Fake map data for the bench — every region shaded, three pin shapes:
 *  mixed cluster (donut), single-type cluster (one-colour ring), single item
 *  (droplet). */
const BENCH_REGIONS = (
  [
    ["ssa", 17], ["esea", 12], ["enam", 14], ["lac", 9], ["nawa", 8], ["csa", 11], ["oce", 5],
  ] as Array<[RegionCode, number]>
).map(([code, value]) => ({ code, value, intensity: value / 17, i18nKey: code }));

const BENCH_PINS = [
  {
    x: 505, y: 300, count: 17,
    items: [{ id: "1", title: "Mangrove restoration and community mental health", type: "caseStudy" as const, slug: "m", countryCode3: "KEN" }],
    types: ["caseStudy", "livedExperience", "newsPost"] as const,
    typeCounts: { caseStudy: 11, livedExperience: 4, newsPost: 2 },
  },
  {
    x: 750, y: 190, count: 9,
    items: [{ id: "2", title: "Heat and anxiety in Lagos street markets", type: "caseStudy" as const, slug: "h", countryCode3: "NGA" }],
    types: ["caseStudy"] as const,
    typeCounts: { caseStudy: 9 },
  },
  {
    x: 300, y: 320, count: 1,
    items: [{ id: "3", title: "Farming through the long drought — Amina's story", type: "livedExperience" as const, slug: "f", countryCode3: "BRA" }],
    types: ["livedExperience"] as const,
    typeCounts: { livedExperience: 1 },
  },
].map((p) => ({ ...p, types: [...p.types], approx: false }));

/** Longest real title in the dataset — the text-guard proof card. */
const LONG_TITLE =
  "Climate Change and Mental Health: Insights from Connecting Climate Minds' Global Research and Action Agenda";

export function DevStandardsClient() {
  const [region, setRegion] = useState(true);
  const [when, setWhen] = useState("y3");

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-10">
      <section>
        <h2 className="mb-3 font-heading text-lg font-bold text-ccm-midnight">Line tabs (page level)</h2>
        <Tabs defaultValue="cases">
          <TabsList variant="line">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="cases">
              Case studies <TabsCount>17</TabsCount>
            </TabsTrigger>
            <TabsTrigger value="lived">
              Lived experiences <TabsCount>9</TabsCount>
            </TabsTrigger>
            <TabsTrigger value="people">
              People <TabsCount>126</TabsCount>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="pt-3 text-sm text-muted-foreground">
            Water bar slides between tabs; static under reduced motion.
          </TabsContent>
          <TabsContent value="cases" className="pt-3 text-sm text-muted-foreground">
            Active tab: bold midnight + water bar.
          </TabsContent>
          <TabsContent value="lived" className="pt-3 text-sm text-muted-foreground" />
          <TabsContent value="people" className="pt-3 text-sm text-muted-foreground" />
        </Tabs>
      </section>

      <section>
        <h2 className="mb-3 font-heading text-lg font-bold text-ccm-midnight">Pill tabs (tool level)</h2>
        <Tabs defaultValue="messages">
          <TabsList>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="notifications">
              Notifications <TabsCount>3</TabsCount>
            </TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
          </TabsList>
        </Tabs>
      </section>

      <section>
        <h2 className="mb-3 font-heading text-lg font-bold text-ccm-midnight">Filter bar</h2>
        <FilterBar>
          <FilterBarLabel>Region</FilterBarLabel>
          {region ? (
            <RemovableChip label="Sub-Saharan Africa" onRemove={() => setRegion(false)} />
          ) : (
            <FilterChip label="Sub-Saharan Africa" active={false} onClick={() => setRegion(true)} />
          )}
          <FilterChip label="All regions" active={false} onClick={() => {}} />
          <FilterBarSeparator />
          <FilterBarLabel>Theme</FilterBarLabel>
          <FilterChip label="Food & water" active={false} onClick={() => {}} />
          <FilterChip label="Youth" active={false} onClick={() => {}} />
          <FilterBarSeparator />
          <FilterBarLabel>When</FilterBarLabel>
          <FilterChip label="Any time" active={when === "any"} onClick={() => setWhen("any")} />
          <FilterChip label="Last year" active={when === "y1"} onClick={() => setWhen("y1")} />
          <FilterChip label="Last 3 years" active={when === "y3"} onClick={() => setWhen("y3")} />
          <FilterChip label="Older" active={when === "older"} onClick={() => setWhen("older")} />
        </FilterBar>
      </section>

      <section>
        <h2 className="mb-3 font-heading text-lg font-bold text-ccm-midnight">
          Map — pins v2 + hover labels (hover a region / pin)
        </h2>
        <div className="rounded-2xl border bg-gradient-to-b from-[#f2f7fb] to-[#e7f1f8] p-4">
          <RegionChoropleth
            data={BENCH_REGIONS}
            labelFor={(c) => c.toUpperCase()}
            pins={BENCH_PINS}
            onSelect={() => {}}
            onPinClick={() => {}}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-heading text-lg font-bold text-ccm-midnight">Text guard</h2>
        <div className="max-w-xs rounded-2xl border p-4">
          <h3
            dir="auto"
            title={LONG_TITLE}
            className="font-heading font-semibold leading-snug text-balance break-words line-clamp-3"
          >
            {LONG_TITLE}
          </h3>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground tabular-nums">
            <span>Global</span>
            <span aria-hidden>·</span>
            <span>20 March 2024</span>
            <span aria-hidden>·</span>
            <span>Dr. Britt Wray</span>
          </p>
        </div>
      </section>
    </div>
  );
}
