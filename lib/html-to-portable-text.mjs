import { load } from 'cheerio';
import crypto from 'crypto';

/**
 * Generate unique key for block elements
 */
function generateKey() {
  return crypto.randomBytes(6).toString('hex');
}

/**
 * Clean text content (remove extra whitespace, normalize)
 */
function cleanText(text) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim();
}

/**
 * Parse inline elements (spans with marks)
 * Handles: bold, italic, underline, links, code
 */
function parseInlineElements($elem, cheerio) {
  const children = [];
  const $ = cheerio;

  $elem.contents().each((i, node) => {
    if (node.type === 'text') {
      const text = node.data;
      if (text.trim()) {
        children.push({
          _type: 'span',
          _key: generateKey(),
          text: text,
          marks: []
        });
      }
    } else if (node.type === 'tag') {
      const $node = $(node);
      const tagName = node.name.toLowerCase();
      const text = $node.text();
      const marks = [];

      // Determine marks based on tag
      switch (tagName) {
        case 'strong':
        case 'b':
          marks.push('strong');
          break;
        case 'em':
        case 'i':
          marks.push('em');
          break;
        case 'u':
          marks.push('underline');
          break;
        case 'code':
          marks.push('code');
          break;
        case 'a':
          const href = $node.attr('href');
          if (href) {
            const linkKey = generateKey();
            marks.push(linkKey);
            // Store link definition for markDefs
            children.linkDef = {
              _key: linkKey,
              _type: 'link',
              href: href,
            };
          }
          break;
      }

      if (text.trim()) {
        children.push({
          _type: 'span',
          _key: generateKey(),
          text: cleanText(text),
          marks: marks
        });
      }
    }
  });

  return children;
}

/**
 * Parse a single HTML block element to Portable Text block
 */
function parseBlock($elem, cheerio) {
  const $ = cheerio;
  const tagName = $elem.prop('tagName')?.toLowerCase();

  if (!tagName) return null;

  const block = {
    _type: 'block',
    _key: generateKey(),
    style: 'normal',
    children: [],
    markDefs: []
  };

  // Determine block style
  const styleMap = {
    'h1': 'h1',
    'h2': 'h2',
    'h3': 'h3',
    'h4': 'h4',
    'h5': 'h5',
    'h6': 'h6',
    'p': 'normal',
    'blockquote': 'blockquote',
  };

  block.style = styleMap[tagName] || 'normal';

  // Parse inline content
  const children = parseInlineElements($elem, cheerio);

  // Extract link definitions from children
  const linkDefs = [];
  const cleanChildren = children.filter(child => {
    if (child.linkDef) {
      linkDefs.push(child.linkDef);
      delete child.linkDef;
    }
    return child._type === 'span';
  });

  block.children = cleanChildren.length > 0 ? cleanChildren : [{
    _type: 'span',
    _key: generateKey(),
    text: cleanText($elem.text()),
    marks: []
  }];

  block.markDefs = linkDefs;

  // Handle list items
  if (tagName === 'li') {
    block.listItem = 'bullet';
    block.level = 1;
  }

  return block;
}

/**
 * Parse HTML list to Portable Text list blocks
 */
function parseList($list, cheerio, listType = 'bullet') {
  const $ = cheerio;
  const blocks = [];

  $list.find('> li').each((i, li) => {
    const $li = $(li);
    const block = parseBlock($li, cheerio);

    if (block) {
      block.listItem = listType;
      block.level = 1;
      blocks.push(block);

      // Handle nested lists
      $li.find('> ul, > ol').each((j, nestedList) => {
        const nestedType = nestedList.name === 'ol' ? 'number' : 'bullet';
        const nestedBlocks = parseList($(nestedList), cheerio, nestedType);
        nestedBlocks.forEach(nb => {
          nb.level = 2;
          blocks.push(nb);
        });
      });
    }
  });

  return blocks;
}

