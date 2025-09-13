// Background option type definition for manual extension of Sanity types
export interface BackgroundOptionType {
  type?: "none" | "color" | "gradient" | "svg" | "image";
  color?: string; // Hex color string (e.g., "#205596")
  gradient?: {
    direction?: "to-r" | "to-l" | "to-b" | "to-t" | "to-br" | "to-bl" | "to-tr" | "to-tl";
    startColor?: string; // Hex color string
    endColor?: string; // Hex color string
  };
  svgPattern?: {
    asset?: {
      _id?: string;
      url?: string;
    };
  };
  image?: {
    asset?: {
      _id?: string;
    };
    alt?: string;
  };
}