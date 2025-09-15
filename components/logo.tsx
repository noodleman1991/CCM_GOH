import Link from "next/link";
import Image from 'next/image';
import { cn } from "@/lib/utils";

export default function Logo({ className = "", size = "default" }) {
    // Smart sizing that adapts to container
    const sizeClasses = {
        sm: "h-4 w-auto",           // Small - nav bars
        default: "h-6 w-auto",     // Default
        md: "h-8 w-auto",          // Medium
        lg: "w-full h-auto max-h-12",  // Large - sidebar (fit width)
        xl: "h-16 w-auto"          // Extra large
    };

    // Base dimensions for Next.js Image (maintaining aspect ratio)
    const baseDimensions = {
        width: 242,
        height: 83
    };

    return (
        <Link
            href="/"
            className={cn(
                "inline-flex items-center transition-opacity hover:opacity-80",
                className
            )}
            aria-label="Go to homepage"
        >
            <Image
                src="/connecting-climate-minds-logo-white.png"
                alt="Connecting Climate Minds Logo"
                width={baseDimensions.width}
                height={baseDimensions.height}
                priority={size === 'default' || size === 'lg'}
                className={cn(
                    "transition-all duration-200 object-contain",
                    sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.default
                )}
            />
        </Link>
    );
}
