import { defineField, defineType } from "sanity";
import { Globe2 } from "lucide-react";

/** Region-scoped atlas embed (spec A4): the atlas engine locked to the page's
 *  region. The region itself comes from the page at render time, not a field. */
export default defineType({
  name: "atlas-embed",
  title: "Atlas embed (this region)",
  type: "object",
  icon: Globe2,
  fields: [
    defineField({
      name: "showBreakdown",
      title: "Show the country breakdown list",
      type: "boolean",
      initialValue: true,
    }),
  ],
  preview: {
    prepare: () => ({ title: "Atlas embed — this region" }),
  },
});
