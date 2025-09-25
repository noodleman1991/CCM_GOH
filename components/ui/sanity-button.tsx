import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface SanityButtonVariant {
  variant?: "default" | "invert" | "light-invert" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "wide" | "thick" | "sm" | "lg";
  stroke?: "none" | "light" | "midnight";
}

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
  const {
    variant = "default",
    size = "default",
    stroke = "none"
  } = buttonStyle;

  const isExternal = link.href.startsWith('http') || link.href.startsWith('https');
  const target = link.target || isExternal;

  // Handle legacy string variant (backward compatibility)
  const buttonVariant = typeof buttonStyle === 'string' ? buttonStyle : variant;

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
  const ButtonComponent = ({ children, ...props }: any) => (
    <Button
      variant={buttonVariant as any}
      size={size as any}
      stroke={stroke as any}
      className={cn(
        isRTL && "font-arabic-heading",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );

  if (isExternal) {
    return (
      <ButtonComponent asChild>
        <a
          href={link.href}
          target={target ? "_blank" : undefined}
          rel={target ? "noopener noreferrer" : undefined}
        >
          {link.title}
        </a>
      </ButtonComponent>
    );
  }

  return (
    <ButtonComponent asChild>
      <Link href={link.href}>
        {link.title}
      </Link>
    </ButtonComponent>
  );
}

/**
 * Utility to get button variant values from Sanity data
 */
export function getButtonVariant(buttonVariant?: SanityButtonVariant | string): SanityButtonVariant {
  if (typeof buttonVariant === 'string') {
    // Legacy support for string variants
    return { variant: buttonVariant as any, size: "default", stroke: "none" };
  }

  return {
    variant: buttonVariant?.variant || "default",
    size: buttonVariant?.size || "default",
    stroke: buttonVariant?.stroke || "none",
  };
}