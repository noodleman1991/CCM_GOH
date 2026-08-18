"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/authz";

export type UserSettings = {
  emailOnReply: boolean;
  emailOnMention: boolean;
  emailOnMessage: boolean;
  emailWeeklyDigest: boolean;
  allowMessagesFrom: "EVERYONE" | "NOBODY";
};

/** Load the current user's notification + messaging settings (creating defaults). */
export async function getUserSettings(): Promise<UserSettings | null> {
  const actor = await getActor();
  if (!actor) return null;
  const [pref, user] = await Promise.all([
    prisma.notificationPreference.upsert({
      where: { userId: actor.id },
      create: { userId: actor.id },
      update: {},
    }),
    prisma.user.findUnique({ where: { id: actor.id }, select: { allowMessagesFrom: true } }),
  ]);
  return {
    emailOnReply: pref.emailOnReply,
    emailOnMention: pref.emailOnMention,
    emailOnMessage: pref.emailOnMessage,
    emailWeeklyDigest: pref.emailWeeklyDigest,
    allowMessagesFrom: user?.allowMessagesFrom ?? "EVERYONE",
  };
}

const schema = z.object({
  emailOnReply: z.boolean(),
  emailOnMention: z.boolean(),
  emailOnMessage: z.boolean(),
  emailWeeklyDigest: z.boolean(),
  allowMessagesFrom: z.enum(["EVERYONE", "NOBODY"]),
});

export async function saveUserSettings(input: UserSettings): Promise<{ ok: boolean; error?: string }> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sign in." };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid settings." };

  await prisma.$transaction([
    prisma.notificationPreference.upsert({
      where: { userId: actor.id },
      create: {
        userId: actor.id,
        emailOnReply: parsed.data.emailOnReply,
        emailOnMention: parsed.data.emailOnMention,
        emailOnMessage: parsed.data.emailOnMessage,
        emailWeeklyDigest: parsed.data.emailWeeklyDigest,
      },
      update: {
        emailOnReply: parsed.data.emailOnReply,
        emailOnMention: parsed.data.emailOnMention,
        emailOnMessage: parsed.data.emailOnMessage,
        emailWeeklyDigest: parsed.data.emailWeeklyDigest,
      },
    }),
    prisma.user.update({
      where: { id: actor.id },
      data: { allowMessagesFrom: parsed.data.allowMessagesFrom },
    }),
  ]);
  return { ok: true };
}

/** List the users this person has blocked (for the settings block list). */
export async function listBlockedUsers() {
  const actor = await getActor();
  if (!actor) return [];
  const blocks = await prisma.userBlock.findMany({
    where: { blockerId: actor.id },
    include: { blocked: { select: { id: true, username: true, firstName: true, lastName: true, image: true } } },
    orderBy: { createdAt: "desc" },
  });
  return blocks.map((b) => ({
    id: b.blocked.id,
    name: [b.blocked.firstName, b.blocked.lastName].filter(Boolean).join(" ") || b.blocked.username || "Member",
    username: b.blocked.username,
    image: b.blocked.image,
  }));
}
