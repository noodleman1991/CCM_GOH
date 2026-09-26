// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { localDraftKey, useCaseStudyDraft } from "@/components/forms/case-study/use-case-study-draft";

type V = { title: string };

/** A fetch whose replies the test releases one by one. */
function controllableFetch() {
  const calls: Array<{ body: { draftId?: string | null; draftData: V }; resolve: (id: string) => void }> = [];
  const fetchMock = vi.fn((_url: string, init: RequestInit) => {
    return new Promise<Response>((done) => {
      calls.push({ body: JSON.parse(String(init.body)), resolve: (id) => done(new Response(JSON.stringify({ id }))) });
    });
  });
  return { calls, fetchMock };
}

function mountHook(initial: V) {
  const setDraftId = vi.fn();
  const hook = renderHook(
    ({ values, draftId }: { values: V; draftId: string | null }) =>
      useCaseStudyDraft({ values, hydrated: true, worthSaving: true, locale: "en", draftId, setDraftId }),
    { initialProps: { values: initial, draftId: null as string | null } },
  );
  return { ...hook, setDraftId };
}

let fetchCtl: ReturnType<typeof controllableFetch>;
beforeEach(() => {
  vi.useFakeTimers();
  fetchCtl = controllableFetch();
  vi.stubGlobal("fetch", fetchCtl.fetchMock);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("draft autosave, one request at a time", () => {
  it("changes during a slow first save make one draft, then one update with the latest values", async () => {
    const { rerender } = mountHook({ title: "" });
    rerender({ values: { title: "A" }, draftId: null });
    await act(() => vi.advanceTimersByTimeAsync(1500));
    expect(fetchCtl.calls).toHaveLength(1); // the create, still waiting

    rerender({ values: { title: "AB" }, draftId: null });
    await act(() => vi.advanceTimersByTimeAsync(1500));
    rerender({ values: { title: "ABC" }, draftId: null });
    await act(() => vi.advanceTimersByTimeAsync(1500));
    expect(fetchCtl.calls).toHaveLength(1); // nothing overlaps the create

    await act(async () => fetchCtl.calls[0].resolve("d1"));
    expect(fetchCtl.calls).toHaveLength(2);
    expect(fetchCtl.calls[0].body).toMatchObject({ draftId: null, draftData: { title: "A" } });
    expect(fetchCtl.calls[1].body).toMatchObject({ draftId: "d1", draftData: { title: "ABC" } });
    await act(async () => fetchCtl.calls[1].resolve("d1"));
    await act(() => vi.advanceTimersByTimeAsync(5000));
    expect(fetchCtl.calls).toHaveLength(2);
  });

  it("Save draft while a save is waiting on the timer sends once", async () => {
    const { result, rerender } = mountHook({ title: "" });
    rerender({ values: { title: "Hello" }, draftId: null });
    await act(() => vi.advanceTimersByTimeAsync(500));
    await act(async () => { void result.current.saveNow(); });
    expect(fetchCtl.calls).toHaveLength(1);
    await act(async () => fetchCtl.calls[0].resolve("d1"));
    await act(() => vi.advanceTimersByTimeAsync(3000));
    expect(fetchCtl.calls).toHaveLength(1);
  });

  it("keeps the on-device copy when newer edits arrived during a save", async () => {
    const { rerender } = mountHook({ title: "" });
    rerender({ values: { title: "First" }, draftId: null });
    await act(() => vi.advanceTimersByTimeAsync(1500));
    rerender({ values: { title: "First, then more" }, draftId: null }); // typed while the create is out
    await act(async () => fetchCtl.calls[0].resolve("d1"));

    const kept = JSON.parse(localStorage.getItem(localDraftKey("d1")) ?? "null");
    expect(kept?.values).toEqual({ title: "First, then more" });
    expect(localStorage.getItem(localDraftKey(null))).toBeNull();

    // Once the newest values are saved too, the copy is no longer needed.
    expect(fetchCtl.calls).toHaveLength(2);
    await act(async () => fetchCtl.calls[1].resolve("d1"));
    expect(localStorage.getItem(localDraftKey("d1"))).toBeNull();
  });
});
