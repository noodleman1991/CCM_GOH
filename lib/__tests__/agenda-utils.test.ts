import { afterEach, describe, it, expect, vi } from "vitest";
import {
  getAvailableLanguages,
  getFileByLanguage,
  getFileDownloadUrl,
  formatFileSize,
  canAccessAgenda,
  trackDownload,
  downloadFile,
  validateAgenda,
} from "../agenda-utils";
import { fileBelongsToContent, getDownloadAdapter } from "../download-adapters";
import type { Agenda, AgendaFile } from "@/types/agenda";

const fileEn: AgendaFile = { language: "en", file: { asset: { _id: "a-en", url: "https://cdn/x.pdf", originalFilename: "x.pdf" } } };
const fileEs: AgendaFile = { language: "es", file: { asset: { _id: "a-es", url: "https://cdn/y.pdf", originalFilename: "y.pdf" } } };

describe("agenda-utils", () => {
  it("getAvailableLanguages returns the unique file languages", () => {
    const agenda = { files: [fileEn, fileEs, fileEn] } as unknown as Agenda;
    const langs = getAvailableLanguages(agenda);
    expect(langs.sort()).toEqual(["en", "es"]);
  });

  it("getAvailableLanguages handles no files", () => {
    expect(getAvailableLanguages({ files: [] } as unknown as Agenda)).toEqual([]);
  });

  it("getFileByLanguage finds the matching-language file", () => {
    const agenda = { files: [fileEn, fileEs] } as unknown as Agenda;
    expect(getFileByLanguage(agenda, "es")).toBe(fileEs);
    expect(getFileByLanguage(agenda, "fr")).toBeUndefined();
  });

  it("getFileDownloadUrl appends a download param, null when no asset", () => {
    expect(getFileDownloadUrl(fileEn)).toBe("https://cdn/x.pdf?dl=x.pdf");
    expect(getFileDownloadUrl({ language: "en", file: {} })).toBeNull();
  });

  it("formatFileSize is human-readable", () => {
    expect(formatFileSize(undefined)).toBe("");
    expect(formatFileSize(500)).toContain("KB");
    expect(formatFileSize(2 * 1024 * 1024)).toContain("MB");
  });

  it("canAccessAgenda enforces access levels by user role", () => {
    // public is always accessible (even as a guest)
    expect(canAccessAgenda("public", "guest")).toBe(true);
    // registered content needs a logged-in user, not a guest
    expect(canAccessAgenda("registered", "guest")).toBe(false);
    expect(canAccessAgenda("registered", "user")).toBe(true);
  });
});

describe("agenda download tracking", () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("trackDownload posts the agenda id and language to the AGENDA track route", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ success: true }), { status: 200 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const ok = await trackDownload({ agendaId: "agenda-1", fileLanguage: "es", userId: "user_1" });

    expect(ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/agendas/download/track");
    expect(init.method).toBe("POST");
    const body = JSON.parse(String(init.body));
    expect(body).toMatchObject({ agendaId: "agenda-1", fileLanguage: "es", userId: "user_1" });
    // Never the report tracker — that was the bug: agenda ids were posted to
    // /api/reports/download/track, so no agenda counter ever moved.
    expect(body).not.toHaveProperty("reportId");
  });

  it("trackDownload reports false (and does not throw) when the route rejects", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    globalThis.fetch = vi.fn(async () => new Response("{}", { status: 429 })) as unknown as typeof fetch;
    await expect(trackDownload({ agendaId: "agenda-1", fileLanguage: "en" })).resolves.toBe(false);
  });

  it("the hook's agenda adapter is agenda-utils, not report-utils", () => {
    const adapter = getDownloadAdapter("agenda");
    expect(adapter.downloadFile).toBe(downloadFile);
    expect(adapter.validate).toBe(validateAgenda);
  });

  it("fileBelongsToContent rejects a file whose language is not on the document", () => {
    const agenda = { _id: "a1", files: [fileEn] } as unknown as Agenda;
    expect(fileBelongsToContent(fileEn, agenda)).toBe(true);
    expect(fileBelongsToContent(fileEs, agenda)).toBe(false);
  });
});
