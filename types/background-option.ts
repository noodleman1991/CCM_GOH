// Background option type definition for manual extension of Sanity types
export interface BackgroundOptionType {
  type?: "none" | "color" | "svg" | "image";
  color?: {
    _type?: "color";
    hex?: string;
    alpha?: number;
    hsl?: {
      _type: "hslaColor";
      h: number;
      s: number;
      l: number;
      a: number;
    };
    hsv?: {
      _type: "hsvaColor";
      h: number;
      s: number;
      v: number;
      a: number;
    };
    rgb?: {
      _type: "rgbaColor";
      r: number;
      g: number;
      b: number;
      a: number;
    };
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