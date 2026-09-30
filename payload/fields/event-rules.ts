import { urlValidate } from "@/payload/fields/validation";

/** Outside events send visitors to the organiser's site, so they need one (events spec §3.1). Pure. */
export function externalNeedsWebsite(value: unknown, args: { siblingData?: { origin?: unknown } }): true | string {
  const empty = value == null || (typeof value === "string" && value.trim() === "");
  if (empty) return args.siblingData?.origin === "external" ? "Add the event's website — visitors go there for outside events." : true;
  return (urlValidate as unknown as (v: unknown, a: unknown) => true | string)(value, args);
}
