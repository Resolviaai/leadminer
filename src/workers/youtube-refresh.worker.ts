import { db } from '../db/client';
import { leads } from '../db/schema';
import { lt, or, isNull, eq } from 'drizzle-orm';
import { YouTubeDiscoveryService } from '../services/youtube/discovery.service';
import { YouTubeChannelDetails } from '../services/youtube/types';
import { jobRunner } from '../services/jobs/job.runner';
import { sequenceService } from '../services/outreach/sequence.service';

/**
 * YouTube API Services Developer Policy Compliance Refresh Worker (D10 / YLD-13).
 *
 * Requirements:
 * Stored API data from YouTube must be refreshed at least every 30 days or deleted.
 * This worker selects channels stored >25 days ago that have not been refreshed in 25 days,
 * queries YouTube channels.list in efficient 50-channel batches (1 quota unit per batch),
 * updates stats/metadata, marks refreshed_at, and handles deleted/terminated channels.
 */
export async function runYouTubeDataRefresh(batchLimit = 50): Promise<{
  processed: number;
  refreshed: number;
  deletedOrTerminated: number;
  quotaReached: boolean;
}> {
  const twentyFiveDaysAgo = new Date(Date.now() - 25 * 24 * 60 * 60 * 1000);

  // 1. Fetch leads requiring refresh
  const staleLeads = await db
    .select({
      id: leads.id,
      channelId: leads.channelId,
      channelTitle: leads.channelTitle,
    })
    .from(leads)
    .where(
      or(
        isNull(leads.refreshedAt),
        lt(leads.refreshedAt, twentyFiveDaysAgo)
      )
    )
    .limit(batchLimit);

  if (staleLeads.length === 0) {
    return { processed: 0, refreshed: 0, deletedOrTerminated: 0, quotaReached: false };
  }

  const jobId = await jobRunner.createJob('YOUTUBE_DATA_REFRESH', { batchLimit });

  try {
    await jobRunner.logEvent(jobId, 'JOB_STARTED', 'INFO', `Starting YouTube 25-day data compliance refresh for ${staleLeads.length} lead(s)`);

    const discoveryService = new YouTubeDiscoveryService();
    const channelIds = staleLeads.map((l) => l.channelId);

    const { channels, quotaReached } = await discoveryService.enrichChannelsBatch(channelIds);

    // P0-5: If quota was reached or the batch request failed entirely, abort without any lead mutations.
    // Only proceed if the batch succeeded (quotaReached === false).
    if (quotaReached) {
      await jobRunner.logEvent(jobId, 'JOB_COMPLETED', 'WARN',
        `YouTube refresh aborted — API quota reached. No leads modified. Retry when quota resets.`
      );
      await jobRunner.completeJob(jobId, 0);
      return { processed: staleLeads.length, refreshed: 0, deletedOrTerminated: 0, quotaReached: true };
    }

    const returnedMap = new Map<string, YouTubeChannelDetails>(channels.map((c) => [c.channelId, c]));
    let refreshedCount = 0;
    let deletedCount = 0;

    for (const lead of staleLeads) {
      const freshData = returnedMap.get(lead.channelId);

      if (freshData) {
        // Channel is active: update metadata, subscriber counts, and refresh timestamp
        await db
          .update(leads)
          .set({
            channelTitle: freshData.title,
            description: freshData.description,
            subscriberCount: freshData.subscriberCount,
            videoCount: freshData.videoCount,
            viewCount: freshData.viewCount,
            thumbnailUrl: freshData.thumbnailUrl || null,
            refreshedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(leads.id, lead.id));

        refreshedCount++;
      } else {
        // Channel not in results — confirm with a dedicated single-channel query before disqualifying
        // This prevents false positives from partial batch failures
        let confirmedGone = false;
        try {
          const { channels: singleCheck, quotaReached: singleQuota } =
            await discoveryService.enrichChannelsBatch([lead.channelId]);
          if (!singleQuota && singleCheck.length === 0) {
            confirmedGone = true;
          }
        } catch (verifyErr: any) {
          console.warn(`[YouTube Refresh] Single-channel verification failed for ${lead.channelId}: ${verifyErr.message}. Skipping disqualification.`);
        }

        if (!confirmedGone) {
          // Could not confirm — skip to avoid false positive deletion
          console.warn(`[YouTube Refresh] Channel ${lead.channelId} not in batch results but single-check inconclusive. Skipping.`);
          continue;
        }

        // Channel was deleted or terminated on YouTube: disqualify and cancel any active sequences
        console.warn(`[YouTube Refresh] Channel ${lead.channelId} (${lead.channelTitle}) confirmed gone from YouTube. Disqualifying.`);
        await db
          .update(leads)
          .set({
            qualificationStatus: 'DISQUALIFIED',
            outreachStatus: 'BOUNCED',
            refreshedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(leads.id, lead.id));

        try {
          await sequenceService.cancelSequenceForLead(lead.id, 'CANCELLED_OPT_OUT');
        } catch (e: any) {
          // non-fatal
        }

        deletedCount++;
      }
    }

    await jobRunner.completeJob(jobId, refreshedCount);
    await jobRunner.logEvent(
      jobId,
      'JOB_COMPLETED',
      'INFO',
      `YouTube refresh complete: ${refreshedCount} updated, ${deletedCount} deleted/disqualified. Quota reached: ${quotaReached}`
    );

    return {
      processed: staleLeads.length,
      refreshed: refreshedCount,
      deletedOrTerminated: deletedCount,
      quotaReached,
    };
  } catch (error: any) {
    console.error('[YouTube Refresh] Error during refresh job:', error.message);
    await jobRunner.failJob(jobId, error.message);
    throw error;
  }
}
