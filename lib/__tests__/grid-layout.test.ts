import { describe, it, expect } from "vitest";
import { resolveGridColumns } from "@/lib/grid-layout";

describe("resolveGridColumns", () => {
  describe("classic variant", () => {
    it("maps grid-cols-2 to 2 columns", () => {
      expect(resolveGridColumns("grid-cols-2", "classic")).toEqual({
        cols: 2,
        className: "grid-cols-1 @content-md/page:grid-cols-2",
      });
    });

    it("maps grid-cols-3 to 3 columns", () => {
      expect(resolveGridColumns("grid-cols-3", "classic")).toEqual({
        cols: 3,
        className: "grid-cols-1 @content-md/page:grid-cols-2 @content-lg/page:grid-cols-3",
      });
    });

    it("maps grid-cols-4 to 4 columns", () => {
      expect(resolveGridColumns("grid-cols-4", "classic")).toEqual({
        cols: 4,
        className: "grid-cols-2 @content-md/page:grid-cols-2 @content-lg/page:grid-cols-3 @content-xl/page:grid-cols-4",
      });
    });

    it("maps grid-cols-5 to 5 columns", () => {
      expect(resolveGridColumns("grid-cols-5", "classic")).toEqual({
        cols: 5,
        className: "grid-cols-2 @content-md/page:grid-cols-3 @content-lg/page:grid-cols-4 @content-xl/page:grid-cols-5",
      });
    });

    it("defaults to 2 columns when value is null", () => {
      expect(resolveGridColumns(null, "classic")).toEqual({
        cols: 2,
        className: "grid-cols-1 @content-md/page:grid-cols-2",
      });
    });

    it("defaults to 2 columns when value is undefined", () => {
      expect(resolveGridColumns(undefined, "classic")).toEqual({
        cols: 2,
        className: "grid-cols-1 @content-md/page:grid-cols-2",
      });
    });

    it("defaults to 2 columns for unknown values", () => {
      expect(resolveGridColumns("grid-cols-7", "classic")).toEqual({
        cols: 2,
        className: "grid-cols-1 @content-md/page:grid-cols-2",
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
          className: "grid-cols-1 @content-md/page:grid-cols-2",
        });
      }
    });
  });
});
