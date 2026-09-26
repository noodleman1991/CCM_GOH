import { describe, expect, it } from "vitest";
import { legacyUploadRedirect } from "@/lib/uploads/legacy-upload-redirect";

describe("legacyUploadRedirect", () => {
  const base = "https://cdn.example.org";
  const params = (s: string) => new URLSearchParams(s);

  it("maps an old handler URL onto the public hostname, keeping the stored prefix", () => {
    expect(legacyUploadRedirect("/payload-api/media/file/a-800x450.webp", params("prefix=cms%2Fmedia"), base)).toBe(
      "https://cdn.example.org/cms/media/a-800x450.webp",
    );
    expect(legacyUploadRedirect("/payload-api/files/file/CCM%20Agenda.pdf", params("prefix=cms%2Ffiles"), base)).toBe(
      "https://cdn.example.org/cms/files/CCM%20Agenda.pdf",
    );
  });

  it("falls back to the collection's prefix when the query has none", () => {
    expect(legacyUploadRedirect("/payload-api/files/file/r.pdf", params(""), base)).toBe("https://cdn.example.org/cms/files/r.pdf");
  });

  it("does nothing without a public host, for other paths, or for a traversal", () => {
    expect(legacyUploadRedirect("/payload-api/media/file/a.webp", params(""), undefined)).toBeNull();
    expect(legacyUploadRedirect("/payload-api/media", params(""), base)).toBeNull();
    expect(legacyUploadRedirect("/en/news", params(""), base)).toBeNull();
    expect(legacyUploadRedirect("/payload-api/media/file/..%2Fsecret", params(""), base)).toBeNull();
  });
});
