import { urlFor } from "@/sanity/lib/image";
import { BackgroundOptionType } from "@/types/background-option";

export function getBackgroundStyles(backgroundOption?: BackgroundOptionType | null): {
  style?: React.CSSProperties;
  className?: string;
} {
  // Debug logging
  if (process.env.NODE_ENV === "development" && backgroundOption) {
    console.log("Background option received:", JSON.stringify(backgroundOption, null, 2));
  }

  if (!backgroundOption || backgroundOption.type === "none") {
    return {};
  }

  switch (backgroundOption.type) {
    case "color":
      if (backgroundOption.color?.hex) {
        // Handle alpha channel if present
        const alpha = backgroundOption.color.alpha;
        if (alpha !== undefined && alpha < 1) {
          // Convert hex to rgba with alpha
          const hex = backgroundOption.color.hex;
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          return {
            style: {
              backgroundColor: `rgba(${r}, ${g}, ${b}, ${alpha})`,
            },
          };
        } else {
          return {
            style: {
              backgroundColor: backgroundOption.color.hex,
            },
          };
        }
      }
      break;

    case "svg":
      if (backgroundOption.svgPattern?.asset?._id) {
        const svgUrl = backgroundOption.svgPattern.asset.url || 
          `https://cdn.sanity.io/files/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/${process.env.NEXT_PUBLIC_SANITY_DATASET}/${backgroundOption.svgPattern.asset._id}`;
        return {
          style: {
            backgroundImage: `url("${svgUrl}")`,
            backgroundRepeat: "repeat",
            backgroundSize: "auto",
          },
        };
      }
      break;

    case "image":
      if (backgroundOption.image?.asset?._id) {
        const imageUrl = urlFor(backgroundOption.image).url();
        return {
          style: {
            backgroundImage: `url("${imageUrl}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          },
        };
      }
      break;
  }

  return {};
}