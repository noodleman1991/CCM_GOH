// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";

vi.mock("next-intl", () => ({ useTranslations: () => (k: string) => k }));
import { RegionChoropleth } from "@/components/maps/region-choropleth";

afterEach(cleanup);

describe("the selected region", () => {
  it("is a clean gold shape with no outline (a dashed outline read as a grainy, bitten edge)", () => {
    const { container } = render(<RegionChoropleth data={[]} selectedCode="oce" labelFor={(c) => c} />);
    const overlay = container.querySelector("g.pointer-events-none");
    expect(overlay).not.toBeNull();
    const paths = [...overlay!.querySelectorAll("path")];
    expect(paths).toHaveLength(1);
    expect(paths[0].getAttribute("stroke")).toBeNull();
    expect(container.querySelector("[stroke-dasharray]")).toBeNull();
  });
});
