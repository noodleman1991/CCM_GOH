"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const recentWorkSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().min(1, "Description is required").max(500),
  link: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  isOngoing: z.boolean(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
});

export async function createRecentWork(data: z.infer<typeof recentWorkSchema>) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const validatedData = recentWorkSchema.parse(data);

  // Convert string dates to Date objects
  const startDate = new Date(validatedData.startDate);
  const endDate = validatedData.endDate ? new Date(validatedData.endDate) : null;

  // Validate dates
  if (endDate && startDate > endDate) {
    throw new Error("End date must be after start date");
  }

  if (!validatedData.isOngoing && !endDate) {
    throw new Error("End date is required for completed work");
  }

  try {
    const recentWork = await prisma.recentWork.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        link: validatedData.link || null,
        isOngoing: validatedData.isOngoing,
        startDate,
        endDate: validatedData.isOngoing ? null : endDate,
        userId,
      },
    });

    revalidatePath("/profile");
    revalidatePath("/dashboard");

    return { success: true, data: recentWork };
  } catch (error) {
    console.error("Error creating recent work:", error);
    throw new Error("Failed to create recent work");
  }
}

export async function updateRecentWork(
  id: string,
  data: z.infer<typeof recentWorkSchema>
) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const validatedData = recentWorkSchema.parse(data);

  // Convert string dates to Date objects
  const startDate = new Date(validatedData.startDate);
  const endDate = validatedData.endDate ? new Date(validatedData.endDate) : null;

  // Validate dates
  if (endDate && startDate > endDate) {
    throw new Error("End date must be after start date");
  }

  if (!validatedData.isOngoing && !endDate) {
    throw new Error("End date is required for completed work");
  }

  try {
    // Check if the work belongs to the user
    const existingWork = await prisma.recentWork.findFirst({
      where: { id, userId },
    });

    if (!existingWork) {
      throw new Error("Recent work not found or unauthorized");
    }

    const recentWork = await prisma.recentWork.update({
      where: { id },
      data: {
        title: validatedData.title,
        description: validatedData.description,
        link: validatedData.link || null,
        isOngoing: validatedData.isOngoing,
        startDate,
        endDate: validatedData.isOngoing ? null : endDate,
      },
    });

    revalidatePath("/profile");
    revalidatePath("/dashboard");

    return { success: true, data: recentWork };
  } catch (error) {
    console.error("Error updating recent work:", error);
    throw new Error("Failed to update recent work");
  }
}

export async function deleteRecentWork(id: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    // Check if the work belongs to the user
    const existingWork = await prisma.recentWork.findFirst({
      where: { id, userId },
    });

    if (!existingWork) {
      throw new Error("Recent work not found or unauthorized");
    }

    await prisma.recentWork.delete({
      where: { id },
    });

    revalidatePath("/profile");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error deleting recent work:", error);
    throw new Error("Failed to delete recent work");
  }
}

export async function getUserRecentWork(userId: string) {
  try {
    const recentWork = await prisma.recentWork.findMany({
      where: { userId },
      orderBy: [
        { isOngoing: "desc" },
        { startDate: "desc" },
      ],
    });

    return recentWork;
  } catch (error) {
    console.error("Error fetching recent work:", error);
    throw new Error("Failed to fetch recent work");
  }
}