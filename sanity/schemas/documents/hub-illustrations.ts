import { defineType, defineField } from "sanity";
import { Palette } from "lucide-react";

/**
 * Singleton that lets editors carry the hub's illustrated character (as seen
 * on hub.connectingclimateminds.org) into the app's header regions. Every
 * field is an optional decorative image + alt text — when a slot is empty,
 * the corresponding `<HeaderIllustration>` renders null and the page looks
 * exactly as it does today (no illustration configured).
 */
function illustrationField(name: string, title: string, description: string) {
  return defineField({
    name,
    title,
    type: "image",
    description,
    options: { hotspot: true },
    fields: [
      defineField({
        name: "alt",
        title: "Alternative text",
        type: "string",
        description:
          "Rendered decoratively (aria-hidden) in the app, so this is only used as an editorial description in Studio.",
      }),
    ],
  });
}

export default defineType({
  name: "hubIllustrations",
  title: "Hub Illustrations",
  type: "document",
  icon: Palette,
  fields: [
    illustrationField(
      "atlasHeader",
      "Atlas header illustration",
      "Decorative illustration shown at the end (RTL-safe) of the Atlas page header."
    ),
    illustrationField(
      "searchHeader",
      "Search header illustration",
      "Decorative illustration shown at the end (RTL-safe) of the Search page header."
    ),
    illustrationField(
      "collaborateHeader",
      "Collaborate header illustration",
      "Decorative illustration shown at the end (RTL-safe) of the Collaborate page header."
    ),
    illustrationField(
      "emptyState",
      "Empty state illustration",
      "Decorative illustration shown alongside empty-state messaging."
    ),
  ],
  preview: {
    prepare() {
      return { title: "Hub Illustrations" };
    },
  },
});
