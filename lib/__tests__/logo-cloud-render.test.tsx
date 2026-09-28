// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
vi.mock("next-intl", () => ({ useTranslations: () => (k: string) => k }));
vi.mock("motion/react", () => ({ motion: { div: (p: { children: ReactNode }) => <div>{p.children}</div> }, useReducedMotion: () => true }));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...r }: { href: string; children: ReactNode }) => <a href={href} {...r}>{children}</a>,
}));
import LogoCloud1 from "@/components/blocks/logo-cloud/logo-cloud-1";

afterEach(cleanup);

describe("LogoCloud1", () => {
  it("links organisation logos to their hub page and names the link", () => {
    render(<LogoCloud1 layout="grid" locale="en" images={[{ name: "Wellcome", alt: "Wellcome", href: "/organizations/wellcome", asset: null }]} />);
    expect(screen.getByRole("link", { name: /Wellcome/ }).getAttribute("href")).toBe("/organizations/wellcome");
  });
  it("shows a name chip when an organisation has no logo", () => {
    render(<LogoCloud1 layout="grid" locale="en" images={[{ name: "Climate Cares Centre", href: "/organizations/climate-cares-centre", asset: null }]} />);
    expect(screen.getByText("Climate Cares Centre")).toBeTruthy();
  });
  it("lets keyboard users reach each marquee link once, not twice", () => {
    render(<LogoCloud1 layout="marquee" locale="en" images={[{ name: "Wellcome", href: "/organizations/wellcome", asset: null }]} />);
    expect(screen.getAllByRole("link", { name: /Wellcome/ })).toHaveLength(1);
  });
});
