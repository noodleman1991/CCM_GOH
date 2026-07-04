"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Share via the native sheet where available, clipboard fallback (X6). */
export function ShareButton({ title, label, copiedLabel }: { title: string; label: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title, url }).catch(() => {});
      return;
    }
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button type="button" variant="outline" onClick={share} className="min-h-[44px] gap-1.5 rounded-full">
      {copied ? <Check className="size-4" aria-hidden /> : <Share2 className="size-4" aria-hidden />}
      {copied ? copiedLabel : label}
    </Button>
  );
}
