import { describe, expect, it } from "vitest";
import imageLoader, { isCmsDerivative, isCmsUpload } from "@/lib/images/next-image-loader";

/**
 * The custom `next/image` loader (next.config.mjs `images.loaderFile`).
 * CMS uploads are already the derivative the call site asked for, so they
 * bypass Vercel's optimizer and are fetched as-is; everything else keeps the
 * default `/_next/image` path, byte for byte what Next's own loader builds.
 */
describe("next-image-loader", () => {
  const base = "https://cdn.example.org";

  it("recognises a Payload-served upload and a public-bucket upload", () => {
    expect(isCmsUpload("/payload-api/media/file/a-800x450.webp?prefix=cms%2Fmedia", base)).toBe(true);
    expect(isCmsUpload("/payload-api/files/file/report.pdf?prefix=cms%2Ffiles", base)).toBe(true);
    expect(isCmsUpload("https://cdn.example.org/cms/media/a-800x450.webp", base)).toBe(true);
    expect(isCmsUpload("https://cdn.example.org/cms/media/a.webp", `${base}/`)).toBe(true);
  });

  it("does not mistake other hosts or paths for uploads", () => {
    expect(isCmsUpload("https://cdn.sanity.io/images/x/y/a-800x450.webp", base)).toBe(false);
    expect(isCmsUpload("https://cdn.example.org.evil.com/cms/media/a.webp", base)).toBe(false);
    expect(isCmsUpload("/images/logo.png", base)).toBe(false);
    expect(isCmsUpload("https://cdn.example.org/cms/media/a.webp", undefined)).toBe(false);
  });

  it("returns a generated size untouched, whatever width Next asks for", () => {
    const src = "/payload-api/media/file/a-800x450.webp?prefix=cms%2Fmedia";
    expect(imageLoader({ src, width: 640 })).toBe(src);
    expect(imageLoader({ src, width: 1920, quality: 90 })).toBe(src);
    expect(isCmsDerivative("https://cdn.example.org/cms/media/hero-1a2b-1100x578.webp")).toBe(true);
  });

  it("still resizes a CMS original, which only reaches <Image> when a call site asked for no size", () => {
    const src = "/payload-api/media/file/case-study-11-1762821605622.jpg?prefix=cms%2Fmedia";
    expect(isCmsDerivative(src)).toBe(false);
    expect(imageLoader({ src, width: 640 })).toBe(src);
  });

  it("sizes a Sanity image through Sanity's own CDN parameters", () => {
    const out = imageLoader({ src: "https://cdn.sanity.io/images/p/d/a.jpg?fm=webp", width: 750, quality: 85 });
    expect(out).toContain("w=750");
    expect(out).toContain("q=85");
    expect(out).toContain("auto=format");
    expect(out).toContain("fm=webp");
  });

  it("sizes a Clerk avatar through Clerk's parameters", () => {
    expect(imageLoader({ src: "https://img.clerk.com/abc", width: 96 })).toBe(
      "https://img.clerk.com/abc?width=96&quality=75",
    );
  });

  it("serves everything else as it is — a custom loader means /_next/image no longer exists", () => {
    expect(imageLoader({ src: "/connecting-climate-minds-logo-white.png", width: 256 })).toBe(
      "/connecting-climate-minds-logo-white.png",
    );
    expect(imageLoader({ src: "https://img.youtube.com/vi/abc/hqdefault.jpg", width: 640 })).toBe(
      "https://img.youtube.com/vi/abc/hqdefault.jpg",
    );
  });

  it("leaves SVGs alone, as the default loader does without dangerouslyAllowSVG", () => {
    expect(imageLoader({ src: "/illustrations/atlas.svg", width: 640 })).toBe("/illustrations/atlas.svg");
    expect(imageLoader({ src: "https://img.example.org/a.svg?v=2", width: 640 })).toBe("https://img.example.org/a.svg?v=2");
  });
});
