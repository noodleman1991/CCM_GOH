"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 text-center px-4">
      <h2 className="text-2xl font-bold text-foreground">
        Something went wrong
      </h2>
      <p className="text-muted-foreground max-w-md">
        An unexpected error occurred. Please try again or return to the
        homepage.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset} variant="default">
          Try again
        </Button>
        <Button variant="outline" asChild>
          <a href="/">Go home</a>
        </Button>
      </div>
    </div>
  );
}
