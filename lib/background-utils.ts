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
      if (backgroundOption.color) {
        return {
          style: {
            backgroundColor: backgroundOption.color,
          },
        };
      }
      break;

    case "gradient":
      if (backgroundOption.gradient?.startColor && backgroundOption.gradient?.endColor) {
        const direction = backgroundOption.gradient.direction || "to-r";

        // Map Tailwind direction classes to CSS gradient directions
        const directionMap: Record<string, string> = {
          "to-r": "to right",
          "to-l": "to left",
          "to-b": "to bottom",
          "to-t": "to top",
          "to-br": "to bottom right",
          "to-bl": "to bottom left",
          "to-tr": "to top right",
          "to-tl": "to top left",
        };

        const cssDirection = directionMap[direction] || "to right";

        return {
          style: {
            background: `linear-gradient(${cssDirection}, ${backgroundOption.gradient.startColor}, ${backgroundOption.gradient.endColor})`,
          },
        };
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