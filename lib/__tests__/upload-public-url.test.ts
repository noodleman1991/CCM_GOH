import { describe, expect, it } from "vitest";
import { directUploadOptions, mediaPublicBase, publicUploadURL } from "@/payload/storage/public-url";

/**
 * Serving uploads straight from the bucket's public hostname instead of
 * through Payload's `/payload-api/<slug>/file/*` handler (a Vercel function
 * per image). One variable switches it; unset, nothing changes.
 */
describe("public-url", () => {
  it("reads the public base and drops a trailing slash", () => {
    expect(mediaPublicBase({ NEXT_PUBLIC_PAYLOAD_MEDIA_PUBLIC_URL: "https://cdn.example.org/" })).toBe("https://cdn.example.org");
    expect(mediaPublicBase({ NEXT_PUBLIC_PAYLOAD_MEDIA_PUBLIC_URL: "  " })).toBeNull();
    expect(mediaPublicBase({})).toBeNull();
  });

  it("builds <base>/<prefix>/<filename> and encodes the filename", () => {
    expect(publicUploadURL("https://cdn.example.org", "cms/media", "a-800x450.webp")).toBe(
      "https://cdn.example.org/cms/media/a-800x450.webp",
    );
    expect(publicUploadURL("https://cdn.example.org", "cms/files", "CCM Agenda (compressed).pdf")).toBe(
      "https://cdn.example.org/cms/files/CCM%20Agenda%20(compressed).pdf",
    );
    expect(publicUploadURL("https://cdn.example.org", undefined, "a.webp")).toBe("https://cdn.example.org/a.webp");
  });

  it("yields no plugin options when the variable is unset, and the direct-serving pair when set", () => {
    expect(directUploadOptions({})).toEqual({});
    const opts = directUploadOptions({ NEXT_PUBLIC_PAYLOAD_MEDIA_PUBLIC_URL: "https://cdn.example.org" });
    expect(opts.disablePayloadAccessControl).toBe(true);
    expect(
      opts.generateFileURL?.({ collection: { slug: "media" } as never, filename: "a.webp", prefix: "cms/media" }),
    ).toBe("https://cdn.example.org/cms/media/a.webp");
  });
});
