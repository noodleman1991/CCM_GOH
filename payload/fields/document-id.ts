import type { FieldHook, TextField } from "payload";

/**
 * Keeps an id that arrived with the data (every Sanity import does), and mints
 * one for a document created without it — the admin's Create and Duplicate
 * buttons, and the site's own uploads. Without this every new document failed:
 * a publish on "Id is required", a draft on the database's NOT NULL.
 *
 * A duplicate arrives carrying its source's id, so that one is replaced too.
 */
export const assignDocumentId: FieldHook = ({ value, operation, originalDoc }) => {
  if (operation !== "create") return value;
  const sourceId = (originalDoc as { id?: unknown } | undefined)?.id;
  if (typeof value === "string" && value.trim() && value !== sourceId) return value;
  return crypto.randomUUID();
};

/** A collection's custom text id: slug-like Sanity ids survive, new documents get a UUID. */
export const documentIdField: TextField = {
  name: "id",
  type: "text",
  required: true,
  admin: { hidden: true },
  hooks: { beforeValidate: [assignDocumentId] },
};