/**
 * Convert HTML string to Portable Text blocks
 * @param {string} html - HTML string to convert
 * @param {Object} options - Conversion options
 * @returns {Array} Array of Portable Text blocks
 */
export function htmlToPortableText(html, options = {}) {
  if (!html || typeof html !== 'string') {
    return [];
  }

  const {
    preserveWhitespace = false,
    includeImages = false,
  } = options;

  const $ = load(html);
  const blocks = [];

  // Process top-level elements
  $('body').children().each((i, elem) => {
    const $elem = $(elem);
    const tagName = elem.name?.toLowerCase();

    if (!tagName) return;

    // Handle different element types
    switch (tagName) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
      case 'p':
      case 'blockquote':
        const block = parseBlock($elem, $);
        if (block && block.children.length > 0) {
          blocks.push(block);
        }
        break;

      case 'ul':
        const bulletBlocks = parseList($elem, $, 'bullet');
        blocks.push(...bulletBlocks);
        break;

      case 'ol':
        const numberBlocks = parseList($elem, $, 'number');
        blocks.push(...numberBlocks);
        break;

      case 'div':
      case 'section':
        // Recursively process div/section contents
        const text = $elem.text().trim();
        if (text) {
          blocks.push({
            _type: 'block',
            _key: generateKey(),
            style: 'normal',
            children: [{
              _type: 'span',
              _key: generateKey(),
              text: cleanText(text),
              marks: []
            }],
            markDefs: []
          });
        }
        break;

      case 'img':
        if (includeImages) {
          // TODO: Handle images - would need asset reference
          // For now, skip or add placeholder
        }
        break;

      case 'br':
        // Handled within text nodes
        break;

      default:
        // For unknown elements, extract text content
        const unknownText = $elem.text().trim();
        if (unknownText) {
          blocks.push({
            _type: 'block',
            _key: generateKey(),
            style: 'normal',
            children: [{
              _type: 'span',
              _key: generateKey(),
              text: cleanText(unknownText),
              marks: []
            }],
            markDefs: []
          });
        }
    }
  });

  return blocks;
}

/**
 * Create simple block content from plain text
 * @param {string} text - Plain text
 * @returns {Array} Portable Text blocks
 */
export function createBlockContent(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const paragraphs = text.split(/\n\n+/);

  return paragraphs
    .filter(p => p.trim())
    .map(paragraph => ({
      _type: 'block',
      _key: generateKey(),
      style: 'normal',
      children: [
        {
          _type: 'span',
          _key: generateKey(),
          text: paragraph.trim(),
          marks: []
        }
      ],
      markDefs: []
    }));
}

/**
 * Create a simple paragraph block
 * @param {string} text - Paragraph text
 * @param {string} style - Block style (normal, h1, h2, etc.)
 * @returns {Object} Portable Text block
 */
export function createParagraph(text, style = 'normal') {
  return {
    _type: 'block',
    _key: generateKey(),
    style: style,
    children: [
      {
        _type: 'span',
        _key: generateKey(),
        text: text,
        marks: []
      }
    ],
    markDefs: []
  };
}

/**
 * Extract plain text from Portable Text blocks
 * @param {Array} blocks - Portable Text blocks
 * @returns {string} Plain text
 */
export function portableTextToPlainText(blocks) {
  if (!Array.isArray(blocks)) {
    return '';
  }

  return blocks
    .filter(block => block._type === 'block')
    .map(block => {
      if (!Array.isArray(block.children)) return '';
      return block.children
        .filter(child => child._type === 'span')
        .map(child => child.text)
        .join('');
    })
    .join('\n\n');
}

/**
 * Merge multiple Portable Text block arrays
 * @param {...Array} blockArrays - Block arrays to merge
 * @returns {Array} Merged blocks
 */
export function mergeBlocks(...blockArrays) {
  return blockArrays
    .filter(Array.isArray)
    .flat()
    .filter(block => block && block._type);
}

export default {
  htmlToPortableText,
  createBlockContent,
  createParagraph,
  portableTextToPlainText,
  mergeBlocks,
};
