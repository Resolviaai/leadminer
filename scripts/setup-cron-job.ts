import { env } from '../src/config/env';

interface CronJobPayload {
  job: {
    url: string;
    title: string;
    enabled: boolean;
    saveResponses: boolean;
    schedule: {
      timezone: string;
      hours: number[];
      mdays: number[];
      minutes: number[];
      months: number[];
      wdays: number[];
    };
    requestMethod: number; // 0 = GET
    extendedData?: {
      headers?: Record<string, string>;
    };
  };
}

async function setupCronJobs() {
  const apiKey = env.CRON_JOB_API_KEY || '3sJ8LHnXlSjJulMx/VVDjfbG7f/J9Cv9/TRlaijHMUI=';
  const cronSecret = env.CRON_SECRET || '7d3a8f1e5c2b9a4d6f8e0b1c3a5d7e9f';
  const appUrl = env.APP_URL || 'https://leadminer-app.vercel.app';

  console.log(`Configuring cron jobs on cron-job.org for: ${appUrl}`);

  // 1. First fetch existing jobs
  const listRes = await fetch('https://api.cron-job.org/jobs', {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!listRes.ok) {
    throw new Error(`Failed to list cron jobs: ${listRes.status} ${await listRes.text()}`);
  }

  const listData = (await listRes.json()) as { jobs: Array<{ jobId: number; title: string; url: string }> };
  console.log(`Found ${listData.jobs.length} existing jobs on account.`);

  // Define our jobs
  const desiredJobs: Array<{
    title: string;
    path: string;
    minutes: number[];
    description: string;
  }> = [
    {
      title: 'LeadMiner Auto-Dispatcher',
      path: '/api/workers/dispatch',
      minutes: [0, 15, 30, 45], // Every 15 minutes
      description: 'Dispatches scheduled emails smoothly throughout the day',
    },
    {
      title: 'LeadMiner Linkpage Enrichment',
      path: '/api/workers/linkpage-enrichment',
      minutes: [5], // Once every hour at :05
      description: 'Continuously unrolls Linktree/Beacons pages to discover emails',
    },
  ];

  for (const dj of desiredJobs) {
    const targetUrl = `${appUrl}${dj.path}`;
    const existing = listData.jobs.find((j) => j.title === dj.title || j.url.includes(dj.path));

    const payload: CronJobPayload = {
      job: {
        url: targetUrl,
        title: dj.title,
        enabled: true,
        saveResponses: true,
        schedule: {
          timezone: 'UTC',
          hours: [-1],
          mdays: [-1],
          minutes: dj.minutes,
          months: [-1],
          wdays: [-1],
        },
        requestMethod: 0,
        extendedData: {
          headers: {
            Authorization: `Bearer ${cronSecret}`,
            'User-Agent': 'cron-job.org/LeadMiner',
          },
        },
      },
    };

    if (existing) {
      console.log(`Updating existing job #${existing.jobId} (${dj.title})...`);
      const updateRes = await fetch(`https://api.cron-job.org/jobs/${existing.jobId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (updateRes.ok) {
        console.log(`  ✅ Successfully updated job #${existing.jobId}`);
      } else {
        console.warn(`  ⚠️ Update failed: ${updateRes.status} ${await updateRes.text()}`);
      }
    } else {
      console.log(`Creating new job: "${dj.title}" (${targetUrl})...`);
      const createRes = await fetch('https://api.cron-job.org/jobs', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (createRes.ok) {
        const createData = await createRes.json();
        console.log(`  ✅ Successfully created job! Response:`, createData);
      } else {
        console.warn(`  ⚠️ Creation failed: ${createRes.status} ${await createRes.text()}`);
      }
    }
  }

  console.log('\n🎉 All cron jobs configured successfully!');
  process.exit(0);
}

setupCronJobs().catch((err) => {
  console.error('Failed to setup cron jobs:', err);
  process.exit(1);
});
