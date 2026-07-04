import "server-only";
import { createNotification } from "@/lib/notifications/service";
import { buildNotifications, type LifecycleEvent } from "@/lib/notifications/lifecycle";

/**
 * The ONE fan-out for project-lifecycle notifications (experience-plan X3).
 * Every event names its audience explicitly; the payload builders are pure
 * (lib/notifications/lifecycle.ts, TDD'd) and this thin wrapper just writes
 * the rows. Bell, inbox, workspace Overview and the weekly digest all read
 * the same rows — no parallel notification systems.
 *
 * Never throws: a failed notification must never fail the action that
 * triggered it.
 */
export async function emitLifecycle(event: LifecycleEvent): Promise<void> {
  try {
    const rows = buildNotifications(event);
    await Promise.all(rows.map((row) => createNotification(row)));
  } catch (error) {
    console.warn("[notifications] emit failed:", error);
  }
}
