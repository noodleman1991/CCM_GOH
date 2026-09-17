import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { caseStudySubmissionSchema } from "@/lib/validation/case-study";
import { addOutput } from "@/lib/actions/workspace-outputs";
import { rateLimitRequest } from "@/lib/rate-limit-route";
import { CaseStudyEditNotAllowedError, submitCaseStudy } from "@/lib/content/case-studies";
import { captureAfterResponse } from "@/lib/analytics/server";

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function POST(request: NextRequest) {
  const limited = await rateLimitRequest(request, "case-study:submit", { limit: 5, windowSeconds: 600 });
  if (limited) return limited;

    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get full user data from Clerk
        const clerkUser = await currentUser();
        if (!clerkUser) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        const formData = await request.formData();
        const dataString = formData.get("data") as string;
        const imageFile = formData.get("image") as File | null;

        if (!dataString) {
            return NextResponse.json(
                { error: "No data provided" },
                { status: 400 }
            );
        }

        let parsedData: unknown;
        try {
            parsedData = JSON.parse(dataString);
        } catch {
            return NextResponse.json(
                { error: "Invalid JSON in data field" },
                { status: 400 }
            );
        }

        const validation = caseStudySubmissionSchema.safeParse(parsedData);
        if (!validation.success) {
            return NextResponse.json(
                {
                    error: "Validation failed",
                    details: validation.error.flatten(),
                },
                { status: 400 }
            );
        }

        const data = validation.data;

        // Prepare location data
        let studyLocation: { lat?: number; lng?: number } | undefined;
        if (data.studyLocation && data.studyLocation.lat && data.studyLocation.lng) {
            studyLocation = { lat: data.studyLocation.lat, lng: data.studyLocation.lng };
        }

        // Handle image upload if provided — validated here (size/mime), the
        // buffer + filename sanitize travel to the content layer for the
        // actual asset upload.
        let imagePayload: { buffer: Buffer; filename: string; contentType: string } | null = null;
        if (imageFile) {
            if (imageFile.size > MAX_FILE_SIZE) {
                return NextResponse.json(
                    { error: "File too large. Maximum size is 5MB." },
                    { status: 400 }
                );
            }

            if (!ALLOWED_IMAGE_TYPES.includes(imageFile.type)) {
                return NextResponse.json(
                    { error: "Invalid file type. Allowed: JPEG, PNG, WebP" },
                    { status: 400 }
                );
            }

            const sanitizedFilename = imageFile.name
                .replace(/[^a-zA-Z0-9._-]/g, '_')
                .substring(0, 255);

            const buffer = await imageFile.arrayBuffer();
            imagePayload = { buffer: Buffer.from(buffer), filename: sanitizedFilename, contentType: imageFile.type };
        }

        const result = await submitCaseStudy({
            userId,
            title: data.title,
            excerpt: data.excerpt,
            content: data.content,
            topic: data.topic,
            layout: data.layout,
            authors: data.authors,
            tags: data.tags,
            organizationName: data.organizationName,
            relatedCommunity: data.relatedCommunity,
            studyPeriod: data.studyPeriod,
            locationText: data.locationText,
            studyLocation,
            place: data.place,
            editId: data.editId,
            clerkImageUrl: clerkUser.imageUrl,
            clerkUsername: clerkUser.username,
            image: imagePayload,
        });

        // Log submission for tracking
        console.log(`Case study submitted by user ${userId} (${clerkUser.emailAddresses[0]?.emailAddress}): ${result.id}`);

        captureAfterResponse({
                event: "submission_submitted",
                distinctId: userId,
                properties: { kind: "case_study", is_resubmission: Boolean(data.editId), has_image: Boolean(imagePayload) },
            });

        // Submitted from a workspace: link the new doc as a workspace output.
        // addOutput enforces collab authz itself; a failed link never fails the
        // submission. Skipped on edit — the output row already exists, and
        // addOutput doesn't dedupe.
        if (typeof data.collaborationId === "string" && data.collaborationId && !data.editId) {
            const linked = await addOutput({
                collaborationId: data.collaborationId,
                sanityType: "caseStudy",
                mode: "link",
                sanityId: result.id,
                title: data.title.en,
            });
            if (!linked.ok) console.warn(`Workspace link failed for ${result.id}: ${linked.error}`);
        }

        return NextResponse.json({
            success: true,
            id: result.id,
            slug: result.slug,
            status: result.status,
            message: "Case study submitted successfully. It will be reviewed by our team before publication.",
        });

    } catch (error) {
        if (error instanceof CaseStudyEditNotAllowedError) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        console.error("❌ Failed to submit case study:", error);
        console.error("Error details:", {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
            dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
            hasToken: !!process.env.SANITY_API_EDITOR_TOKEN
        });

        return NextResponse.json(
            {
                error: "Failed to submit case study",
                message: error instanceof Error ? error.message : 'An unknown error occurred',
            },
            { status: 500 }
        );
    }
}
