// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useFormErrors } from "@/components/forms/errors/use-form-errors";
import { fieldId } from "@/components/forms/errors/field-id";
import type { FieldIssue } from "@/lib/validation/messages";

const t = (key: string) => key;
const validate = (v: { title: string; summary: string }): FieldIssue[] => [
  ...(v.title.length < 5 ? [{ path: "title", key: "title.tooShort" }] : []),
  ...(v.summary.length < 3 ? [{ path: "summary", key: "summary.tooShort" }] : []),
];

function setup(initial = { title: "", summary: "" }) {
  return renderHook(({ values }) => useFormErrors({ values, validate, t, order: ["title", "summary"] }), {
    initialProps: { values: initial },
  });
}

describe("useFormErrors", () => {
  it("shows nothing while typing, then the error once the field is left", () => {
    const { result, rerender } = setup();
    rerender({ values: { title: "ab", summary: "" } });
    expect(result.current.errors).toEqual({});
    act(() => result.current.leave("title"));
    expect(result.current.errors).toEqual({ title: "title.tooShort" });
  });

  it("clears an error the moment it is fixed", () => {
    const { result, rerender } = setup({ title: "ab", summary: "" });
    act(() => result.current.leave("title"));
    rerender({ values: { title: "abcdef", summary: "" } });
    expect(result.current.errors).toEqual({});
  });

  it("validateAll shows every problem and reports failure", () => {
    const { result } = setup();
    let ok = true;
    act(() => { ok = result.current.validateAll(); });
    expect(ok).toBe(false);
    expect(Object.keys(result.current.errors)).toEqual(["title", "summary"]);
  });

  it("a server error clears when that field changes", () => {
    const { result, rerender } = setup({ title: "abcdef", summary: "abcd" });
    act(() => result.current.setServerErrors({ summary: "Too similar to another case study" }));
    expect(result.current.errors.summary).toBe("Too similar to another case study");
    rerender({ values: { title: "abcdef", summary: "abcde" } });
    expect(result.current.errors.summary).toBeUndefined();
  });

  it("focuses the first problem in page order", () => {
    const input = document.createElement("input");
    input.id = fieldId("summary");
    input.scrollIntoView = vi.fn();
    document.body.appendChild(input);
    const { result } = setup({ title: "abcdef", summary: "" });
    act(() => { result.current.validateAll(); });
    act(() => result.current.focusFirstError());
    expect(document.activeElement).toBe(input);
    expect(input.scrollIntoView).toHaveBeenCalledWith({ block: "center", behavior: "smooth" });
  });

  it("links the field to its message for screen readers", () => {
    const { result } = setup();
    act(() => { result.current.validateAll(); });
    expect(result.current.describedBy("title")).toEqual({ "aria-invalid": true, "aria-describedby": "field-title-error" });
    expect(result.current.describedBy("other")).toEqual({});
  });
});
