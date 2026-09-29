import type { Field } from "payload";

const field: Field = { name: "publishState", type: "ui", admin: { components: { Field: "@/payload/components/publish-state#PublishState" } } };

/** Puts the publish-state line first on any collection or global with drafts. */
export function withPublishState<T extends { fields: Field[]; versions?: unknown }>(config: T): T {
  const v = config.versions;
  const drafts = typeof v === "object" && v !== null && "drafts" in v && Boolean((v as { drafts?: unknown }).drafts);
  return drafts ? { ...config, fields: [field, ...config.fields] } : config;
}
