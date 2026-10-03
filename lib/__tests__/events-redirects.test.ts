import { expect, it } from "vitest";
import config from "@/next.config.mjs";

it("old event addresses go to their new homes, permanently", async () => {
  const rules = (await config.redirects!()) as Array<{ source: string; destination: string; permanent: boolean }>;
  const find = (s: string) => rules.find((r) => r.source === s);
  expect(find("/:locale(en|es|fr|ar)/collaborate/events")).toMatchObject({ destination: "/:locale/events", permanent: true });
  expect(find("/:locale(en|es|fr|ar)/collaborate/events/new")).toMatchObject({ destination: "/:locale/events/suggest", permanent: true });
  expect(find("/:locale(en|es|fr|ar)/collaborate/events/:slug")).toMatchObject({ destination: "/:locale/events/:slug", permanent: true });
  // "new" must be matched before the slug rule, or it lands on an event called "new".
  const order = (s: string) => rules.findIndex((r) => r.source === s);
  expect(order("/:locale(en|es|fr|ar)/collaborate/events/new")).toBeLessThan(order("/:locale(en|es|fr|ar)/collaborate/events/:slug"));
});
