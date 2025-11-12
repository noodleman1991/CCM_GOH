import { createClient } from '@sanity/client';
import fetch from 'node-fetch';
import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env.local') });

/**
 * Create Sanity client for asset uploads
 */
export function createSanityClient() {
  return createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    token: process.env.SANITY_API_EDITOR_TOKEN,
    apiVersion: '2024-10-31',
    useCdn: false,
  });
}

/**
 * Generate MD5 hash from buffer for deduplication
 */
export function generateHash(buffer) {
  return crypto.createHash('md5').update(buffer).digest('hex');
}

/**
 * Download image from URL with retry logic
 * @param {string} url - Image URL to download
 * @param {number} retries - Number of retry attempts
 * @returns {Promise<{buffer: Buffer, contentType: string}>}
 */
export async function downloadImage(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SanityContentBot/1.0)',
        },
        timeout: 30000, // 30 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const buffer = await response.buffer();
      const contentType = response.headers.get('content-type') || 'image/jpeg';

      return { buffer, contentType };
    } catch (error) {
      if (attempt === retries) {
        throw new Error(`Failed after ${retries} attempts: ${error.message}`);
      }
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

/**
 * Upload image buffer to Sanity
 * @param {Object} client - Sanity client instance
 * @param {Buffer} buffer - Image buffer
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Asset information
 */
export async function uploadToSanity(client, buffer, options = {}) {
  const {
    filename,
    alt = '',
  } = options;

  try {
    const asset = await client.assets.upload('image', buffer, {
      filename,
    });

    return {
      _id: asset._id,
      _type: 'image',
      assetId: asset._id,
      url: asset.url,
      metadata: {
        dimensions: asset.metadata?.dimensions,
        lqip: asset.metadata?.lqip,
      },
      alt,
    };
  } catch (error) {
    throw new Error(`Sanity upload failed: ${error.message}`);
  }
}

/**
 * Save image to local filesystem
 * @param {Buffer} buffer - Image buffer
 * @param {string} destPath - Destination file path
 */
export async function saveImageToFile(buffer, destPath) {
  await fs.ensureDir(path.dirname(destPath));
  await fs.writeFile(destPath, buffer);
}

/**
 * Load image asset registry from file
 * @param {string} registryPath - Path to registry JSON file
 * @returns {Promise<Object>} Registry object
 */
export async function loadRegistry(registryPath) {
  try {
    if (await fs.pathExists(registryPath)) {
      return await fs.readJson(registryPath);
    }
  } catch (error) {
    console.warn(`Could not load registry: ${error.message}`);
  }
  return {};
}

/**
 * Save image asset registry to file
 * @param {string} registryPath - Path to registry JSON file
 * @param {Object} registry - Registry object to save
 */
export async function saveRegistry(registryPath, registry) {
  await fs.ensureDir(path.dirname(registryPath));
  await fs.writeJson(registryPath, registry, { spaces: 2 });
}

/**
 * Extract all image URLs from migration data files
 * @param {string} dataDir - Directory containing migration JSON files
 * @returns {Promise<Array<string>>} Array of unique image URLs
 */
export async function extractImageUrls(dataDir) {
  const imageUrls = new Set();
  const files = await fs.readdir(dataDir);

  for (const file of files) {
    if (!file.endsWith('.json')) continue;

    try {
      const filePath = path.join(dataDir, file);
      const data = await fs.readJson(filePath);

      // Extract from images array (filter out data URIs and Next.js endpoints)
      if (Array.isArray(data.images)) {
        data.images.forEach(url => {
          if (url && typeof url === 'string' &&
              (url.startsWith('http://') || url.startsWith('https://')) &&
              !url.startsWith('data:') &&
              !url.includes('/_next/image') &&
              !url.includes('/_next/static')) {
            imageUrls.add(url);
          }
        });
      }

      // Recursively find image URLs in nested objects
      const findUrls = (obj) => {
        if (typeof obj !== 'object' || obj === null) return;

        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'string' && (
            value.startsWith('http://') || value.startsWith('https://')
          ) && (
            value.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ||
            value.includes('/images/') ||
            value.includes('plasmic')
          ) && !value.startsWith('data:') &&
              !value.includes('/_next/image') &&
              !value.includes('/_next/static')) {
            // Filter out data URIs, Next.js endpoints, and only keep actual HTTP(S) URLs
            imageUrls.add(value);
          } else if (typeof value === 'object') {
            findUrls(value);
          }
        }
      };

      findUrls(data);
    } catch (error) {
      console.warn(`Error processing ${file}: ${error.message}`);
    }
  }

  return Array.from(imageUrls).sort();
}

/**
 * Generate alt text from image URL or context
 * @param {string} url - Image URL
 * @param {Object} context - Additional context (title, section, etc.)
 * @returns {string} Generated alt text
 */
export function generateAltText(url, context = {}) {
  const { title, section, type } = context;

  // Try to extract meaningful filename
  const filename = path.basename(url, path.extname(url));
  const cleanName = filename
    .replace(/[-_]/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/\s+/g, ' ')
    .trim();

  if (title) {
    return `Image for ${title}`;
  }

  if (section) {
    return `${section} - ${cleanName}`;
  }

  if (type) {
    return `${type} image`;
  }

  return cleanName || 'Image';
}

/**
 * Create Sanity image reference object
 * @param {string} assetId - Sanity asset ID
 * @param {string} alt - Alt text
 * @param {Object} options - Additional options (hotspot, crop, etc.)
 * @returns {Object} Sanity image reference
 */
export function createImageReference(assetId, alt = '', options = {}) {
  const { hotspot, crop, caption } = options;

  const imageRef = {
    _type: 'image',
    asset: {
      _type: 'reference',
      _ref: assetId,
    },
    alt,
  };

  if (hotspot) {
    imageRef.hotspot = hotspot;
  }

  if (crop) {
    imageRef.crop = crop;
  }

  if (caption) {
    imageRef.caption = caption;
  }

  return imageRef;
}

/**
 * Get file extension from content type
 * @param {string} contentType - MIME type
 * @returns {string} File extension
 */
export function getExtensionFromContentType(contentType) {
  const typeMap = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
  };
  return typeMap[contentType] || '.jpg';
}

/**
 * Clean and normalize URL
 * @param {string} url - URL to clean
 * @returns {string} Cleaned URL
 */
export function cleanUrl(url) {
  try {
    // Remove query parameters that might cause issues
    const urlObj = new URL(url);
    // Keep the base URL and path
    return urlObj.origin + urlObj.pathname;
  } catch {
    return url;
  }
}

export default {
  createSanityClient,
  generateHash,
  downloadImage,
  uploadToSanity,
  saveImageToFile,
  loadRegistry,
  saveRegistry,
  extractImageUrls,
  generateAltText,
  createImageReference,
  getExtensionFromContentType,
  cleanUrl,
};
