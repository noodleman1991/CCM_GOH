import { cn } from "@/lib/utils";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createElement } from "react";
import { stegaClean } from "next-sanity";
import { PAGE_QUERYResult } from "@/sanity.types";

type Block = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type SplitRow = Extract<Block, { _type: "split-row" }>;
type SplitContent = Extract<
  NonNullable<SplitRow["splitColumns"]>[number],
  { _type: "split-content" }
>;

interface SplitContentProps extends SplitContent {
  noGap?: boolean;
  locale?: string;
}

export default function SplitContent({
  sticky,
  padding,
  noGap,
  tagLine,
  title,
  body,
  link,
  locale = "en",
}: SplitContentProps) {
  return (
    <div
      className={cn(
        !sticky ? "flex flex-col justify-center" : undefined,
        padding?.top ? "pt-8 lg:pt-12 xl:pt-16" : undefined,
        padding?.bottom ? "pb-8 lg:pb-12 xl:pb-16" : undefined
      )}
    >
      <div
        className={cn(
          "flex flex-col items-start overflow-hidden",
          sticky ? "lg:sticky lg:top-56" : undefined,
          noGap ? "px-10" : undefined
        )}
      >
        {tagLine && <p className="text-base font-semibold break-words">{tagLine}</p>}
        {title &&
          createElement(
            "h2",
            {
              className: cn("my-4 font-semibold leading-[1.2] break-words"),
            },
            title
          )}
        {body && (
          <div className="break-words w-full">
            <PortableTextRenderer value={body} locale={locale} />
          </div>
        )}
        {link?.href && (
          <div className="flex flex-col">
            <Button
              className="mt-6"
              variant={stegaClean((link?.buttonVariant as any)?.variant)}
              size={stegaClean((link?.buttonVariant as any)?.size) || "lg"}
              stroke={stegaClean((link?.buttonVariant as any)?.stroke)}
              asChild
            >
              <Link
                href={link.href}
                target={link.target ? "_blank" : undefined}
              >
                {link.title}
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
