export interface YouTubeSearchParams {
  query: string;
  maxResults?: number;
  pageToken?: string;
  regionCode?: string;
  relevanceLanguage?: string;
}

export interface YouTubeChannelSearchResult {
  channelId: string;
  title: string;
  description: string;
  publishedAt?: string;
  thumbnailUrl?: string;
}

export interface YouTubeChannelDetails {
  channelId: string;
  title: string;
  description: string;
  customUrl?: string;
  publishedAt?: string;
  thumbnailUrl?: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  website?: string;
  country?: string;
  rawPayload: any;
}

export interface QuotaState {
  searchCallsDailyLimit: number;
  searchCallsUsedToday: number;
  generalQuotaDailyLimit: number;
  generalQuotaUsedToday: number;
  lastResetPt: string;
}
