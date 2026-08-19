import { describe, it, expect } from "vitest";
import {
  getAvailableLanguages,
  getFileByLanguage,
  getFileDownloadUrl,
  formatFileSize,
  canAccessAgenda,
} from "../agenda-utils";
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
