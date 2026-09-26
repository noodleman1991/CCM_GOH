"use client";

import { useCallback, useMemo, useState } from "react";
import { translateIssues, valueAt, type FieldIssue, type Translator } from "@/lib/validation/messages";
import { errorId, fieldId } from "@/components/forms/errors/field-id";

type ServerError = { message: string; value: unknown };

/**
 * The one error behaviour every form shares: quiet while typing, checked on
 * leaving a field, cleared the moment it's fixed, everything on submit.
 */
export function useFormErrors<T>({
  values,
  validate,
  t,
  order,
}: {
  values: T;
  validate: (values: T) => FieldIssue[];
  t: Translator;
  order: string[];
}) {
  const [shown, setShown] = useState<ReadonlySet<string>>(new Set());
  const [server, setServer] = useState<Record<string, ServerError>>({});

  const current = useMemo(() => translateIssues(validate(values), t, values), [validate, values, t]);

  // A server error lives only while its field keeps the value it was reported for.
  const liveServer = useMemo(() => {
    const kept: Record<string, string> = {};
    for (const [path, entry] of Object.entries(server)) {
      if (Object.is(valueAt(values, path), entry.value)) kept[path] = entry.message;
    }
    return kept;
  }, [server, values]);

  const errors = useMemo(() => {
    const visible: Record<string, string> = {};
    for (const path of Object.keys(current)) if (shown.has(path)) visible[path] = current[path];
    return { ...visible, ...liveServer };
  }, [current, shown, liveServer]);

  const leave = useCallback((path: string) => {
    setShown((prev) => (prev.has(path) ? prev : new Set(prev).add(path)));
  }, []);

  const validateAll = useCallback(() => {
    const paths = Object.keys(current);
    setShown((prev) => new Set([...prev, ...paths]));
    return paths.length === 0;
  }, [current]);

  const setServerErrors = useCallback(
    (fields: Record<string, string>) => {
      setServer(
        Object.fromEntries(
          Object.entries(fields).map(([path, message]) => [path, { message, value: valueAt(values, path) }]),
        ),
      );
    },
    [values],
  );

  const focusFirstError = useCallback(() => {
    const visible = { ...current, ...liveServer };
    const first = order.find((path) => visible[path]) ?? Object.keys(visible)[0];
    if (!first) return;
    const element = document.getElementById(fieldId(first));
    element?.scrollIntoView({ block: "center", behavior: "smooth" });
    element?.focus({ preventScroll: true });
  }, [current, liveServer, order]);

  const describedBy = useCallback(
    (path: string): { "aria-invalid"?: true; "aria-describedby"?: string } =>
      errors[path] ? { "aria-invalid": true, "aria-describedby": errorId(path) } : {},
    [errors],
  );

  return { errors, leave, validateAll, setServerErrors, focusFirstError, describedBy };
}
