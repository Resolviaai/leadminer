import { google, youtube_v3 } from 'googleapis';
import { env } from '../../config/env';
import { quotaManager, getAvailableYouTubeKeys } from './quota';
import { YouTubeSearchParams, YouTubeChannelDetails } from './types';

export class YouTubeDiscoveryService {
  private clients: youtube_v3.Youtube[] = [];

  constructor() {
    const keys = getAvailableYouTubeKeys();
    for (const key of keys) {
      this.clients.push(
        google.youtube({
          version: 'v3',
          auth: key,
        })
      );
    }
  }

  private getClient(): youtube_v3.Youtube | null {
    if (this.clients.length === 0) return null;
    const idx = quotaManager.getActiveKeyIndex();
    return this.clients[idx] || this.clients[0] || null;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async executeWithRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    let delay = 1000;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        const isQuota = error?.status === 403 && (error?.message?.includes('quota') || error?.errors?.[0]?.reason === 'quotaExceeded');
        if (isQuota) {
          quotaManager.markActiveKeyExhausted();
          throw error; // Don't retry quota exhaustion
        }

        const isTransient = error?.status === 429 || error?.status === 500 || error?.status === 502 || error?.status === 503 || error?.code === 'ETIMEDOUT' || error?.code === 'ECONNRESET';
        if (isTransient && attempt < maxRetries) {
          const jitter = Math.random() * 500;
          console.warn(`[YouTube API] Transient error (HTTP ${error?.status || error?.code}). Retrying in ${Math.round(delay + jitter)}ms (attempt ${attempt}/${maxRetries})...`);
          await this.sleep(delay + jitter);
          delay *= 2;
        } else {
          throw error;
        }
      }
    }
    throw new Error('Max retries exceeded');
  }

  public async searchChannelIds(params: YouTubeSearchParams): Promise<{ channelIds: string[]; nextPageToken?: string; quotaReached: boolean }> {
    const claimed = await quotaManager.tryClaimSearchCall();
    if (!claimed) {
      console.warn(`[YouTube Quota] Daily search.list limit reached (${env.YOUTUBE_DAILY_SEARCH_LIMIT} calls). Pausing discovery.`);
      return { channelIds: [], quotaReached: true };
    }

    const client = this.getClient();
    if (!client) {
      console.error('[YouTube API] No YouTube client available. YOUTUBE_API_KEY is not configured or all keys exhausted.');
      await quotaManager.refundSearchCall();
      return { channelIds: [], quotaReached: false };
    }

    try {
      const searchResponse = await this.executeWithRetry(async () => {
        return await client.search.list({
          part: ['snippet'],
          q: params.query,
          type: ['channel'],
          pageToken: params.pageToken,
          maxResults: params.maxResults || env.YOUTUBE_MAX_RESULTS_PER_SEARCH,
          regionCode:
            params.regionCode ||
            (env.YOUTUBE_TARGET_REGION === 'TIER_1' || env.YOUTUBE_TARGET_REGION === 'ALL'
              ? undefined
              : env.YOUTUBE_TARGET_REGION || 'US'),
          relevanceLanguage: params.relevanceLanguage || env.YOUTUBE_TARGET_LANGUAGE || 'en',
        });
      });

      const items = searchResponse.data.items || [];
      const rawIds = items
        .map((item) => item.id?.channelId)
        .filter((id): id is string => Boolean(id));

      // In-memory deduplication
      const uniqueIds = Array.from(new Set(rawIds));
      return {
        channelIds: uniqueIds,
        nextPageToken: searchResponse.data.nextPageToken || undefined,
        quotaReached: false,
      };
    } catch (error: any) {
      const isQuota = error?.status === 403 && (error?.message?.includes('quota') || error?.errors?.[0]?.reason === 'quotaExceeded');
      if (isQuota) {
        console.warn(`[YouTube API] 403 quotaExceeded received. Marking daily quota full.`);
        const quota = await quotaManager.syncQuotaState();
        quota.searchCallsUsedToday = quota.searchCallsDailyLimit;
        await quotaManager.persistQuotaState();
        return { channelIds: [], quotaReached: true };
      }
      // Refund quota on non-quota transient or fatal failures (P2-15)
      await quotaManager.refundSearchCall();
      throw error;
    }
  }

  public async enrichChannelsBatch(channelIds: string[]): Promise<{ channels: YouTubeChannelDetails[]; quotaReached: boolean }> {
    if (channelIds.length === 0) {
      return { channels: [], quotaReached: false };
    }

    // In-memory deduplication guard
    const uniqueChannelIds = Array.from(new Set(channelIds));

    const chunksCount = Math.ceil(uniqueChannelIds.length / 50);
    const claimed = await quotaManager.tryClaimGeneralQuota(chunksCount);
    if (!claimed) {
      console.warn(`[YouTube Quota] General quota limit reached. Pausing.`);
      return { channels: [], quotaReached: true };
    }

    const client = this.getClient();
    if (!client) {
      console.error('[YouTube API] No YouTube client available. YOUTUBE_API_KEY is not configured or all keys exhausted.');
      await quotaManager.refundGeneralQuota(chunksCount);
      return { channels: [], quotaReached: false };
    }

    try {
      const allChannels: YouTubeChannelDetails[] = [];
      const CHUNK_SIZE = 50;

      for (let i = 0; i < uniqueChannelIds.length; i += CHUNK_SIZE) {
        const chunk = uniqueChannelIds.slice(i, i + CHUNK_SIZE);
        const channelsResponse = await this.executeWithRetry(async () => {
          return await client.channels.list({
            part: ['snippet', 'statistics', 'contentDetails'],
            id: chunk,
          });
        });

        const channelItems = channelsResponse.data.items || [];
        for (const c of channelItems) {
          const snippet = c.snippet || {};
          const stats = c.statistics || {};
          const contentDetails = c.contentDetails || {};

          allChannels.push({
            channelId: c.id!,
            title: snippet.title || 'Untitled Channel',
            description: snippet.description || '',
            customUrl: snippet.customUrl || undefined,
            publishedAt: snippet.publishedAt || undefined,
            thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || undefined,
            subscriberCount: Number(stats.subscriberCount) || 0,
            videoCount: Number(stats.videoCount) || 0,
            viewCount: Number(stats.viewCount) || 0,
            country: snippet.country || undefined,
            uploadsPlaylistId: contentDetails.relatedPlaylists?.uploads || undefined,
            rawPayload: c,
          });
        }
      }

      return { channels: allChannels, quotaReached: false };
    } catch (error: any) {
      const isQuota = error?.status === 403 && (error?.message?.includes('quota') || error?.errors?.[0]?.reason === 'quotaExceeded');
      if (isQuota) {
        console.warn(`[YouTube API] 403 quotaExceeded received. Marking active key exhausted.`);
        quotaManager.markActiveKeyExhausted();
        const quota = await quotaManager.syncQuotaState();
        return { channels: [], quotaReached: quota.generalQuotaUsedToday >= quota.generalQuotaDailyLimit };
      }
      // Refund general quota on non-quota failure (P2-15)
      await quotaManager.refundGeneralQuota(chunksCount);
      throw error;
    }
  }

  public async getRecentVideoDescriptions(uploadsPlaylistId: string, maxResults = 5): Promise<string[]> {
    if (!uploadsPlaylistId) return [];

    const claimed = await quotaManager.tryClaimGeneralQuota(1);
    if (!claimed) return [];

    const client = this.getClient();
    if (!client) return [];

    try {
      const res = await this.executeWithRetry(async () => {
        return await client.playlistItems.list({
          part: ['snippet'],
          playlistId: uploadsPlaylistId,
          maxResults,
        });
      });

      const items = res.data.items || [];
      return items
        .map((item) => item.snippet?.description || '')
        .filter((desc) => Boolean(desc && desc.trim().length > 0));
    } catch (err: any) {
      const isQuota = err?.status === 403 && (err?.message?.includes('quota') || err?.errors?.[0]?.reason === 'quotaExceeded');
      if (isQuota) {
        quotaManager.markActiveKeyExhausted();
      }
      console.warn(`[YouTube API] Failed to fetch video descriptions for playlist ${uploadsPlaylistId}:`, err?.message);
      return [];
    }
  }

  public async searchChannelsByKeyword(params: YouTubeSearchParams): Promise<{ channels: YouTubeChannelDetails[]; quotaReached: boolean }> {
    const { channelIds, quotaReached } = await this.searchChannelIds(params);
    if (quotaReached || channelIds.length === 0) {
      return { channels: [], quotaReached };
    }
    return await this.enrichChannelsBatch(channelIds);
  }
}

export const youtubeDiscoveryService = new YouTubeDiscoveryService();
