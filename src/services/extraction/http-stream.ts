import { isSafePublicUrl } from '../../lib/ssrf-guard';

export interface SafeFetchOptions {
  userAgent?: string;
  timeoutMs?: number;
  maxBytes?: number;
  maxHops?: number;
  allowedContentTypes?: string[];
}

export interface SafeFetchResult {
  html: string | null;
  status?: number;
  finalUrl?: string;
  error?: 'SSRF_BLOCKED' | 'TIMEOUT' | 'TOO_MANY_REDIRECTS' | 'UNSUPPORTED_CONTENT_TYPE' | 'PAYLOAD_TOO_LARGE' | 'FETCH_ERROR';
}

/**
 * Universal SSRF-Guarded, Stream-Capped HTTP Fetcher
 * - Enforces isSafePublicUrl() DNS checks on the initial URL and on EVERY redirect hop.
 * - Enforces true network stream byte ceiling with early reader cancellation.
 * - Gates response Content-Type before downloading large binary files.
 */
export async function safeFetchHtmlStream(
  initialUrl: string,
  options: SafeFetchOptions = {}
): Promise<SafeFetchResult> {
  const {
    userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    timeoutMs = 4000,
    maxBytes = 262144, // 256 KB
    maxHops = 3,
    allowedContentTypes = ['text/html', 'application/xhtml+xml', 'text/plain'],
  } = options;

  let currentUrl = initialUrl;
  let hops = 0;

  try {
    while (hops <= maxHops) {
      // 1. Hop-by-hop SSRF validation
      if (!(await isSafePublicUrl(currentUrl))) {
        console.warn(`[SSRF Guard] Blocked unsafe target URL at hop ${hops}: ${currentUrl}`);
        return { html: null, error: 'SSRF_BLOCKED' };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      let response: Response;
      try {
        response = await fetch(currentUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': userAgent,
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          redirect: 'manual', // Enforce manual hop-by-hop validation
        });
      } finally {
        clearTimeout(timeoutId);
      }

      // 2. Handle redirects with per-hop IP verification
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (!location) {
          return { html: null, error: 'FETCH_ERROR' };
        }
        currentUrl = new URL(location, currentUrl).toString();
        hops++;
        if (hops > maxHops) {
          return { html: null, error: 'TOO_MANY_REDIRECTS' };
        }
        continue;
      }

      if (!response.ok) {
        return { html: null, status: response.status, error: 'FETCH_ERROR' };
      }

      // 3. Content-Type gating: reject binary, images, pdf, zip, video
      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      const isAllowed = allowedContentTypes.some((t) => contentType.includes(t));
      if (!isAllowed) {
        return { html: null, error: 'UNSUPPORTED_CONTENT_TYPE' };
      }

      // 4. Content-Length check: reject if header indicates excessive payload
      const contentLengthHeader = response.headers.get('content-length');
      if (contentLengthHeader) {
        const declaredSize = parseInt(contentLengthHeader, 10);
        if (!isNaN(declaredSize) && declaredSize > maxBytes * 4) {
          return { html: null, error: 'PAYLOAD_TOO_LARGE' };
        }
      }

      // 5. True Network Stream Capping
      if (!response.body) {
        const text = await response.text();
        return { html: text.slice(0, maxBytes), status: response.status, finalUrl: currentUrl };
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8', { fatal: false, ignoreBOM: true });
      let accumulated = '';
      let bytesRead = 0;

      try {
        while (bytesRead < maxBytes) {
          const { done, value } = await reader.read();
          if (done || !value) break;
          bytesRead += value.length;
          accumulated += decoder.decode(value, { stream: true });
          if (bytesRead >= maxBytes) {
            await reader.cancel();
            break;
          }
        }
        accumulated += decoder.decode();
      } catch {
        // Stream reading completed or aborted early; preserve what was received
      }

      return {
        html: accumulated.slice(0, maxBytes),
        status: response.status,
        finalUrl: currentUrl,
      };
    }

    return { html: null, error: 'TOO_MANY_REDIRECTS' };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { html: null, error: 'TIMEOUT' };
    }
    return { html: null, error: 'FETCH_ERROR' };
  }
}

/**
 * In-Memory Domain Crawl Cache with TTL and Circuit Breaker
 */
export interface CachedDomainEntry<T> {
  timestamp: number;
  result: T;
  isFailure?: boolean;
}

export class DomainCrawlCache<T> {
  private cache = new Map<string, CachedDomainEntry<T>>();
  private readonly ttlMs: number;
  private readonly maxEntries: number;

  constructor(ttlMs = 15 * 60 * 1000, maxEntries = 1000) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
  }

  public get(domain: string): T | null {
    const entry = this.cache.get(domain.toLowerCase());
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(domain.toLowerCase());
      return null;
    }
    return entry.result;
  }

  public set(domain: string, result: T, isFailure = false): void {
    if (this.cache.size >= this.maxEntries) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(domain.toLowerCase(), {
      timestamp: Date.now(),
      result,
      isFailure,
    });
  }

  public clear(): void {
    this.cache.clear();
  }
}
