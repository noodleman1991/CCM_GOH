import SectionContainer, { type SectionPadding } from "@/components/ui/section-container";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { getLocalizedField, getLocalizedPortableText } from "@/lib/localization-utils";
import type { PortableTextBlock } from "@portabletext/types";

/** A field that carries either a plain string or a `{en, es, fr, ar}` map —
 *  the shape `getLocalizedField` resolves. Matches the precedent already
 *  used for this exact pattern in lib/content/discovery.ts's LocalizedText. */
type LocalizedText = string | Record<string, string> | null;

interface FAQItem {
  _id: string;
  title?: LocalizedText;
  body?: PortableTextBlock[] | Record<string, unknown> | null;
}

interface FAQProps {
  padding?: SectionPadding | null;
  faqs?: FAQItem[] | null;
  locale?: string;
}

export default function FAQs({ padding, faqs, locale = "en" }: FAQProps) {

  const supportedLocale = (locale || "en") as 'en' | 'es' | 'fr' | 'ar';

  return (
    <SectionContainer padding={padding}>
      <div className="max-w-6xl mx-auto px-4 @content-sm/page:px-6 @content-lg/page:px-8">
        {faqs && faqs?.length > 0 && (
          <Accordion className="space-y-4" type="multiple">
          {faqs.map((faq) => {
            const localizedTitle = typeof faq.title === 'string'
              ? faq.title
              : getLocalizedField(faq.title, supportedLocale, '');

            const localizedBody = Array.isArray(faq.body)
              ? faq.body
              : getLocalizedPortableText(faq.body, supportedLocale);

            return (
              <AccordionItem key={faq._id} value={`item-${faq._id}`}>
                <AccordionTrigger>{localizedTitle}</AccordionTrigger>
                <AccordionContent>
                  <PortableTextRenderer value={localizedBody || []} locale={locale} />
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
        )}
      </div>
    </SectionContainer>
  );
}
