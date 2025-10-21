import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createClient } from "@sanity/client";
import { v4 as uuidv4 } from "uuid";

const sanityClient = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
    apiVersion: "2024-10-31",
    token: process.env.SANITY_API_EDITOR_TOKEN,
    useCdn: false,
});

export async function POST(request: NextRequest) {
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

        const data = JSON.parse(dataString);

        // Generate slug from English title
        const slug = data.title.en
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();

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
        const caseStudyDoc: any = {
            _type: "caseStudy",
            title: data.title,
            subtitle: data.subtitle,
            slug: {
                current: `${slug}-${uuidv4().slice(0, 8)}`,
            },
            excerpt: data.excerpt,
            content: data.content, // Already in portable text format from editor

            // User information from Clerk
            submittedBy: userId,
            submittedAt: new Date().toISOString(),

            // Authors with enhanced user data
            authors: data.authors.map((author: any, index: number) => ({
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

            tags: data.tags.map((tagId: string) => ({
                _type: "reference",
                _ref: tagId,
            })),

            studyPeriod: data.studyPeriod,
            locationText: data.locationText,
            studyLocation: studyLocation,

            // Default status for review workflow
            status: "pending",
            featured: false,

            // Metadata
            _createdAt: new Date().toISOString(),
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
                        current: data.organizationName
                            .toLowerCase()
                            .replace(/[^\w\s-]/g, '')
                            .replace(/\s+/g, '-')
                            .replace(/-+/g, '-')
                            .trim(),
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
            const buffer = await imageFile.arrayBuffer();
            const asset = await sanityClient.assets.upload("image", Buffer.from(buffer), {
                filename: imageFile.name,
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

        // Create the case study document in Sanity
        const result = await sanityClient.create(caseStudyDoc);

        // Log submission for tracking
        console.log(`Case study submitted by user ${userId} (${clerkUser.emailAddresses[0]?.emailAddress}): ${result._id}`);

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
                details: process.env.NODE_ENV === 'development' ? error : undefined
            },
            { status: 500 }
        );
    }
}
