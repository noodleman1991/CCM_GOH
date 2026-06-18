import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PRIVACY, TERMS, type LegalDoc } from "@/lib/legal/content";

export const dynamic = "force-static";

function resolve(doc: string, locale: string): LegalDoc | null {
  const l = (["en", "es", "fr", "ar"].includes(locale) ? locale : "en") as "en" | "es" | "fr" | "ar";
  if (doc === "privacy") return PRIVACY[l];
  if (doc === "terms") return TERMS[l];
  return null;
}

export function generateStaticParams() {
  const locales = ["en", "es", "fr", "ar"];
  return locales.flatMap((locale) => ["privacy", "terms"].map((doc) => ({ locale, doc })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; doc: string }>;
}): Promise<Metadata> {
  const { locale, doc } = await params;
  const d = resolve(doc, locale);
  return d ? { title: d.title } : {};
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ locale: string; doc: string }>;
}) {
  const { locale, doc } = await params;
  const d = resolve(doc, locale);
  if (!d) notFound();
  const isRTL = locale === "ar";

  return (
    <div className="container max-w-prose py-10" dir={isRTL ? "rtl" : "ltr"}>
      <h1 className="text-3xl font-heading font-bold text-ccm-midnight">{d.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{d.updated}</p>
      <p className="mt-6 text-foreground/90 leading-relaxed">{d.intro}</p>

      <div className="mt-8 space-y-8">
        {d.sections.map((s, i) => (
          <section key={i}>
            <h2 className="text-xl font-heading font-semibold text-ccm-sea">{s.heading}</h2>
            <div className="mt-2 space-y-3">
              {s.body.map((p, j) => (
                <p key={j} className="text-foreground/85 leading-relaxed">
                  {p}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
