import { defineField } from "sanity";

export const enhancedButtonVariant = defineField({
    name: "buttonVariant",
    title: "Button Style",
    type: "object",
    fields: [
        {
            name: "variant",
            title: "Button Type",
            type: "string",
            options: {
                list: [
                    { title: "Default (CCM Sea)", value: "default" },
                    { title: "Inverted (White)", value: "invert" },
                    { title: "Light Inverted (CCM Sea)", value: "light-invert" },
                    { title: "Outline", value: "outline" },
                    { title: "Ghost", value: "ghost" },
                ]
            },
            initialValue: "default",
        },
        {
            name: "size",
            title: "Button Size",
            type: "string",
            options: {
                list: [
                    { title: "Default", value: "default" },
                    { title: "Wide", value: "wide" },
                    { title: "Thick (Bulky)", value: "thick" },
                    { title: "Small", value: "sm" },
                    { title: "Large", value: "lg" },
                ]
            },
            initialValue: "default",
        },
        {
            name: "stroke",
            title: "Border Stroke",
            type: "string",
            options: {
                list: [
                    { title: "No Border", value: "none" },
                    { title: "Light Gray Border", value: "light" },
                    { title: "CCM Midnight Border", value: "midnight" },
                ]
            },
            initialValue: "none",
            hidden: ({ parent }: { parent?: any }) => {
                // Only show stroke options for invert variants
                return !parent?.variant || (!parent.variant.includes('invert') && parent.variant !== 'outline');
            },
        }
    ],
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
                ghost: "Ghost",
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

export const enhancedButtonVariantField = {
    name: "buttonStyle",
    title: "Button Style",
    type: "object",
    fields: [
        {
            name: "variant",
            title: "Button Type",
            type: "string",
            options: {
                list: [
                    { title: "Default (CCM Sea)", value: "default" },
                    { title: "Inverted (White)", value: "invert" },
                    { title: "Light Inverted (CCM Sea)", value: "light-invert" },
                    { title: "Outline", value: "outline" },
                    { title: "Ghost", value: "ghost" },
                ]
            },
            initialValue: "default",
        },
        {
            name: "size",
            title: "Button Size",
            type: "string",
            options: {
                list: [
                    { title: "Default", value: "default" },
                    { title: "Wide", value: "wide" },
                    { title: "Thick (Bulky)", value: "thick" },
                    { title: "Small", value: "sm" },
                    { title: "Large", value: "lg" },
                ]
            },
            initialValue: "default",
        },
        {
            name: "stroke",
            title: "Border Stroke",
            type: "string",
            options: {
                list: [
                    { title: "No Border", value: "none" },
                    { title: "Light Gray Border", value: "light" },
                    { title: "CCM Midnight Border", value: "midnight" },
                ]
            },
            initialValue: "none",
            hidden: ({ parent }: { parent?: any }) => {
                // Only show stroke options for invert variants
                return !parent?.variant || (!parent.variant.includes('invert') && parent.variant !== 'outline');
            },
        }
    ],
    initialValue: {
        variant: "default",
        size: "default",
        stroke: "none",
    }
};