import { v4 as uuidv4 } from "uuid";

/**
 * Tiptap JSON <-> Sanity Portable Text converters for the shared editor.
 *
 * Pure functions — no editor instance, no DOM — so they're covered end to
 * end by round-trip unit tests (see __tests__/pt-convert.test.ts).
 *
 * Shapes match what components/portable-text-renderer.tsx already renders:
 *   - image: { _type:'image', asset:{ _type:'reference', _ref, url, metadata:{lqip,dimensions} }, alt, caption, placement }
 *   - youtube: { _type:'youtube', videoId, caption }
 *   - infoBox: { _type:'infoBox', variant, content: PortableTextBlock[] }
 *   - break: { _type:'break', style }
 *   - blockquote: a normal `block` with style:'blockquote'
 *
 * Unknown node types / PT `_type`s are silently dropped in both directions —
 * this keeps the editor forward-compatible with future block types (the
 * "Data & story" group lands in E8) without ever crashing on content authored
 * by a newer or older version of the app.
 */

// A tiptap "doc" or nested content list is an array of loosely-typed nodes;
// keeping this as `any` matches the rest of the codebase's tiptap-JSON typing
// (see the original portable-text-editor.tsx implementation).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyNode = any;

const BLOCK_STYLE_BY_HEADING_LEVEL: Record<number, string> = {
  2: "h2",
  3: "h3",
  4: "h4",
};

const HEADING_LEVEL_BY_STYLE: Record<string, number> = {
  h2: 2,
  h3: 3,
  h4: 4,
};

/** Convert a single tiptap inline "text" node (with marks) into a PT span, appending any link markDefs it needs onto `markDefs`. */
function textNodeToSpan(child: AnyNode, markDefs: AnyNode[]): AnyNode {
  const marks: string[] = [];
  child.marks?.forEach((mark: AnyNode) => {
    if (mark.type === "bold") marks.push("strong");
    else if (mark.type === "italic") marks.push("em");
    else if (mark.type === "link") {
      const markDef = { _key: uuidv4(), _type: "link", href: mark.attrs?.href };
      markDefs.push(markDef);
      marks.push(markDef._key);
    }
  });

  return {
    _type: "span",
    _key: uuidv4(),
    text: child.text || "",
    marks,
  };
}

/** Convert a tiptap "paragraph"/"heading"/"blockquote-paragraph" content list into PT span children. */
function inlineContentToChildren(content: AnyNode[] | undefined, markDefs: AnyNode[]): AnyNode[] {
  const children: AnyNode[] = [];
  content?.forEach((child: AnyNode) => {
    if (child.type === "text") children.push(textNodeToSpan(child, markDefs));
  });
  return children;
}

function makeBlock(style: string, children: AnyNode[], markDefs: AnyNode[], listItem?: string): AnyNode {
  return {
    _type: "block",
    _key: uuidv4(),
    style,
    children,
    markDefs,
    ...(listItem ? { listItem } : {}),
  };
}

/** Build the PT image object from a tiptap `image` node's attrs. */
function imageNodeToPortableText(attrs: AnyNode): AnyNode {
  const width = attrs?.width;
  const height = attrs?.height;
  const lqip = attrs?.lqip;
  const hasMetadata = width || height || lqip;

  return {
    _type: "image",
    _key: uuidv4(),
    asset: {
      _type: "reference",
      _ref: attrs?.assetRef || attrs?.src,
      ...(attrs?.src ? { url: attrs.src } : {}),
      ...(hasMetadata
        ? {
            metadata: {
              ...(lqip ? { lqip } : {}),
              ...(width || height ? { dimensions: { width, height } } : {}),
            },
          }
        : {}),
    },
    alt: attrs?.alt || "",
    caption: attrs?.caption || "",
    placement: attrs?.placement || "full",
  };
}

/** Build a tiptap `image` node's attrs from a PT image object. */
function portableImageToTiptapAttrs(block: AnyNode): AnyNode {
  const asset = block.asset || {};
  const src = asset.url || asset._ref || "";
  const dims = asset.metadata?.dimensions;

  return {
    src,
    alt: block.alt || "",
    caption: block.caption || "",
    placement: block.placement || "full",
    assetRef: asset._ref,
    ...(dims?.width ? { width: dims.width } : {}),
    ...(dims?.height ? { height: dims.height } : {}),
    ...(asset.metadata?.lqip ? { lqip: asset.metadata.lqip } : {}),
  };
}

/** Map an editor-side item list to a Sanity array: every member gets a stable `_key` (kept when present, generated otherwise). */
function keyedItems(items: AnyNode[] | undefined, pick: (item: AnyNode) => AnyNode): AnyNode[] {
  if (!Array.isArray(items)) return [];
  return items.map((item) => ({ _key: item?._key || uuidv4(), ...pick(item || {}) }));
}

