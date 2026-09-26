import { describe, expect, it, vi } from "vitest";
import type { CollectionConfig, GlobalConfig } from "payload";
import config from "@payload-config";
import { CaseStudies } from "@/payload/collections/case-studies";
import { Media } from "@/payload/collections/media";
import { CONTENT_CACHE_TAG, collectionCacheTag, globalCacheTag } from "@/lib/cache/payload-tags";
import {
  REVALIDATION_EXEMPT_COLLECTIONS,
  contentRevalidationAfterChange,
  contentRevalidationAfterDelete,
  flushContentRevalidation,
  globalRevalidationAfterChange,
  isContentRevalidationHook,
  shouldRevalidateContent,
  type ContentRevalidationDeps,
} from "@/payload/hooks/revalidate-content";
import { REVALIDATABLE_CACHE_TAGS } from "@/lib/cache/revalidatable-tags";

/**
 * Every `queryLive` read is cached for an hour under `unstable_cache`. Until
 * 2026-09-16 the only code that ever revalidated that cache was the
 * moderation hook, on four collections, and only when a moderation status
 * changed. Editing a news post, a page, an agenda, a tag or the homepage in
 * `/admin` was invisible on the site for up to an hour — and the Sanity arm it
 * replaces had a publish webhook that revalidated on every publish.
 *
 * These hooks restore that: every content write and delete revalidates the
 * blanket tag plus the collection's own, after the transaction commits.
 */

const deps = () => {
  const calls: string[][] = [];
  const d: ContentRevalidationDeps = {
    revalidate: vi.fn(async (tags: string[]) => {
      calls.push(tags);
    }),
  };
  return { d, calls };
};

describe("cache tags", () => {
  it("keeps the blanket tag the read primitives and the moderation hook already use", () => {
    expect(CONTENT_CACHE_TAG).toBe("payload");
  });

  it("derives a per-collection and a per-global tag from the slug", () => {
    expect(collectionCacheTag("newsPosts")).toBe("payload:newsPosts");
    expect(globalCacheTag("homepage")).toBe("payload:global:homepage");
  });

  it("is on the admin revalidate route's allowlist", () => {
    expect(REVALIDATABLE_CACHE_TAGS).toContain(CONTENT_CACHE_TAG);
  });
});

describe("shouldRevalidateContent — only writes that can change what an anonymous reader sees", () => {
  it("always revalidates a delete", () => {
    expect(shouldRevalidateContent({ operation: "delete", doc: { _status: "draft" } })).toBe(true);
  });

  it("revalidates a publish, and an update to a published document", () => {
    expect(shouldRevalidateContent({ operation: "update", doc: { _status: "published" } })).toBe(true);
    expect(shouldRevalidateContent({ operation: "create", doc: { _status: "published" } })).toBe(true);
  });

  it("does not revalidate a draft-only save — nothing public changed", () => {
    // An editor saving work in progress on a drafts-enabled collection writes
    // only to the versions table; `queryLive` never sees it.
    expect(
      shouldRevalidateContent({ operation: "update", doc: { _status: "draft" }, previousDoc: { _status: "draft" } }),
    ).toBe(false);
    expect(shouldRevalidateContent({ operation: "create", doc: { _status: "draft" }, previousDoc: {} })).toBe(false);
  });

  it("revalidates an unpublish — the previous state was public", () => {
    expect(
      shouldRevalidateContent({ operation: "update", doc: { _status: "draft" }, previousDoc: { _status: "published" } }),
    ).toBe(true);
  });

  it("treats a collection without drafts as always live", () => {
    expect(shouldRevalidateContent({ operation: "update", doc: { title: "x" } })).toBe(true);
    expect(shouldRevalidateContent({ operation: "create", doc: { title: "x" }, previousDoc: {} })).toBe(true);
  });

  it("does not revalidate a member submission that is pending review", () => {
    // `submitCaseStudy` publishes with moderationStatus "pending"; the public
    // gate hides it, so evicting the whole site's cache for it is waste.
    expect(
      shouldRevalidateContent({
        operation: "create",
        doc: { _status: "published", moderationStatus: "pending" },
        previousDoc: {},
      }),
    ).toBe(false);
  });

  it("revalidates a moderation transition in either direction", () => {
    expect(
      shouldRevalidateContent({
        operation: "update",
        doc: { _status: "published", moderationStatus: "approved" },
        previousDoc: { _status: "published", moderationStatus: "pending" },
      }),
    ).toBe(true);
    expect(
      shouldRevalidateContent({
        operation: "update",
        doc: { _status: "published", moderationStatus: "rejected" },
        previousDoc: { _status: "published", moderationStatus: "approved" },
      }),
    ).toBe(true);
  });

  it("treats an unset moderation status as visible, matching publishedAndApproved", () => {
    // lived experiences: 0/56 carry a moderationStatus and all are public.
    expect(shouldRevalidateContent({ operation: "update", doc: { _status: "published" } })).toBe(true);
  });
});

