import Link from "next/link";
import Image from 'next/image';
import { cn } from "@/lib/utils";

interface LogoProps {
    className?: string;
    size?: "sm" | "default" | "md" | "lg" | "xl";
    asChild?: boolean; // When true, don't render the Link wrapper
}

export default function Logo({ className = "", size = "default", asChild = false }: LogoProps) {
    // Smart sizing that adapts to container
    const sizeClasses = {
        sm: "h-4 w-auto",           // Small - nav bars
        default: "h-9 w-auto",     // Default - 40% bigger than original h-6
        md: "h-11 w-auto",         // Medium - 40% bigger than original h-8
        lg: "w-full h-auto max-h-16",  // Large - sidebar (fit width) - 40% bigger
        xl: "h-[104px] w-auto"     // Extra large - 30% bigger than original h-20
    };

    // Base dimensions for Next.js Image (maintaining aspect ratio)
    const baseDimensions = {
        width: 242,
        height: 83
    };

    const logoImage = (
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
    );

    if (asChild) {
        return logoImage;
    }

    return (
        <Link
            href="/"
            className={cn(
                "inline-flex items-center transition-opacity hover:opacity-80",
                className
            )}
            aria-label="Go to homepage"
        >
            {logoImage}
        </Link>
    );
}
