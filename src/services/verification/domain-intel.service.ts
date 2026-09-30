import { db } from '../../db/client';
import { domainCache, DomainCacheRecord } from '../../db/schema';
import { eq, sql } from 'drizzle-orm';
import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);

export type MxProviderType =
  | 'CONSUMER_GMAIL'
  | 'GOOGLE_WORKSPACE'
  | 'CONSUMER_OUTLOOK'
  | 'MICROSOFT_365'
  | 'YAHOO'
  | 'PROTON'
  | 'ZOHO'
  | 'ICLOUD'
  | 'CUSTOM'
  | 'NONE';

export interface DomainProfile {
  domain: string;
  hasMx: boolean;
  mxHost?: string;
  mxProvider: MxProviderType;
  isDisposable: boolean;
  isCatchAll: boolean;
  bounceCount: number;
  sentCount: number;
  replyCount: number;
  lastCheckedAt: Date;
  expiresAt: Date;
  source: 'memory' | 'database' | 'dns_lookup';
}

const MEMORY_CACHE = new Map<string, { profile: DomainProfile; expires: number }>();
const DEFAULT_POSITIVE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const DEFAULT_NEGATIVE_TTL_MS = 1 * 60 * 60 * 1000; // 1 hour for failures/timeouts

const CONSUMER_GMAIL_DOMAINS = new Set(['gmail.com', 'googlemail.com']);
const CONSUMER_OUTLOOK_DOMAINS = new Set(['outlook.com', 'hotmail.com', 'live.com', 'msn.com']);
const CONSUMER_YAHOO_DOMAINS = new Set(['yahoo.com', 'ymail.com', 'rocketmail.com']);
const CONSUMER_ICLOUD_DOMAINS = new Set(['icloud.com', 'me.com', 'mac.com']);
const CONSUMER_PROTON_DOMAINS = new Set(['protonmail.com', 'proton.me']);

export function identifyProviderFromMx(domain: string, mxHost: string | null): MxProviderType {
  const normDomain = domain.toLowerCase();
  const host = (mxHost || '').toLowerCase();

  if (CONSUMER_GMAIL_DOMAINS.has(normDomain)) return 'CONSUMER_GMAIL';
  if (CONSUMER_OUTLOOK_DOMAINS.has(normDomain)) return 'CONSUMER_OUTLOOK';
  if (CONSUMER_YAHOO_DOMAINS.has(normDomain)) return 'YAHOO';
  if (CONSUMER_ICLOUD_DOMAINS.has(normDomain)) return 'ICLOUD';
  if (CONSUMER_PROTON_DOMAINS.has(normDomain)) return 'PROTON';

  if (!host) return 'NONE';

  if (host.includes('google.com') || host.includes('googlemail.com') || host.includes('aspmx.l.google.com')) {
    return 'GOOGLE_WORKSPACE';
  }
  if (host.includes('outlook.com') || host.includes('protection.outlook.com')) {
    return 'MICROSOFT_365';
  }
  if (host.includes('yahoodns.net')) {
    return 'YAHOO';
  }
  if (host.includes('zoho.com') || host.includes('zoho.eu')) {
    return 'ZOHO';
  }
  if (host.includes('protonmail.ch') || host.includes('proton.me')) {
    return 'PROTON';
  }
  if (host.includes('icloud.com') || host.includes('apple.com')) {
    return 'ICLOUD';
  }

  return 'CUSTOM';
}

