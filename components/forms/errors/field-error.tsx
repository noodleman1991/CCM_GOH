import { AlertCircle } from "lucide-react";
import { errorId } from "@/components/forms/errors/field-id";

/** The sentence under a field. Same look in every form. */
export function FieldError({ path, message }: { path: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={errorId(path)} aria-live="polite" className="mt-1.5 flex items-start gap-1.5 text-sm text-destructive">
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{message}</span>
    </p>
  );
}
