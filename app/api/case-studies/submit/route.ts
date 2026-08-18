import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createClient } from "@sanity/client";
import { v4 as uuidv4 } from "uuid";
import { caseStudySubmissionSchema, generateCaseStudySlug } from "@/lib/validation/case-study";
import { addOutput } from "@/lib/actions/workspace-outputs";
import { rateLimitRequest } from "@/lib/rate-limit-route";

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const sanityClient = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
    apiVersion: "2024-10-31",
    token: process.env.SANITY_API_EDITOR_TOKEN,
    useCdn: false,
});

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

        // Generate a unique, unicode-safe slug from the English title
        const slug = generateCaseStudySlug(data.title.en);

        // Prepare location data
        let studyLocation = null;
        if (data.studyLocation && data.studyLocation.lat && data.studyLocation.lng) {
            studyLocation = {
                _type: 'geopoint',
                lat: data.studyLocation.lat,
                lng: data.studyLocation.lng
            };
        }

        // Prepare the case study document
        const caseStudyDoc: { _type: string } & Record<string, unknown> = {
            _type: "caseStudy",
            title: data.title,
            slug: {
                current: slug,
            },
            excerpt: data.excerpt,
            content: data.content, // Already in portable text format from editor

            // User information from Clerk
            submittedBy: userId,
            submittedAt: new Date().toISOString(),

            // Authors with enhanced user data
            authors: data.authors.map((author: { userId?: string; name?: string; email?: string; role?: string; affiliation?: string }, index: number) => ({
                _key: uuidv4(),
                userId: author.userId || (index === 0 ? userId : undefined), // First author is submitter
                name: author.name,
                email: author.email,
                role: author.role,
                // Add Clerk user data for the submitter
                ...(index === 0 && {
                    clerkUserId: userId,
                    clerkImageUrl: clerkUser.imageUrl,
                    clerkUsername: clerkUser.username,
                })
            })),

            // A1: Include topic from form
            topic: data.topic || "other",

            // Task E3: detail-page layout archetype chosen in the editor shell
            layout: data.layout ?? "story",

            tags: data.tags.map((tagId: string) => ({
                _type: "reference",
                _ref: tagId,
                _key: uuidv4(), // A2: Sanity arrays require _key
            })),

            studyPeriod: data.studyPeriod,
            locationText: data.locationText,
            studyLocation: studyLocation,

            // PlacePicker value (Task 4) — takes precedence over the legacy
            // city/country geocode pair above when the submitter used the
            // new picker.
            ...(data.place ? {
                studyLocation: { _type: "geopoint", lat: data.place.lat, lng: data.place.lng },
                locationDisplayText: data.place.text,
                locationPrecision: data.place.precision,
                locationCountryCode: data.place.countryCode3 ?? undefined,
            } : {}),

            // Default status for review workflow
            status: "pending",
            featured: false,
        };

        // Add regional community reference if provided
        if (data.relatedCommunity && data.relatedCommunity !== '') {
            caseStudyDoc.relatedCommunity = {
                _type: "reference",
                _ref: data.relatedCommunity,
            };
        }

        // If organization name is provided, try to find or create it
        if (data.organizationName) {
            const existingOrg = await sanityClient.fetch(
                `*[_type == "organization" && name == $name][0]`,
                { name: data.organizationName }
            );

            if (existingOrg) {
                caseStudyDoc.organizations = [
                    {
                        _type: "reference",
                        _ref: existingOrg._id,
                    }
                ];
            } else {
                // Create a new organization
                const newOrg = await sanityClient.create({
                    _type: "organization",
                    name: data.organizationName,
                    slug: {
                        current: generateCaseStudySlug(data.organizationName),
                    },
                    type: "other",
                });

                caseStudyDoc.organizations = [
                    {
                        _type: "reference",
                        _ref: newOrg._id,
                    }
                ];
            }
        }

        // Handle image upload if provided
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
            const asset = await sanityClient.assets.upload("image", Buffer.from(buffer), {
                filename: sanitizedFilename,
            });

            caseStudyDoc.image = {
                _type: "image",
                asset: {
                    _type: "reference",
                    _ref: asset._id,
                },
                alt: `Featured image for ${data.title.en}`,
            };
        }

        // X7 edit mode: resubmit an existing draft/pending doc — verify the
        // caller may edit it, then patch (status returns to pending for
        // re-review). Slug and submittedBy are preserved.
        let result: { _id: string; slug: { current: string }; status: string };
        if (data.editId) {
            const existing = await sanityClient.fetch(
                `*[_id == $id][0]{ _id, submittedBy, status, slug }`,
                { id: data.editId }
            );
            const editable = existing && ["pending", "revision", "draft", null].includes(existing.status ?? null);
            const isSubmitter = existing?.submittedBy === userId;
            let isWorkspaceMember = false;
            if (existing && !isSubmitter) {
                const { prisma } = await import("@/lib/prisma");
                const row = await prisma.workspaceOutput.findFirst({
                    where: {
                        sanityId: { in: [existing._id, existing._id.replace(/^drafts\./, "")] },
                        collaboration: { members: { some: { userId } } },
                    },
                    select: { id: true },
                });
                isWorkspaceMember = !!row;
            }
            if (!existing || !editable || (!isSubmitter && !isWorkspaceMember)) {
                return NextResponse.json({ error: "You can't edit this submission." }, { status: 403 });
            }
            const { slug: _slug, submittedBy: _sb, ...updatable } = caseStudyDoc;
            const patched = await sanityClient
                .patch(existing._id)
                .set({ ...updatable, status: "pending" })
                .commit();
            result = { _id: patched._id, slug: existing.slug, status: "pending" };
        } else {
            // Create the case study document in Sanity
            const created = await sanityClient.create(caseStudyDoc);
            result = {
                _id: created._id,
                slug: created.slug as { current: string },
                status: created.status as string,
            };
        }

        // Log submission for tracking
        console.log(`Case study submitted by user ${userId} (${clerkUser.emailAddresses[0]?.emailAddress}): ${result._id}`);

        // Submitted from a workspace: link the new doc as a workspace output.
        // addOutput enforces collab authz itself; a failed link never fails the
        // submission. Skipped on edit — the output row already exists, and
        // addOutput doesn't dedupe.
        if (typeof data.collaborationId === "string" && data.collaborationId && !data.editId) {
            const linked = await addOutput({
                collaborationId: data.collaborationId,
                sanityType: "caseStudy",
                mode: "link",
                sanityId: result._id,
                title: data.title.en,
            });
            if (!linked.ok) console.warn(`Workspace link failed for ${result._id}: ${linked.error}`);
        }

        return NextResponse.json({
            success: true,
            id: result._id,
            slug: result.slug.current,
            status: result.status,
            message: "Case study submitted successfully. It will be reviewed by our team before publication.",
        });

    } catch (error) {
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
