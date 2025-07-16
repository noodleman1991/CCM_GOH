import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@sanity/client";
import { v4 as uuidv4 } from "uuid";

const sanityClient = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
    apiVersion: "2024-01-01",
    token: process.env.SANITY_API_WRITE_TOKEN,
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

        // Prepare the case study document
        const caseStudyDoc: any = {
            _type: "caseStudy",
            title: data.title,
            subtitle: data.subtitle,
            slug: {
                current: `${slug}-${uuidv4().slice(0, 8)}`,
            },
            excerpt: data.excerpt,
            submittedBy: data.submittedBy,
            authors: data.authors,
            tags: data.tags.map((tagId: string) => ({
                _type: "reference",
                _ref: tagId,
            })),
            content: Object.entries(data.content).map(([lang, text]) => {
                if (!text) return null;
                return {
                    _type: "block",
                    _key: uuidv4(),
                    style: "normal",
                    children: [
                        {
                            _type: "span",
                            _key: uuidv4(),
                            text: text as string,
                            marks: [],
                        },
                    ],
                    markDefs: [],
                };
            }).filter(Boolean),
            studyPeriod: data.studyPeriod,
            location: data.location,
            status: "pending",
            _createdAt: new Date().toISOString(),
        };

        // If organization name is provided, try to find or create it
        if (data.organizationName) {
            const existingOrg = await sanityClient.fetch(
                `*[_type == "organization" && name == $name][0]`,
                { name: data.organizationName }
            );

            if (existingOrg) {
                caseStudyDoc.organization = {
                    _type: "reference",
                    _ref: existingOrg._id,
                };
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

                caseStudyDoc.organization = {
                    _type: "reference",
                    _ref: newOrg._id,
                };
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
            };
        }

        // Create the case study document in Sanity
        const result = await sanityClient.create(caseStudyDoc);

        // Send notification email to admins (optional)
        // You can implement this using your email service

        return NextResponse.json({
            success: true,
            id: result._id,
            message: "Case study submitted successfully. It will be reviewed by our team.",
        });
    } catch (error) {
        console.error("Failed to submit case study:", error);
        return NextResponse.json(
            { error: "Failed to submit case study" },
            { status: 500 }
        );
    }
}
