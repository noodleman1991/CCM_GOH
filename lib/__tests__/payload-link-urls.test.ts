import { describe, expect, it } from "vitest";
import config from "@payload-config";
import { editorConfigFactory } from "@payloadcms/richtext-lexical";
import type { RichTextField, SanitizedCollectionConfig, TextField } from "payload";
import { richTextInfoBox } from "@/payload/blocks/rich-text-embeds";

/**
 * Regression cover for the link-URL mangling described in
 * `payload/fields/link.ts`.
 *
 * `@payloadcms/richtext-lexical@3.88.0` percent-encodes any href its narrow
 * `validateUrl` rejects, and its fragment clause is `#\w+` — so an in-page
 * anchor carrying a `:` or a `,` had its whole href encoded, `#` included, on
 * every write. It cost 7 of the 72 stored `docsChapters` link URLs, all of
 * them Global Agenda anchors; the other 65 were untouched, which is what made
 * it look random rather than systematic.
 *
 * The first test drives Payload's OWN write path for a rich-text field — the
 * lexical adapter's `beforeValidate` then `beforeChange` field hooks, taken
 * off the sanitized `docsChapters.body` field of the real config — rather than
 * calling the URL hook directly, because the defect was never in one hook in
 * isolation: it was in which feature the deployed editor ends up resolving.
 */

/** The exact href stored in `docsChapter-global-agenda-background-context`. */
const ANCHOR_WITH_COLON =
  "#background-context:-climate-change,-mental-health-and-the-need-for-transdisciplinary-research";

type LinkFields = { fields: { url: string } };
type Adapter = {
  hooks: {
    beforeValidate: ((args: unknown) => Promise<unknown>)[];
    beforeChange: ((args: unknown) => Promise<unknown>)[];
  };
};

function bodyWithLink(url: string) {
  return {
    root: {
      type: "root",
      format: "",
      indent: 0,
      version: 1,
      direction: "ltr",
      children: [
        {
          type: "paragraph",
          format: "",
          indent: 0,
          version: 1,
          direction: "ltr",
          children: [
            {
              type: "link",
              version: 3,
              format: "",
              indent: 0,
              direction: "ltr",
              // A link node must carry an id to reach the field hooks: the
              // adapter matches new nodes to old ones through an id map.
              id: "link-1",
              fields: { linkType: "custom", newTab: false, url },
              children: [
                { type: "text", detail: 0, format: 0, mode: "normal", style: "", text: "see", version: 1 },
              ],
            },
          ],
        },
      ],
    },
  };
}

function urlOf(body: unknown): string {
  const root = (body as ReturnType<typeof bodyWithLink>).root;
  return (root.children[0].children[0] as unknown as LinkFields).fields.url;
}

/** Writes `url` through the real `docsChapters.body` hooks and reads it back. */
async function writeThroughPayload(url: string): Promise<string> {
  const sanitized = await config;
  const collection = sanitized.collections.find(
    (c) => c.slug === "docsChapters",
  ) as SanitizedCollectionConfig;
  const field = collection.fields.find(
    (f) => "name" in f && f.name === "body",
  ) as RichTextField & { editor: Adapter };

  const context: Record<string, unknown> = {};
  const req = { payload: { config: sanitized }, context, locale: "en", user: null, payloadAPI: "local" };
  // An update, not a create: the adapter only runs node field hooks for nodes
  // it can match against a previous version, which is exactly the shape a
  // re-run of `pnpm import:documents` has.
  const previousValue = bodyWithLink(url);
  const value = bodyWithLink(url);
  const args = {
    collection,
    context,
    data: { body: value },
    docWithLocales: { body: previousValue },
    errors: [],
    field,
    fieldLabelPath: "",
    global: null,
    indexPath: [0],
    mergeLocaleActions: [],
    operation: "update",
    originalDoc: { body: previousValue },
    overrideAccess: true,
    parentIsLocalized: false,
    path: ["body"],
    previousValue,
    req,
    schemaPath: ["body"],
    siblingData: { body: value },
    siblingDocWithLocales: { body: previousValue },
    skipValidation: true,
    value,
  };

  await field.editor.hooks.beforeValidate[0](args);
  return urlOf(await field.editor.hooks.beforeChange[0](args));
}

/** The `beforeChange` hook the sanitized editor of `field` gives its link url. */
function linkUrlHook(field: RichTextField) {
  const editorConfig = editorConfigFactory.fromField({ field });
  const props = editorConfig.resolvedFeatureMap.get("link")?.sanitizedServerFeatureProps as
    | { fields?: TextField[] }
    | undefined;
  const url = props?.fields?.find((f) => f.name === "url");
  return url?.hooks?.beforeChange?.[0];
}

describe("lexical link URLs", () => {
  it("stores an in-page anchor whose fragment contains ':' and ',' verbatim", async () => {
    expect(await writeThroughPayload(ANCHOR_WITH_COLON)).toBe(ANCHOR_WITH_COLON);
  });

  it("leaves the other anchor, relative and absolute hrefs alone", async () => {
    for (const href of [
      "#background-context",
      "/agenda#primary-terms",
      "https://example.org/a?b=1&c=2#section",
      "mailto:someone@example.org",
      // Already percent-encoded in Sanity, and must not be encoded a second time.
      "https://nbswmzwquzluimyqnfsf.supabase.co/storage/v1/object/public/documents/Research%20Toolkit_compressed.pdf?t=2024-03-19T11%3A22%3A26.397Z",
    ]) {
      expect(await writeThroughPayload(href)).toBe(href);
    }
  });

  it("still neutralises a hostile scheme by encoding it", async () => {
    expect(await writeThroughPayload("javascript:alert(1)")).toBe("javascript%3Aalert(1)");
    expect(await writeThroughPayload("data:text/html;base64,PHNjcmlwdD4=")).toBe(
      encodeURIComponent("data:text/html;base64,PHNjcmlwdD4="),
    );
  });

  it("applies to the nested infoBox editor too, which resolves its own features", () => {
    const content = richTextInfoBox.fields.find(
      (f) => "name" in f && f.name === "content",
    ) as RichTextField;
    const hook = linkUrlHook(content);
    expect(hook).toBeTruthy();
    expect(hook!({ value: ANCHOR_WITH_COLON } as never)).toBe(ANCHOR_WITH_COLON);
  });
});
