import Custom404 from "@/components/404";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("errors");
  return { title: t("pageNotFoundTitle") };
}

export default function NotFoundPage() {
  return <Custom404 />;
}
