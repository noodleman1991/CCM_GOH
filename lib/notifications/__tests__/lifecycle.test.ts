import { describe, it, expect } from "vitest";
import { buildNotifications } from "@/lib/notifications/lifecycle";

describe("buildNotifications", () => {
  it("task_assigned targets exactly the assignee with the task title", () => {
    const rows = buildNotifications({
      kind: "task_assigned",
      assigneeId: "u2",
      actorId: "u1",
      collaborationId: "c1",
      taskTitle: "Draft survey items",
    });
    expect(rows).toEqual([
      {
        recipientId: "u2",
        type: "TASK_ASSIGNED",
        actorId: "u1",
        entityType: "collaboration",
        entityId: "c1",
        snippet: "Draft survey items",
      },
    ]);
  });

  it("output_status fans out to deduped members with title + status snippet", () => {
    const rows = buildNotifications({
      kind: "output_status",
      memberIds: ["u1", "u2", "u2", ""],
      collaborationId: "c1",
      outputTitle: "Mangrove case study",
      status: "approved",
      sanityId: "s1",
    });
    expect(rows.map((r) => r.recipientId)).toEqual(["u1", "u2"]);
    expect(rows[0].snippet).toBe("Mangrove case study — approved");
    expect(rows[0].type).toBe("OUTPUT_STATUS");
  });

  it("thread_reply targets participants with the thread as entity", () => {
    const rows = buildNotifications({
      kind: "thread_reply",
      participantIds: ["u3"],
      actorId: "u1",
      collaborationId: "c1",
      threadId: "t9",
      threadTitle: "Survey wave 3",
    });
    expect(rows[0]).toMatchObject({ type: "THREAD_REPLY", entityType: "collaborationThread", entityId: "t9" });
  });

  it("followed_publish carries the published entity", () => {
    const rows = buildNotifications({
      kind: "followed_publish",
      followerIds: ["f1", "f2"],
      entityType: "caseStudy",
      entityId: "cs1",
      title: "New output",
    });
    expect(rows).toHaveLength(2);
    expect(rows[1]).toMatchObject({ type: "FOLLOWED_PUBLISH", entityType: "caseStudy", entityId: "cs1" });
  });

  it("event_reminder has no actor and targets attendees", () => {
    const rows = buildNotifications({
      kind: "event_reminder",
      attendeeIds: ["a1"],
      eventId: "e1",
      eventTitle: "Webinar",
    });
    expect(rows[0]).toMatchObject({ type: "EVENT_REMINDER", entityId: "e1", snippet: "Webinar" });
    expect(rows[0].actorId).toBeUndefined();
  });
});