describe("the hooks", () => {
  it("afterChange revalidates the blanket tag and the collection's own", async () => {
    const { d, calls } = deps();
    const hook = contentRevalidationAfterChange("newsPosts", d);
    const doc = { id: "n1", _status: "published" };
    const returned = await hook({ doc, previousDoc: { id: "n1", _status: "published" }, operation: "update", req: {} } as never);
    expect(returned).toBe(doc);
    await flushContentRevalidation();
    expect(calls).toEqual([[CONTENT_CACHE_TAG, collectionCacheTag("newsPosts")]]);
  });

  it("afterChange schedules nothing for a draft-only save", async () => {
    const { d, calls } = deps();
    const hook = contentRevalidationAfterChange("newsPosts", d);
    await hook({ doc: { _status: "draft" }, previousDoc: { _status: "draft" }, operation: "update", req: {} } as never);
    await flushContentRevalidation();
    expect(calls).toEqual([]);
  });

  it("afterDelete always revalidates", async () => {
    const { d, calls } = deps();
    const hook = contentRevalidationAfterDelete("agendas", d);
    await hook({ doc: { id: "a1" }, id: "a1", req: {} } as never);
    await flushContentRevalidation();
    expect(calls).toEqual([[CONTENT_CACHE_TAG, collectionCacheTag("agendas")]]);
  });

  it("a global's afterChange revalidates the blanket tag and the global's own", async () => {
    const { d, calls } = deps();
    const hook = globalRevalidationAfterChange("homepage", d);
    await hook({ doc: { title: "x" }, previousDoc: { title: "y" }, req: {} } as never);
    await flushContentRevalidation();
    expect(calls).toEqual([[CONTENT_CACHE_TAG, globalCacheTag("homepage")]]);
  });

  it("does not hold the write open: the hook returns before revalidate runs", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const d: ContentRevalidationDeps = { revalidate: vi.fn(() => gate) };
    const hook = contentRevalidationAfterChange("pages", d);
    const returned = hook({ doc: { _status: "published" }, previousDoc: {}, operation: "create", req: {} } as never);
    await expect(returned).resolves.toEqual({ _status: "published" });
    release();
    await flushContentRevalidation();
    expect(d.revalidate).toHaveBeenCalledTimes(1);
  });

  it("a failing revalidation is reported, not thrown into the write", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const d: ContentRevalidationDeps = {
      revalidate: vi.fn(async () => {
        throw new Error("no request scope");
      }),
    };
    const hook = contentRevalidationAfterDelete("pages", d);
    await expect(hook({ doc: { id: "p1" }, id: "p1", req: {} } as never)).resolves.toBeDefined();
    await flushContentRevalidation();
    expect(error).toHaveBeenCalledTimes(1);
    error.mockRestore();
  });

  it("stands down for a write that carries the import context", async () => {
    // A re-import writes hundreds of documents; one revalidation at the end
    // (the operator's job) beats hundreds during. Same flag family as the
    // search-sync and moderation hooks.
    const { d, calls } = deps();
    const hook = contentRevalidationAfterChange("newsPosts", d);
    await hook({
      doc: { _status: "published" },
      previousDoc: {},
      operation: "create",
      req: { context: { skipContentRevalidation: true } },
    } as never);
    await flushContentRevalidation();
    expect(calls).toEqual([]);
  });
});

describe("wiring — no content collection or global can be forgotten", () => {
  const hasRevalidation = (hooks: { afterChange?: unknown[]; afterDelete?: unknown[] } | undefined) => ({
    afterChange: (hooks?.afterChange ?? []).some(isContentRevalidationHook),
    afterDelete: (hooks?.afterDelete ?? []).some(isContentRevalidationHook),
  });

  it("exempts exactly the collections no anonymous reader is served from", () => {
    expect([...REVALIDATION_EXEMPT_COLLECTIONS].sort()).toEqual(["caseStudyDrafts", "users"]);
  });

  it("every other collection revalidates on change and on delete", async () => {
    const resolved = await config;
    for (const collection of resolved.collections as CollectionConfig[]) {
      // Payload's own internal collections (payload-kv, payload-preferences,
      // payload-locked-documents, …) are injected by buildConfig and are not
      // content; nothing in lib/content reads them.
      if (collection.slug.startsWith("payload-")) continue;
      const expected = !REVALIDATION_EXEMPT_COLLECTIONS.has(collection.slug);
      expect(hasRevalidation(collection.hooks), collection.slug).toEqual({
        afterChange: expected,
        afterDelete: expected,
      });
    }
  });

  it("every global revalidates on change", async () => {
    const resolved = await config;
    expect(resolved.globals.length).toBeGreaterThan(0);
    for (const global of resolved.globals as GlobalConfig[]) {
      expect(hasRevalidation(global.hooks).afterChange, global.slug).toBe(true);
    }
  });

  it("keeps the hooks a collection already declared, appending its own last", async () => {
    const resolved = await config;
    const caseStudies = (resolved.collections as CollectionConfig[]).find((c) => c.slug === "caseStudies")!;
    const declared = CaseStudies.hooks?.afterChange ?? [];
    expect(declared.length).toBeGreaterThan(0); // moderation, at least
    expect(caseStudies.hooks?.afterChange?.slice(0, declared.length)).toEqual(declared);
    expect(caseStudies.hooks?.afterChange?.length).toBe(declared.length + 1);
    const media = (resolved.collections as CollectionConfig[]).find((c) => c.slug === "media")!;
    // Other config-level wrappers (the anonymous read cap) may add hooks too;
    // what matters is that nothing the collection declared was dropped.
    for (const declared of Media.hooks?.beforeOperation ?? []) {
      expect(media.hooks?.beforeOperation).toContain(declared);
    }
  });
});
