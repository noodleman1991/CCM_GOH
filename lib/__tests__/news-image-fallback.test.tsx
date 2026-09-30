// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
vi.mock("next/image", () => ({ default: (p: { src: string; alt: string }) => <img src={p.src} alt={p.alt} /> }));
import { NewsImageFallback } from "@/components/news/news-image-fallback";
afterEach(cleanup);

describe("news picture when a story has none", () => {
  it("shows the editors' chosen illustration when there is one", () => {
    const { container } = render(<NewsImageFallback illustration={{ url: "/m/news.webp", alt: "Hub art", width: 800, height: 450 }} />);
    expect(container.querySelector("img")?.getAttribute("src")).toBe("/m/news.webp");
  });
  it("otherwise shows the hub's pattern with the logo, decorative only", () => {
    const { container } = render(<NewsImageFallback />);
    const img = container.querySelector("img");
    expect(img?.getAttribute("src")).toBe("/connecting-climate-minds-logo-white.png");
    expect(img?.getAttribute("alt")).toBe("");
    expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe("true");
  });
});
