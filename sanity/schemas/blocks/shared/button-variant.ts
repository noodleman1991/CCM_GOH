import { defineType } from "sanity";

export const BUTTON_VARIANTS = [
  { title: "Primary (Sea Blue)", value: "default" },
  { title: "Light (White Background)", value: "invert" },
  { title: "Secondary (Water Blue)", value: "light-invert" },
  { title: "Outline", value: "outline" },
  { title: "Neutral (Gray)", value: "secondary" },
  { title: "Ghost", value: "ghost" },
  { title: "Link", value: "link" },
  { title: "Destructive (Red)", value: "destructive" },
];

export const BUTTON_SIZES = [
  { title: "Default", value: "default" },
  { title: "Wide", value: "wide" },
  { title: "Thick (Bulky)", value: "thick" },
  { title: "Small", value: "sm" },
  { title: "Large", value: "lg" },
];

export const BUTTON_STROKES = [
  { title: "No Border", value: "none" },
  { title: "Light Gray Border", value: "light" },
  { title: "CCM Midnight Border", value: "midnight" },
];

export const buttonVariant = defineType({
  name: "button-variant",
  title: "Button Variant",
  type: "object",
  fields: [
    {
      name: "variant",
      title: "Button Type",
      type: "string",
      options: {
        list: BUTTON_VARIANTS.map(({ title, value }) => ({ title, value })),
        layout: "dropdown",
      },
      initialValue: "default",
    },
    {
      name: "size",
      title: "Button Size",
      type: "string",
      options: {
        list: BUTTON_SIZES.map(({ title, value }) => ({ title, value })),
        layout: "radio",
      },
      initialValue: "default",
    },
    {
      name: "stroke",
      title: "Border Stroke",
      type: "string",
      options: {
        list: BUTTON_STROKES.map(({ title, value }) => ({ title, value })),
        layout: "radio",
      },
      initialValue: "none",
      hidden: ({ parent }: { parent?: any }) => {
        // Only show stroke options for invert variants and outline
        return !parent?.variant || (!parent.variant.includes('invert') && parent.variant !== 'outline');
      },
    }
  ],
  initialValue: {
    variant: "default",
    size: "default",
    stroke: "none",
  },
  preview: {
    select: {
      variant: "variant",
      size: "size",
      stroke: "stroke",
    },
    prepare({ variant, size, stroke }: { variant?: string; size?: string; stroke?: string }) {
      const variantLabels = {
        default: "Default",
        invert: "Inverted",
        "light-invert": "Light Inverted",
        outline: "Outline",
        secondary: "Secondary",
        ghost: "Ghost",
        link: "Link",
        destructive: "Destructive",
      };

      const sizeLabels = {
        default: "Default",
        wide: "Wide",
        thick: "Thick",
        sm: "Small",
        lg: "Large",
      };

      const strokeLabels = {
        none: "",
        light: " + Light Border",
        midnight: " + Midnight Border",
      };

      const variantLabel = variantLabels[variant as keyof typeof variantLabels] || variant;
      const sizeLabel = sizeLabels[size as keyof typeof sizeLabels] || size;
      const strokeLabel = strokeLabels[stroke as keyof typeof strokeLabels] || "";

      return {
        title: `${variantLabel} Button`,
        subtitle: `${sizeLabel}${strokeLabel}`,
      };
    },
  },
});