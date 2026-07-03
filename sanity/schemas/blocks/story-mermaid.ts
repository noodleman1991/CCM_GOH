import { defineType } from "sanity";
import { Workflow } from "lucide-react";

/**
 * "Data & story" diagram block (Task E8) — mermaid source authored in the
 * app's slash-menu editor. The diagram is rendered to SVG in the author's
 * browser (mermaid needs real SVG geometry APIs; see
 * lib/story-blocks/render.ts), then sanitized server-side by
 * POST /api/story-blocks/render before storage. The public renderer only
 * shows blocks with renderStatus == "ok" (withheld-from-publish on failure).
 */
export default defineType({
    name: "storyMermaid",
    title: "Diagram (mermaid)",
    type: "object",
    icon: Workflow,
    fields: [
        {
            name: "code",
            title: "Mermaid source",
            type: "text",
            rows: 8,
            description: "Mermaid diagram source, e.g. `graph TD; A-->B`.",
        },
        {
            name: "renderedSvg",
            title: "Rendered SVG (server-sanitized)",
            type: "text",
            readOnly: true,
            description: "Sanitized SVG produced via the render API at save time. Do not edit.",
        },
        {
            name: "renderStatus",
            title: "Render status",
            type: "string",
            options: { list: ["ok", "failed"] },
            readOnly: true,
            description: 'Blocks whose status is not "ok" are withheld from the public page.',
        },
    ],
    preview: {
        select: { code: "code", renderStatus: "renderStatus" },
        prepare({ code, renderStatus }: { code?: string; renderStatus?: string }) {
            return {
                title: "Diagram",
                subtitle: `${renderStatus ?? "not rendered"} — ${(code ?? "").slice(0, 40)}`,
            };
        },
    },
});