/** renderedSvg/renderStatus passthrough for storyChart/storyMermaid — included only when present. */
function renderFields(attrs: AnyNode): AnyNode {
  return {
    ...(attrs?.renderedSvg ? { renderedSvg: attrs.renderedSvg } : {}),
    ...(attrs?.renderStatus ? { renderStatus: attrs.renderStatus } : {}),
  };
}

/**
 * Convert Tiptap JSON to Sanity Portable Text.
 */
export function tiptapToPortableText(doc: AnyNode): AnyNode[] {
  if (!doc || !doc.content) return [];

  const portableText: AnyNode[] = [];

  doc.content.forEach((node: AnyNode) => {
    if (node.type === "paragraph") {
      const markDefs: AnyNode[] = [];
      const children = inlineContentToChildren(node.content, markDefs);

      // Inline images nested inside a paragraph (tiptap allows `inline: true`
      // images to sit alongside text) are lifted out to their own PT image
      // block — Portable Text has no notion of an inline image inside a span.
      node.content?.forEach((child: AnyNode) => {
        if (child.type === "image") portableText.push(imageNodeToPortableText(child.attrs));
      });

      if (children.length > 0) portableText.push(makeBlock("normal", children, markDefs));
    } else if (node.type === "heading") {
      const level = node.attrs?.level;
      const style = BLOCK_STYLE_BY_HEADING_LEVEL[level] || "normal";
      const markDefs: AnyNode[] = [];
      const children = inlineContentToChildren(node.content, markDefs);
      portableText.push(makeBlock(style, children, markDefs));
    } else if (node.type === "blockquote") {
      // Each paragraph inside the blockquote becomes its own PT block with
      // style:'blockquote' (Portable Text has no wrapping "quote" container —
      // the renderer's `blockquote` style component re-groups adjacent blocks).
      node.content?.forEach((para: AnyNode) => {
        const markDefs: AnyNode[] = [];
        const children = inlineContentToChildren(para.content, markDefs);
        if (children.length > 0) portableText.push(makeBlock("blockquote", children, markDefs));
      });
    } else if (node.type === "bulletList" || node.type === "orderedList") {
      const listItem = node.type === "bulletList" ? "bullet" : "number";
      node.content?.forEach((listItemNode: AnyNode) => {
        listItemNode.content?.forEach((para: AnyNode) => {
          const markDefs: AnyNode[] = [];
          const children = inlineContentToChildren(para.content, markDefs);
          portableText.push(makeBlock("normal", children, markDefs, listItem));
        });
      });
    } else if (node.type === "image") {
      portableText.push(imageNodeToPortableText(node.attrs));
    } else if (node.type === "youtube") {
      portableText.push({
        _type: "youtube",
        _key: uuidv4(),
        videoId: node.attrs?.videoId || "",
        caption: node.attrs?.caption || "",
      });
    } else if (node.type === "infoBox") {
      portableText.push({
        _type: "infoBox",
        _key: uuidv4(),
        variant: node.attrs?.variant || "info",
        content: tiptapToPortableText({ type: "doc", content: node.content || [] }),
      });
    } else if (node.type === "break") {
      portableText.push({
        _type: "break",
        _key: uuidv4(),
        style: node.attrs?.style || "hr",
      });
    } else if (node.type === "storyTimeline") {
      portableText.push({
        _type: "storyTimeline",
        _key: uuidv4(),
        items: keyedItems(node.attrs?.items, (item) => ({
          date: item.date || "",
          title: item.title || "",
          text: item.text || "",
        })),
      });
    } else if (node.type === "storyChart") {
      portableText.push({
        _type: "storyChart",
        _key: uuidv4(),
        chartType: node.attrs?.chartType || "bar",
        title: node.attrs?.title || "",
        data: keyedItems(node.attrs?.data, (row) => ({
          label: row.label || "",
          // NaN (a numeric input mid-edit) must never reach Sanity — coerce to 0.
          value: Number.isFinite(row.value) ? row.value : Number(row.value) || 0,
        })),
        // Render fields travel only when a render happened — their absence is
        // what marks a never-rendered block as withheld-from-publish.
        ...renderFields(node.attrs),
      });
    } else if (node.type === "storyMermaid") {
      portableText.push({
        _type: "storyMermaid",
        _key: uuidv4(),
        code: node.attrs?.code || "",
        ...renderFields(node.attrs),
      });
    }
    // Unknown node types are intentionally dropped — see module docstring.
  });

  return portableText;
}

