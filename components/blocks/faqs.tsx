import SectionContainer from "@/components/ui/section-container";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { PAGE_QUERY_RESULT } from "@/sanity.types";
import { getLocalizedField, getLocalizedPortableText } from "@/lib/localization-utils";

type FAQProps = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "faqs" }
> & {
  locale?: string;
};

export default function FAQs({ padding, faqs, locale = "en" }: FAQProps) {

  const supportedLocale = (locale || "en") as 'en' | 'es' | 'fr' | 'ar';

  return (
    <SectionContainer padding={padding}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
