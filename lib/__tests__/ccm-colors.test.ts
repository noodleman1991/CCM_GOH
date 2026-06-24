import { describe, it, expect } from "vitest";
import {
  CCM,
  COLOR,
  REGION_SHORT_CODES,
  REGION_LONG_TO_SHORT,
  REGION_SHORT_TO_LONG,
  isRegionShortCode,
  regionColor,
  statusColor,
  taskColor,
  intentColor,
  projectColor,
  layerColor,
} from "../ccm-colors";
import { REGION_CODES, REGION_COLOR } from "../maps/region-codes";

const HEX = /^#[0-9a-fA-F]{6}$/;

describe("CCM taxonomy colour map", () => {
  it("has an on-brand hex for all 7 region short codes", () => {
    expect(REGION_SHORT_CODES).toHaveLength(7);
    for (const code of REGION_SHORT_CODES) {
      expect(COLOR.region[code]).toMatch(HEX);
    }
  });

  it("maps every long-form RegionCode to a short code and back", () => {
    for (const code of REGION_CODES) {
      const short = REGION_LONG_TO_SHORT[code];
      expect(isRegionShortCode(short)).toBe(true);
      expect(REGION_SHORT_TO_LONG[short]).toBe(code);
    }
  });

  it("keeps lib/maps REGION_COLOR in sync with the canonical COLOR.region map", () => {
    for (const code of REGION_CODES) {
      expect(REGION_COLOR[code]).toBe(COLOR.region[REGION_LONG_TO_SHORT[code]]);
    }
  });
});

describe("regionColor", () => {
  it("resolves a short code", () => {
    expect(regionColor("ssa")).toBe(COLOR.region.ssa);
    expect(regionColor("oce")).toBe(COLOR.region.oce);
  });

  it("resolves a long-form stored value (today's data)", () => {
    expect(regionColor("ssa")).toBe(COLOR.region.ssa);
    expect(regionColor("enam")).toBe(COLOR.region.enam);
  });

  it("falls back to the Global colour for empty / unknown regions", () => {
    expect(regionColor(null)).toBe(COLOR.global);
    expect(regionColor("")).toBe(COLOR.global);
    expect(regionColor("nowhere")).toBe(COLOR.global);
  });
});

describe("status / task / intent / project / layer resolvers", () => {
  it("resolves content statuses incl. existing Sanity statuses", () => {
    expect(statusColor("published")).toBe(COLOR.status.published);
    expect(statusColor("review")).toBe(COLOR.status.review);
    expect(statusColor("approved")).toBe(COLOR.status.approved);
    expect(statusColor("pending")).toBe(COLOR.status.pending);
  });

  it("defaults unknown / empty status to neutral draft", () => {
    expect(statusColor(undefined)).toBe(COLOR.status.draft);
    expect(statusColor("weird")).toBe(COLOR.status.draft);
  });

  it("resolves task status case-insensitively", () => {
    expect(taskColor("DONE")).toBe(COLOR.task.done);
    expect(taskColor("doing")).toBe(COLOR.task.doing);
    expect(taskColor(null)).toBe(COLOR.task.todo);
  });

  it("resolves intent and project facets", () => {
    expect(intentColor("looking")).toBe(COLOR.intent.looking);
    expect(intentColor("offering")).toBe(COLOR.intent.offering);
    expect(intentColor(undefined)).toBe(COLOR.intent.member);
    expect(projectColor("Active")).toBe(COLOR.project.Active);
    expect(projectColor("Private")).toBe(COLOR.project.Private);
    expect(projectColor("???")).toBe(CCM.slate);
  });

  it("resolves atlas layers", () => {
    expect(layerColor("cases")).toBe(COLOR.layer.cases);
    expect(layerColor("People")).toBe(COLOR.layer.people);
    expect(layerColor(null)).toBe(COLOR.layer.cases);
  });
});

describe("CCM palette matches the design tokens", () => {
  it("includes the new amber + slate accent tokens", () => {
    expect(CCM.amber).toBe("#E0A53F");
    expect(CCM.slate).toBe("#8595AC");
  });

  it("every palette value is a 6-digit hex", () => {
    for (const hex of Object.values(CCM)) expect(hex).toMatch(HEX);
  });
});
