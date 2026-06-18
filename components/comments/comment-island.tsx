"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@clerk/nextjs";
import type { CommentTargetType } from "@/generated/prisma";

// The thread is below the fold and not needed for first paint — load it only
// when it scrolls into view, keeping the comment JS out of the initial bundle
// on content pages (protects mobile LCP). Sign-in state is resolved client-side
// so the host page can stay a static/ISR RSC.
const CommentSection = dynamic(
  () => import("./comment-section").then((m) => m.CommentSection),
  { ssr: false }
);

export function CommentIsland(props: {
  targetType: CommentTargetType;
  targetId: string;
}) {
  const { isSignedIn } = useAuth();
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (shown || !ref.current) return;
    const el = ref.current;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown]);

  return (
    <div ref={ref}>
      {shown ? <CommentSection {...props} isSignedIn={!!isSignedIn} /> : <div className="min-h-24" />}
    </div>
  );
}