/**
 * Convert Sanity Portable Text to Tiptap JSON.
 */
export function portableTextToTiptap(portableText: AnyNode): AnyNode {
  if (!portableText || !Array.isArray(portableText) || portableText.length === 0) {
    return { type: "doc", content: [] };
  }

  const content: AnyNode[] = [];
  // Consecutive PT blocks with style:'blockquote' are re-grouped into a
  // single tiptap `blockquote` node wrapping one paragraph per PT block —
  // the inverse of the grouping done above.
  let quoteBuffer: AnyNode[] | null = null;

  const flushQuote = () => {
    if (quoteBuffer && quoteBuffer.length > 0) {
      content.push({ type: "blockquote", content: quoteBuffer });
    }
    quoteBuffer = null;
  };

  const spanChildrenToTiptapText = (block: AnyNode): AnyNode[] => {
    const children: AnyNode[] = [];
    block.children?.forEach((child: AnyNode) => {
      if (child._type !== "span") return;
      const marks: AnyNode[] = [];
      child.marks?.forEach((mark: string) => {
        if (mark === "strong") marks.push({ type: "bold" });
        else if (mark === "em") marks.push({ type: "italic" });
        else {
          const linkMark = block.markDefs?.find((def: AnyNode) => def._key === mark);
          if (linkMark && linkMark._type === "link") {
            marks.push({ type: "link", attrs: { href: linkMark.href } });
          }
        }
      });
      children.push({ type: "text", text: child.text, marks: marks.length > 0 ? marks : undefined });
    });
    return children;
  };

  portableText.forEach((block: AnyNode) => {
    if (block._type === "block" && block.style === "blockquote") {
      const children = spanChildrenToTiptapText(block);
      quoteBuffer = quoteBuffer || [];
      quoteBuffer.push({ type: "paragraph", content: children.length > 0 ? children : undefined });
      return;
    }
    flushQuote();

    if (block._type === "block") {
      const isList = block.listItem === "bullet" || block.listItem === "number";
      const children = spanChildrenToTiptapText(block);

      if (isList) {
        const listType = block.listItem === "bullet" ? "bulletList" : "orderedList";
        const paragraph = { type: "paragraph", content: children.length > 0 ? children : undefined };
        const listItemNode = { type: "listItem", content: [paragraph] };

        const last = content[content.length - 1];
        if (last && last.type === listType) {
          last.content.push(listItemNode);
        } else {
          content.push({ type: listType, content: [listItemNode] });
        }
        return;
      }

      let nodeType = "paragraph";
      const attrs: AnyNode = {};
      const level = HEADING_LEVEL_BY_STYLE[block.style];
      if (level) {
        nodeType = "heading";
        attrs.level = level;
      }

      content.push({
        type: nodeType,
        attrs,
        content: children.length > 0 ? children : undefined,
      });
    } else if (block._type === "image") {
      content.push({ type: "image", attrs: portableImageToTiptapAttrs(block) });
    } else if (block._type === "youtube") {
      content.push({
        type: "youtube",
        attrs: { videoId: block.videoId || "", caption: block.caption || "" },
      });
    } else if (block._type === "infoBox") {
      content.push({
        type: "infoBox",
        attrs: { variant: block.variant || "info" },
        content: portableTextToTiptap(block.content || []).content,
      });
    } else if (block._type === "break") {
      content.push({ type: "break", attrs: { style: block.style || "hr" } });
    } else if (block._type === "storyTimeline") {
      content.push({
        type: "storyTimeline",
        attrs: {
          items: Array.isArray(block.items)
            ? block.items.map((item: AnyNode) => ({
                _key: item?._key,
                date: item?.date || "",
                title: item?.title || "",
                text: item?.text || "",
              }))
            : [],
        },
      });
    } else if (block._type === "storyChart") {
      content.push({
        type: "storyChart",
        attrs: {
          chartType: block.chartType || "bar",
          title: block.title || "",
          data: Array.isArray(block.data)
            ? block.data.map((row: AnyNode) => ({
                _key: row?._key,
                label: row?.label || "",
                value: Number.isFinite(row?.value) ? row.value : Number(row?.value) || 0,
              }))
            : [],
          renderedSvg: block.renderedSvg || null,
          renderStatus: block.renderStatus || null,
        },
      });
    } else if (block._type === "storyMermaid") {
      content.push({
        type: "storyMermaid",
        attrs: {
          code: block.code || "",
          renderedSvg: block.renderedSvg || null,
          renderStatus: block.renderStatus || null,
        },
      });
    }
    // Unknown PT _type values are intentionally dropped — see module docstring.
  });

  flushQuote();

  return { type: "doc", content };
}
