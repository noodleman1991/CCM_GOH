// import Link from "next/link";
import Image from 'next/image';

export default function Logo({ className = "", size = "default" }) {
    const sizeVariants = {
        sm: { width: 64, height: 18 },      // Small - nav bars
        default: { width: 100, height: 29 }, // Default
        md: { width: 128, height: 37 },     // Medium
        lg: { width: 160, height: 46 },     // Large
        xl: { width: 242, height: 71 }      // Extra large
    }  as any;

    const { width, height } = sizeVariants[size];

    return (
        // <Link
        //     href="/"
        //     className={`inline-block transition-opacity hover:opacity-80 ${className}`}
        //     aria-label="Go to homepage"
        // >
            <Image
                src="/connecting-climate-minds-logo-white.png"
                alt="Connecting Climate Minds Logo"
                width={width}
                height={height}
                priority={size === 'default' || size === 'lg'}
                className="transition-all duration-200"
            />
        // </Link>
    );
}
