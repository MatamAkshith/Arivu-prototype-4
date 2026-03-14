/**
 * Shared utility functions for the Arivu extension
 * @module utils
 */

/**
 * Parse ISO 8601 duration string to readable format (MM:SS or HH:MM:SS)
 * @param {string} iso - ISO 8601 duration string (e.g., "PT4M13S")
 * @returns {string} Formatted duration string
 * @example
 * parseDuration("PT4M13S") // "4:13"
 * parseDuration("PT1H30M45S") // "1:30:45"
 */
function parseDuration(iso) {
  if (!iso || typeof iso !== "string") {
    return "0:00";
  }

  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) {
    return "0:00";
  }

  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Format a number with locale-specific thousands separators
 * @param {number|string} num - Number to format
 * @returns {string} Formatted number string
 * @example
 * formatNumber(1234567) // "1,234,567"
 */
function formatNumber(num) {
  if (num === null || num === undefined) {
    return "0";
  }
  return Number(num).toLocaleString();
}

/**
 * Safe fetch wrapper with error handling and timeout
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options (optional)
 * @param {number} timeout - Timeout in milliseconds (default: 10000)
 * @returns {Promise<Response>} Fetch response
 * @throws {Error} If fetch fails or times out
 */
async function safeFetch(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error("Request timeout - please try again");
    }
    throw error;
  }
}

/**
 * Get cached data from localStorage with expiration check
 * @param {string} key - Cache key
 * @param {number} maxAge - Maximum age in milliseconds (default: 3600000 = 1 hour)
 * @returns {Object|null} Cached data or null if expired/not found
 */
function getCachedData(key, maxAge = 3600000) {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) {
      return null;
    }

    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;

    if (age > maxAge) {
      localStorage.removeItem(key);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error reading cache:", error);
    return null;
  }
}

/**
 * Set data in localStorage with timestamp
 * @param {string} key - Cache key
 * @param {*} data - Data to cache
 */
function setCachedData(key, data) {
  try {
    const cacheEntry = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(cacheEntry));
  } catch (error) {
    console.error("Error writing cache:", error);
    // If storage is full, try to clear old entries
    if (error.name === "QuotaExceededError") {
      clearOldCache();
    }
  }
}

/**
 * Clear cache entries older than specified age
 * @param {number} maxAge - Maximum age in milliseconds (default: 3600000 = 1 hour)
 */
function clearOldCache(maxAge = 3600000) {
  try {
    const keys = Object.keys(localStorage);
    const now = Date.now();

    keys.forEach((key) => {
      if (key.startsWith("arivu_cache_")) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const { timestamp } = JSON.parse(cached);
            if (now - timestamp > maxAge) {
              localStorage.removeItem(key);
            }
          }
        } catch (e) {
          // Invalid cache entry, remove it
          localStorage.removeItem(key);
        }
      }
    });
  } catch (error) {
    console.error("Error clearing old cache:", error);
  }
}

/**
 * Create a cache key from parameters
 * @param {string} prefix - Cache key prefix
 * @param {Object} params - Parameters to include in key
 * @returns {string} Cache key
 */
function createCacheKey(prefix, params) {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return `arivu_cache_${prefix}_${sortedParams}`;
}

/**
 * Rate limiter for API calls
 * @class RateLimiter
 */
class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  /**
   * Check if a request can be made
   * @returns {boolean} True if request can be made
   */
  canMakeRequest() {
    const now = Date.now();
    // Remove requests outside the time window
    this.requests = this.requests.filter((time) => now - time < this.windowMs);
    return this.requests.length < this.maxRequests;
  }

  /**
   * Record a request
   */
  recordRequest() {
    this.requests.push(Date.now());
  }

  /**
   * Get time until next request can be made (in milliseconds)
   * @returns {number} Milliseconds until next request
   */
  getTimeUntilNextRequest() {
    if (this.canMakeRequest()) {
      return 0;
    }
    const oldestRequest = Math.min(...this.requests);
    return this.windowMs - (Date.now() - oldestRequest);
  }
}

/**
 * Show user-friendly error message
 * @param {string} message - Error message to display
 * @param {HTMLElement} container - Container element to show message in
 */
function showError(message, container) {
  if (!container) {
    console.error(message);
    return;
  }

  container.innerHTML = `
    <div class="error-message col-span-full text-center p-4 bg-red-50 border border-red-200 rounded-lg">
      <p class="text-red-700 font-medium">${escapeHtml(message)}</p>
      <p class="text-red-600 text-sm mt-2">Please try again later.</p>
    </div>
  `;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Show loading spinner
 * @param {HTMLElement} container - Container element to show spinner in
 */
function showLoader(container) {
  if (!container) {
    return;
  }

  container.innerHTML = `
    <div class="loader-container col-span-full flex justify-center items-center py-12">
      <div class="loader w-12 h-12 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
      <p class="ml-4 text-gray-600">Loading videos...</p>
    </div>
  `;
}
