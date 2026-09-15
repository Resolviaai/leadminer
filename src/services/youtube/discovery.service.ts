import { google, youtube_v3 } from 'googleapis';
import { env } from '../../config/env';
import { quotaManager } from './quota';
import { YouTubeSearchParams, YouTubeChannelDetails } from './types';

export class YouTubeDiscoveryService {
  private youtube: youtube_v3.Youtube | null = null;

  constructor() {
    if (env.YOUTUBE_API_KEY) {
      this.youtube = google.youtube({
        version: 'v3',
        auth: env.YOUTUBE_API_KEY,
      });
    }
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

  public async searchChannelIds(params: YouTubeSearchParams): Promise<{ channelIds: string[]; quotaReached: boolean }> {
    const canSearch = await quotaManager.canExecuteSearch();
    if (!canSearch) {
      console.warn(`[YouTube Quota] Daily search.list limit reached (${env.YOUTUBE_DAILY_SEARCH_LIMIT} calls). Pausing discovery.`);
      return { channelIds: [], quotaReached: true };
    }

    if (!this.youtube) {
      await quotaManager.recordSearchExecution();
      const cleanQuery = params.query.replace(/[^a-zA-Z0-9]/g, '');
      const count = Math.min(params.maxResults || 3, 3);
      const mockIds: string[] = [];
      for (let i = 1; i <= count; i++) {
        mockIds.push(`UCmock_${cleanQuery.slice(0, 10)}_${i}`);
      }
      return { channelIds: mockIds, quotaReached: false };
    }

    try {
      const searchResponse = await this.executeWithRetry(async () => {
        return await this.youtube!.search.list({
          part: ['snippet'],
          q: params.query,
          type: ['channel'],
          maxResults: params.maxResults || env.YOUTUBE_MAX_RESULTS_PER_SEARCH,
          pageToken: params.pageToken,
        });
      });

      await quotaManager.recordSearchExecution();

      const items = searchResponse.data.items || [];
      const rawIds = items
        .map((item) => item.id?.channelId)
        .filter((id): id is string => Boolean(id));

      // In-memory deduplication
      const uniqueIds = Array.from(new Set(rawIds));
      return { channelIds: uniqueIds, quotaReached: false };
    } catch (error: any) {
      const isQuota = error?.status === 403 && (error?.message?.includes('quota') || error?.errors?.[0]?.reason === 'quotaExceeded');
      if (isQuota) {
        console.warn(`[YouTube API] 403 quotaExceeded received. Marking daily quota full.`);
        const quota = await quotaManager.syncQuotaState();
        quota.searchCallsUsedToday = quota.searchCallsDailyLimit;
        await quotaManager.persistQuotaState();
        return { channelIds: [], quotaReached: true };
      }
      throw error;
    }
  }

  public async enrichChannelsBatch(channelIds: string[]): Promise<{ channels: YouTubeChannelDetails[]; quotaReached: boolean }> {
    if (channelIds.length === 0) {
      return { channels: [], quotaReached: false };
    }

    // In-memory deduplication guard
    const uniqueChannelIds = Array.from(new Set(channelIds));

    const canFetchChannels = await quotaManager.canExecuteGeneralCall(1);
    if (!canFetchChannels) {
      console.warn(`[YouTube Quota] General quota limit reached. Pausing.`);
      return { channels: [], quotaReached: true };
    }

    if (!this.youtube) {
      await quotaManager.recordGeneralQuotaUsage(1);
      const mockChannels: YouTubeChannelDetails[] = uniqueChannelIds.map((id, index) => ({
        channelId: id,
        title: `Creator ${id.slice(-8)}`,
        description: `Welcome to the official channel!\n\nFor business inquiries and sponsorships: business.${id.toLowerCase().slice(-6)}@gmail.com\n\nInstagram: @${id.slice(-6)}_official\nTwitter: @${id.slice(-6)}clips\nLinktree: https://linktr.ee/${id.slice(-6)}`,
        customUrl: `@${id.slice(-8)}`,
        publishedAt: new Date(Date.now() - 86400000 * 365).toISOString(),
        thumbnailUrl: `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200`,
        subscriberCount: 25000 * (index + 1),
        videoCount: 120 * (index + 1),
        viewCount: 1500000 * (index + 1),
        website: `https://${id.toLowerCase().slice(-6)}.com`,
        rawPayload: { mock: true, channelId: id },
      }));
      return { channels: mockChannels, quotaReached: false };
    }

    try {
      const allChannels: YouTubeChannelDetails[] = [];
      const CHUNK_SIZE = 50;

      for (let i = 0; i < uniqueChannelIds.length; i += CHUNK_SIZE) {
        const chunk = uniqueChannelIds.slice(i, i + CHUNK_SIZE);
        const channelsResponse = await this.executeWithRetry(async () => {
          return await this.youtube!.channels.list({
            part: ['snippet', 'statistics'],
            id: chunk,
          });
        });

        await quotaManager.recordGeneralQuotaUsage(1);

        const channelItems = channelsResponse.data.items || [];
        for (const c of channelItems) {
          const snippet = c.snippet || {};
          const stats = c.statistics || {};

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
            rawPayload: c,
          });
        }
      }

      return { channels: allChannels, quotaReached: false };
    } catch (error: any) {
      const isQuota = error?.status === 403 && (error?.message?.includes('quota') || error?.errors?.[0]?.reason === 'quotaExceeded');
      if (isQuota) {
        console.warn(`[YouTube API] 403 quotaExceeded received. Marking daily quota full.`);
        const quota = await quotaManager.syncQuotaState();
        quota.generalQuotaUsedToday = quota.generalQuotaDailyLimit;
        await quotaManager.persistQuotaState();
        return { channels: [], quotaReached: true };
      }
      throw error;
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
