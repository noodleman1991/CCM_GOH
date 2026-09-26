"use client";
import { Button } from "@/components/ui/button";

import { useDraftModeEnvironment } from "next-sanity/hooks";

export function DisableDraftMode() {
  const environment = useDraftModeEnvironment();

  // Only show the disable draft mode button when outside of Presentation Tool
  if (environment !== "live" && environment !== "unknown") {
    return null;
  }

  return (
    <Button asChild>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- API route (full request that clears draft mode), not a page navigation */}
      <a href="/api/draft-mode/disable" className="fixed bottom-4 end-4">
        Disable Draft Mode
      </a>
    </Button>
  );
}
