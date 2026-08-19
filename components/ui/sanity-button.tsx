import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface SanityButtonVariant {
  variant?: "default" | "invert" | "light-invert" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "wide" | "thick" | "sm" | "lg";
  stroke?: "none" | "light" | "midnight";
}

/**
 * Map any stored (incl. legacy) button value onto the curated, site-wide set so
 * every CMS button renders consistently. This is the single normalisation point
 * for block buttons — legacy values keep working but resolve to a current style.
 */
export const VARIANT_ALIAS: Record<string, "default" | "secondary" | "outline" | "ghost" | "link"> = {
  default: "default",
  secondary: "secondary",
  outline: "outline",
  ghost: "ghost",
  link: "link",
  // legacy → nearest curated style
  invert: "secondary",
  "light-invert": "secondary",
  destructive: "default",
};
export const SIZE_ALIAS: Record<string, "default" | "lg" | "wide"> = {
  default: "default",
  lg: "lg",
  wide: "wide",
  // legacy → nearest curated size
  sm: "default",
  thick: "lg",
};

export interface SanityLinkData {
  title?: string;
  href?: string;
  target?: boolean;
  buttonVariant?: SanityButtonVariant;
}

interface SanityButtonProps {
  link: SanityLinkData;
  locale?: string;
  isRTL?: boolean;
  className?: string;
}

/**
 * Button component that renders Sanity CMS button data with proper variants
 */
export function SanityButton({ link, locale = 'en', isRTL = false, className }: SanityButtonProps) {
  if (!link?.href || !link?.title) {
    return null;
  }

  const buttonStyle = link.buttonVariant || {};
  const rawVariant = typeof buttonStyle === 'string' ? buttonStyle : (buttonStyle.variant || "default");
  const rawSize = typeof buttonStyle === 'string' ? "default" : (buttonStyle.size || "default");

  // Normalise to the curated, site-wide set so every CMS button is consistent.
  const buttonVariant = VARIANT_ALIAS[rawVariant] ?? "default";
  const size = SIZE_ALIAS[rawSize] ?? "default";

  const isExternal = link.href.startsWith('http') || link.href.startsWith('https');
  const target = link.target || isExternal;

  if (buttonVariant === 'link') {
    // Render as text link for 'link' variant
    if (isExternal) {
      return (
        <a
          href={link.href}
          target={target ? "_blank" : undefined}
          rel={target ? "noopener noreferrer" : undefined}
          className={cn(
            "text-primary underline-offset-4 hover:underline transition-colors",
            isRTL && "font-arabic-body",
            className
          )}
        >
          {link.title}
        </a>
      );
    }

    return (
      <Link
        href={link.href}
        className={cn(
          "text-primary underline-offset-4 hover:underline transition-colors",
          isRTL && "font-arabic-body",
          className
        )}
      >
        {link.title}
      </Link>
    );
  }

  // Render as button
  const buttonClassName = cn(
    isRTL && "font-arabic-heading",
    className
  );

  if (isExternal) {
    return (
      <Button asChild variant={buttonVariant} size={size} className={buttonClassName}>
        <a
          href={link.href}
          target={target ? "_blank" : undefined}
          rel={target ? "noopener noreferrer" : undefined}
        >
          {link.title}
        </a>
      </Button>
    );
  }

  return (
    <Button asChild variant={buttonVariant} size={size} className={buttonClassName}>
      <Link href={link.href}>
        {link.title}
      </Link>
    </Button>
  );
}

/**
 * Utility to get button variant values from Sanity data
 */
export function getButtonVariant(buttonVariant?: SanityButtonVariant | string): SanityButtonVariant {
  if (typeof buttonVariant === 'string') {
    // Legacy support for string variants
    return { variant: buttonVariant as SanityButtonVariant["variant"], size: "default", stroke: "none" };
  }

  return {
    variant: buttonVariant?.variant || "default",
    size: buttonVariant?.size || "default",
    stroke: buttonVariant?.stroke || "none",
  };
}