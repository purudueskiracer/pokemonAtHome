/**
 * ImageService — resolves words to ARASAAC pictogram image URLs.
 *
 * Primary source: pre-mapped IDs in wordBank (zero latency).
 * Fallback: ARASAAC REST API search (no key required).
 *
 * Attribution: Pictograms by ARASAAC (https://arasaac.org),
 * created by Sergio Palao, Gobierno de Aragón. CC BY-NC-SA 4.0.
 */

const ARASAAC_BASE = "https://static.arasaac.org/pictograms";
const ARASAAC_API  = "https://api.arasaac.org/v1";

/** In-memory cache: word → ARASAAC pictogram ID. */
const idCache = new Map();

/**
 * Get the ARASAAC image URL for a given word.
 * If the word has a pre-mapped ID (from wordBank), uses it directly.
 * Otherwise falls back to a static placeholder.
 *
 * @param {string} word
 * @param {number} [size=300] — pixel size (ARASAAC supports 300, 500)
 * @returns {string} image URL
 */
export function getImageUrl(word, size = 300) {
  const id = idCache.get(word.toLowerCase());
  if (id) return `${ARASAAC_BASE}/${id}/${id}_${size}.png`;
  // Fallback: return empty string — caller should handle missing images
  return "";
}

/**
 * Register a pre-known ARASAAC ID for a word.
 * Called by wordBank during import to populate the cache.
 *
 * @param {string} word
 * @param {number} arasaacId
 */
export function registerImageId(word, arasaacId) {
  idCache.set(word.toLowerCase(), arasaacId);
}

/**
 * Batch-register multiple word→ID mappings.
 * @param {Array<{ word: string, arasaacId: number }>} entries
 */
export function registerImageIds(entries) {
  for (const { word, arasaacId } of entries) {
    idCache.set(word.toLowerCase(), arasaacId);
  }
}

/**
 * Search ARASAAC API for a word's pictogram ID at runtime.
 * Caches the result. Returns the ID or null.
 *
 * @param {string} word
 * @returns {Promise<number|null>}
 */
export async function searchImageId(word) {
  const key = word.toLowerCase();
  if (idCache.has(key)) return idCache.get(key);

  try {
    const res = await fetch(`${ARASAAC_API}/pictograms/en/search/${encodeURIComponent(key)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const id = data[0]._id;
      idCache.set(key, id);
      return id;
    }
  } catch {
    // Network error — silently fail
  }
  return null;
}

/**
 * Preload images into browser cache (fire-and-forget).
 * @param {string[]} words
 * @param {number} [size=300]
 */
export function preloadImages(words, size = 300) {
  for (const word of words) {
    const url = getImageUrl(word, size);
    if (url) {
      const img = new Image();
      img.src = url;
    }
  }
}

/**
 * Speak a word using browser SpeechSynthesis.
 * Handles iOS Safari quirk (must be called from user gesture).
 *
 * @param {string} text — word or phrase to speak
 * @param {number} [rate=0.85] — speech rate (slower for young readers)
 */
export function speak(text, rate = 0.85) {
  if (!window.speechSynthesis) return;
  // Cancel any in-progress utterance
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.pitch = 1.1;
  utterance.lang = "en-US";
  window.speechSynthesis.speak(utterance);
}
