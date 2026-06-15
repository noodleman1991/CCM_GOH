import { defineType } from "sanity";

/**
 * Curated button options. Editors pick from a SHORT list so buttons stay
 * consistent across the site — the renderer (components/ui/button.tsx) still
 * understands the older values (invert / light-invert / secondary / thick / sm
 * / strokes) so any previously-saved button keeps rendering; they're just no
 * longer offered for NEW buttons.
 */
export const BUTTON_VARIANTS = [
  { title: "Primary — filled brand blue", value: "default" },
  { title: "Secondary — soft blue", value: "secondary" },
  { title: "Outline — bordered", value: "outline" },
  { title: "Ghost — text only", value: "ghost" },
];

export const BUTTON_SIZES = [
  { title: "Default", value: "default" },
  { title: "Large", value: "lg" },
  { title: "Wide", value: "wide" },
];

export const buttonVariant = defineType({
  name: "button-variant",
  title: "Button Style",
  type: "object",
  description:
    "Keep buttons consistent: use Primary for the main action, Secondary/Outline for less important ones, Ghost for subtle links.",
  fields: [
    {
      name: "variant",
      title: "Style",
      type: "string",
      description: "Primary = the main call to action. Use sparingly — one per section.",
      options: {
        list: BUTTON_VARIANTS.map(({ title, value }) => ({ title, value })),
        layout: "radio",
      },
      initialValue: "default",
    },
    {
      name: "size",
      title: "Size",
      type: "string",
      description: "Default for most buttons; Large/Wide for prominent hero or call-to-action buttons.",
      options: {
        list: BUTTON_SIZES.map(({ title, value }) => ({ title, value })),
        layout: "radio",
      },
      initialValue: "default",
    },
  ],
  initialValue: {
    variant: "default",
    size: "default",
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