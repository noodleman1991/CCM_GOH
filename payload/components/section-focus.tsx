"use client";
import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { useFormFields, useLivePreviewContext } from "@payloadcms/ui";
import { backPath, parseSectionTarget } from "./section-focus-target";

/**
 * Opens the editor on the section an "Edit this section" link named: every
 * other row folds, the row scrolls into view, live preview turns on, and a
 * "Back to the page" link returns to the site (editor-experience spec §3.2).
 * Renders nothing when the page was opened any other way.
 */
const subscribeNever = () => () => {};

export function SectionFocus() {
  // The URL is read once the page is in the browser; the server renders nothing.
  const url = useSyncExternalStore(
    subscribeNever,
    () => `${window.location.search}${window.location.hash}`,
    () => "",
  );
  const [search, hash = ""] = url.split("#");
  const target = useMemo(() => (hash ? parseSectionTarget(`#${hash}`) : null), [hash]);
  const from = useMemo(() => backPath(search), [search]);

  const rows = useFormFields(([fields]) => (target ? fields[target.field]?.rows : undefined));
  const dispatch = useFormFields(([, d]) => d);
  const { setIsLivePreviewing } = useLivePreviewContext();
  const done = useRef(false);

  useEffect(() => {
    if (!target || done.current || !rows || target.row >= rows.length) return;
    done.current = true;
    dispatch({
      type: "SET_ALL_ROWS_COLLAPSED",
      path: target.field,
      updatedRows: rows.map((r, i) => ({ ...r, collapsed: i !== target.row })),
    });
    setIsLivePreviewing(true);
    requestAnimationFrame(() =>
      document.getElementById(`${target.field}-row-${target.row}`)?.scrollIntoView({ block: "start", behavior: "smooth" }),
    );
  }, [target, rows, dispatch, setIsLivePreviewing]);

  if (!from) return null;
  return (
    <a href={from} className="ccm-button ccm-button--secondary" style={{ marginBottom: "1rem" }}>
      ← Back to the page
    </a>
  );
}
