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

  public async searchChannelsByKeyword(params: YouTubeSearchParams): Promise<{ channels: YouTubeChannelDetails[]; quotaReached: boolean }> {
    const canSearch = await quotaManager.canExecuteSearch();
    if (!canSearch) {
      console.warn(`[YouTube Quota] Daily search.list limit reached (${env.YOUTUBE_DAILY_SEARCH_LIMIT} calls). Pausing discovery.`);
      return { channels: [], quotaReached: true };
    }

    // Mock Mode fallback if DRY_RUN and no API key
    if (!this.youtube) {
      return this.generateMockSearchResults(params);
    }

    try {
      // 1. Call search.list
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
      const channelIds = items
        .map((item) => item.id?.channelId)
        .filter((id): id is string => Boolean(id));

      if (channelIds.length === 0) {
        return { channels: [], quotaReached: false };
      }

      // 2. Call channels.list in batches of up to 50
      const canFetchChannels = await quotaManager.canExecuteGeneralCall(1);
      if (!canFetchChannels) {
        console.warn(`[YouTube Quota] General quota limit reached. Pausing.`);
        return { channels: [], quotaReached: true };
      }

      const channelsResponse = await this.executeWithRetry(async () => {
        return await this.youtube!.channels.list({
          part: ['snippet', 'statistics'],
          id: channelIds.slice(0, 50),
        });
      });

      await quotaManager.recordGeneralQuotaUsage(1);

      const channelItems = channelsResponse.data.items || [];
      const normalizedChannels: YouTubeChannelDetails[] = channelItems.map((c) => {
        const snippet = c.snippet || {};
        const stats = c.statistics || {};

        return {
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
        };
      });

      return { channels: normalizedChannels, quotaReached: false };
    } catch (error: any) {
      if (error?.errors?.[0]?.reason === 'quotaExceeded' || error?.message?.includes('quotaExceeded')) {
        console.warn(`[YouTube API] 403 quotaExceeded received. Marking daily quota full.`);
        // Set search count to limit to prevent further calls
        const quota = await quotaManager.syncQuotaState();
        quota.searchCallsUsedToday = quota.searchCallsDailyLimit;
        await quotaManager.persistQuotaState();
        return { channels: [], quotaReached: true };
      }
      throw error;
    }
  }

  private async generateMockSearchResults(params: YouTubeSearchParams): Promise<{ channels: YouTubeChannelDetails[]; quotaReached: boolean }> {
    await quotaManager.recordSearchExecution();
    const cleanQuery = params.query.replace(/[^a-zA-Z0-9]/g, '');
    const count = Math.min(params.maxResults || 3, 3);
    const mockChannels: YouTubeChannelDetails[] = [];

    for (let i = 1; i <= count; i++) {
      const channelId = `UCmock_${cleanQuery.slice(0, 10)}_${i}`;
      mockChannels.push({
        channelId,
        title: `${params.query} Creator ${i}`,
        description: `Welcome to the official channel for ${params.query}!\n\nFor business inquiries and sponsorships, please contact: business.${cleanQuery.toLowerCase()}${i}@gmail.com\n\nInstagram: @${cleanQuery.toLowerCase()}_official\nTwitter: @${cleanQuery.toLowerCase()}clips`,
        customUrl: `@${cleanQuery.toLowerCase()}${i}`,
        publishedAt: new Date(Date.now() - 86400000 * 365).toISOString(),
        thumbnailUrl: `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200`,
        subscriberCount: 15000 * i,
        videoCount: 85 * i,
        viewCount: 1200000 * i,
        website: `https://${cleanQuery.toLowerCase()}${i}.com`,
        rawPayload: { mock: true, query: params.query },
      });
    }

    return { channels: mockChannels, quotaReached: false };
  }
}

export const youtubeDiscoveryService = new YouTubeDiscoveryService();
