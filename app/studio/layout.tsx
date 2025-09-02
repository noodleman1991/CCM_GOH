import type { Metadata } from "next";

// Studio-specific metadata
export const metadata: Metadata = {
    title: "Sanity Studio | Content Management",
    description: "Content management system powered by Sanity Studio",
    robots: "noindex, nofollow", // Studio should not be indexed
};

export default function StudioLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Studio gets NO providers from the main app
    // This ensures complete isolation
    return (
        <html lang="en">
            <body>
                {children}
            </body>
        </html>
    );
}
