"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

/**
 * Notion-style edit-in-place text. In view mode (or when !canEdit) it renders
 * the value as the given element. In edit mode, clicking turns it into an
 * input/textarea that commits on blur or Enter (Shift+Enter for newline in
 * multiline) and cancels on Esc. Optimistic: shows the typed value immediately;
 * the caller's onCommit persists and may revert on failure.
 */
export function InlineText({
  value,
  onCommit,
  canEdit,
  as = "span",
  multiline = false,
  placeholder,
  className,
  inputClassName,
}: {
  value: string;
  onCommit: (next: string) => void | Promise<void>;
  canEdit: boolean;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  multiline?: boolean;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (editing) {
      ref.current?.focus();
      ref.current?.select?.();
    }
  }, [editing]);

  // Keep the draft in sync if the value changes externally while not editing.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional external-value -> draft sync while not editing
    if (!editing) setDraft(value);
  }, [value, editing]);

  const commit = () => {
    setEditing(false);
    const next = draft.trim();
    if (next !== value.trim()) onCommit(next);
    else setDraft(value);
  };
  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  const Tag = as;

  if (!canEdit || !editing) {
    const empty = !value.trim();
    return (
      <Tag
        onClick={() => canEdit && setEditing(true)}
        role={canEdit ? "button" : undefined}
        tabIndex={canEdit ? 0 : undefined}
        onKeyDown={(e) => {
          if (canEdit && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            setEditing(true);
          }
        }}
        className={cn(
          className,
          canEdit && "cursor-text rounded-sm transition-colors hover:bg-muted/50",
          empty && "text-muted-foreground italic"
        )}
      >
        {empty ? placeholder ?? "" : value}
      </Tag>
    );
  }

  const sharedProps = {
    ref: ref as never,
    value: draft,
    placeholder,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
    onBlur: commit,
    className: cn(
      "w-full rounded-sm border border-input bg-background px-1.5 py-0.5 outline-none focus-visible:ring-1 focus-visible:ring-ring",
      inputClassName
    ),
  };

  if (multiline) {
    return (
      <textarea
        {...sharedProps}
        rows={3}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            cancel();
          }
        }}
      />
    );
  }

  return (
    <input
      {...sharedProps}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
        } else if (e.key === "Escape") {
          cancel();
        }
      }}
    />
  );
}