export class DomainIntelService {
  /**
   * Fast domain profile resolution with 2-tier caching:
   * Tier 1: In-memory Map (0ms)
   * Tier 2: PostgreSQL domain_cache table (<5ms)
   * Fallback: Live DNS MX lookup + cache write
   */
  public async getDomainProfile(domain: string, isDisposable = false): Promise<DomainProfile> {
    const cleanDomain = domain.toLowerCase().trim();
    const now = Date.now();

    // 1. Check in-memory cache
    const memHit = MEMORY_CACHE.get(cleanDomain);
    if (memHit && memHit.expires > now) {
      return { ...memHit.profile, source: 'memory' };
    }

    // 2. Check DB domain_cache
    if (!(process.env.NODE_ENV === 'test' && !process.env.DATABASE_URL)) {
      try {
        const dbRows = await Promise.race([
          db
            .select()
            .from(domainCache)
            .where(eq(domainCache.domain, cleanDomain))
            .limit(1),
          new Promise<any[]>((_, reject) => setTimeout(() => reject(new Error('DB timeout')), 500)),
        ]);

        if (dbRows && dbRows.length > 0) {
          const row = dbRows[0];
          if (new Date(row.expiresAt).getTime() > now) {
            const profile: DomainProfile = {
              domain: row.domain,
              hasMx: row.hasMx,
              mxHost: row.mxHost || undefined,
              mxProvider: (row.mxProvider as MxProviderType) || 'CUSTOM',
              isDisposable: row.isDisposable,
              isCatchAll: Boolean(row.isCatchAll),
              bounceCount: row.bounceCount || 0,
              sentCount: row.sentCount || 0,
              replyCount: row.replyCount || 0,
              lastCheckedAt: new Date(row.lastCheckedAt),
              expiresAt: new Date(row.expiresAt),
              source: 'database',
            };
            MEMORY_CACHE.set(cleanDomain, {
              profile,
              expires: profile.expiresAt.getTime(),
            });
            return profile;
          }
        }
      } catch {
        // Non-fatal if DB query fails during migration or testing
      }
    }

    // 3. Fallback: Fast-path for consumer domains without performing live DNS
    if (CONSUMER_GMAIL_DOMAINS.has(cleanDomain)) {
      return this.saveProfile({
        domain: cleanDomain,
        hasMx: true,
        mxHost: 'gmail-smtp-in.l.google.com',
        mxProvider: 'CONSUMER_GMAIL',
        isDisposable: false,
        isCatchAll: false,
        bounceCount: 0,
        sentCount: 0,
        replyCount: 0,
        lastCheckedAt: new Date(),
        expiresAt: new Date(now + DEFAULT_POSITIVE_TTL_MS),
        source: 'dns_lookup',
      });
    }

    if (CONSUMER_OUTLOOK_DOMAINS.has(cleanDomain)) {
      return this.saveProfile({
        domain: cleanDomain,
        hasMx: true,
        mxHost: 'outlook-com.olc.protection.outlook.com',
        mxProvider: 'CONSUMER_OUTLOOK',
        isDisposable: false,
        isCatchAll: false,
        bounceCount: 0,
        sentCount: 0,
        replyCount: 0,
        lastCheckedAt: new Date(),
        expiresAt: new Date(now + DEFAULT_POSITIVE_TTL_MS),
        source: 'dns_lookup',
      });
    }

    // 4. Live DNS MX resolution
    let hasMx = false;
    let primaryMx: string | undefined = undefined;
    let provider: MxProviderType = 'NONE';
    let ttlMs = DEFAULT_POSITIVE_TTL_MS;

    if (!isDisposable) {
      try {
        const mxList = await Promise.race([
          resolveMx(cleanDomain),
          new Promise<dns.MxRecord[]>((_, reject) =>
            setTimeout(() => reject(new Error('DNS timeout')), 1500)
          ),
        ]);

        if (mxList && mxList.length > 0) {
          mxList.sort((a, b) => a.priority - b.priority);
          primaryMx = mxList[0].exchange;
          hasMx = true;
          provider = identifyProviderFromMx(cleanDomain, primaryMx);
        } else {
          ttlMs = DEFAULT_NEGATIVE_TTL_MS;
        }
      } catch {
        ttlMs = DEFAULT_NEGATIVE_TTL_MS;
      }
    }

    const profile: DomainProfile = {
      domain: cleanDomain,
      hasMx,
      mxHost: primaryMx,
      mxProvider: provider,
      isDisposable,
      isCatchAll: false,
      bounceCount: 0,
      sentCount: 0,
      replyCount: 0,
      lastCheckedAt: new Date(),
      expiresAt: new Date(now + ttlMs),
      source: 'dns_lookup',
    };

    return this.saveProfile(profile);
  }

  /**
   * Atomically save or upsert domain profile into memory cache & database
   */
  public async saveProfile(profile: DomainProfile): Promise<DomainProfile> {
    MEMORY_CACHE.set(profile.domain, {
      profile,
      expires: profile.expiresAt.getTime(),
    });

    if (process.env.NODE_ENV === 'test' && !process.env.DATABASE_URL) {
      return profile;
    }

    try {
      await Promise.race([
        db
          .insert(domainCache)
          .values({
            domain: profile.domain,
            mxHost: profile.mxHost || null,
            mxProvider: profile.mxProvider,
            hasMx: profile.hasMx,
            isCatchAll: profile.isCatchAll,
            isDisposable: profile.isDisposable,
            bounceCount: profile.bounceCount,
            sentCount: profile.sentCount,
            replyCount: profile.replyCount,
            lastCheckedAt: profile.lastCheckedAt,
            expiresAt: profile.expiresAt,
          })
          .onConflictDoUpdate({
            target: domainCache.domain,
            set: {
              mxHost: profile.mxHost || null,
              mxProvider: profile.mxProvider,
              hasMx: profile.hasMx,
              isCatchAll: profile.isCatchAll,
              isDisposable: profile.isDisposable,
              lastCheckedAt: profile.lastCheckedAt,
              expiresAt: profile.expiresAt,
              updatedAt: new Date(),
            },
          }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('DB timeout')), 500)),
      ]);
    } catch {
      // Non-blocking in case DB write has conflict or savepoint issue
    }

    return profile;
  }

  /**
   * Record domain bounce event to accumulate historical outcome evidence
   */
  public async recordDomainBounce(domain: string): Promise<void> {
    const cleanDomain = domain.toLowerCase().trim();
    const mem = MEMORY_CACHE.get(cleanDomain);
    if (mem) {
      mem.profile.bounceCount += 1;
    }

    if (process.env.NODE_ENV === 'test' && !process.env.DATABASE_URL) {
      return;
    }

    try {
      await Promise.race([
        db
          .update(domainCache)
          .set({
            bounceCount: sql`${domainCache.bounceCount} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(domainCache.domain, cleanDomain)),
        new Promise((_, reject) => setTimeout(() => reject(new Error('DB timeout')), 500)),
      ]);
    } catch {
      // Ignore non-fatal update error
    }
  }

  /**
   * Clear in-memory cache (primarily for unit tests)
   */
  public clearMemoryCache(): void {
    MEMORY_CACHE.clear();
  }
}

export const domainIntelService = new DomainIntelService();
