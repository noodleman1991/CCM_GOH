import { CachedFooter } from "@/components/footer";
import { CachedHeader } from "@/components/header";
import Custom404 from "@/components/404";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found",
};

export default async function NotFoundPage() {
  return (
    <>
      <CachedHeader perspective="published" stega={false} />
      <Custom404 />
      <CachedFooter perspective="published" stega={false} />
    </>
  );
}
