import { describe, it, expect } from "vitest";
import { resolveGridColumns } from "@/lib/grid-layout";

describe("resolveGridColumns", () => {
  describe("classic variant", () => {
    it("maps grid-cols-2 to 2 columns", () => {
      expect(resolveGridColumns("grid-cols-2", "classic")).toEqual({
        cols: 2,
        className: "grid-cols-1 md:grid-cols-2 lg:grid-cols-2",
      });
    });

    it("maps grid-cols-3 to 3 columns", () => {
      expect(resolveGridColumns("grid-cols-3", "classic")).toEqual({
        cols: 3,
        className: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      });
    });

    it("maps grid-cols-4 to 4 columns", () => {
      expect(resolveGridColumns("grid-cols-4", "classic")).toEqual({
        cols: 4,
        className: "grid-cols-2 md:grid-cols-2 lg:grid-cols-4",
      });
    });

    it("maps grid-cols-5 to 5 columns", () => {
      expect(resolveGridColumns("grid-cols-5", "classic")).toEqual({
        cols: 5,
        className: "grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
      });
    });

    it("defaults to 2 columns when value is null", () => {
      expect(resolveGridColumns(null, "classic")).toEqual({
        cols: 2,
        className: "grid-cols-1 md:grid-cols-2 lg:grid-cols-2",
      });
    });

    it("defaults to 2 columns when value is undefined", () => {
      expect(resolveGridColumns(undefined, "classic")).toEqual({
        cols: 2,
        className: "grid-cols-1 md:grid-cols-2 lg:grid-cols-2",
      });
    });

    it("defaults to 2 columns for unknown values", () => {
      expect(resolveGridColumns("grid-cols-7", "classic")).toEqual({
        cols: 2,
        className: "grid-cols-1 md:grid-cols-2 lg:grid-cols-2",
      });
    });
  });

  describe("wide variant", () => {
    it("caps at 2 columns regardless of gridColumns value", () => {
      for (const value of [
        "grid-cols-2",
        "grid-cols-3",
        "grid-cols-4",
        "grid-cols-5",
        null,
        undefined,
      ]) {
        expect(resolveGridColumns(value, "wide")).toEqual({
          cols: 2,
          className: "grid-cols-1 lg:grid-cols-2",
        });
      }
    });
  });

  describe("media-list layout", () => {
    it("returns a single-column list class regardless of gridColumns or variant", () => {
      for (const value of ["grid-cols-2", "grid-cols-4", null, undefined]) {
        expect(resolveGridColumns(value, "classic", "media-list")).toEqual({
          cols: 1,
          className: "grid-cols-1",
        });
      }
    });

    it("ignores the wide variant when layout is media-list", () => {
      expect(resolveGridColumns("grid-cols-3", "wide", "media-list")).toEqual({
        cols: 1,
        className: "grid-cols-1",
      });
    });

    it("still resolves the card grid when layout is the default card", () => {
      expect(resolveGridColumns("grid-cols-3", "classic", "card")).toEqual({
        cols: 3,
        className: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      });
    });
  });
});
