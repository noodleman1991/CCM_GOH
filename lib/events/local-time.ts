/** "YYYY-MM-DDTHH:mm" from a datetime-local input, in the browser's zone → ISO UTC; "" when unusable. */
export function localInputToIso(value: string): string {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

/** The short zone name the form shows beside its time fields, e.g. "GMT+1". */
export function zoneLabel(date: Date, locale: string): string {
  const part = new Intl.DateTimeFormat(locale, { timeZoneName: "short" }).formatToParts(date).find((p) => p.type === "timeZoneName");
  return part?.value ?? "UTC";
}
