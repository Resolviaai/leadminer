const https = require('https');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync(path.join(__dirname, '..', '.env')));

const token = envConfig.VERCEL_TOKEN || 'vcp_8HmX9GYiwm3guT8XlmHSVoeKVyzRB4V7WcDTt954pfg6oEDOan1GVh9r';
const teamId = 'team_XgCca3cVgNDjuuA6QJleQ3gE';
const projectId = 'prj_Uq6GURB532ocd3jipydGlo6YJgW0';
const repoId = '1371265090';

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch(e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function main() {
  console.log('Fetching env vars from Vercel...');
  const res = await request({
    hostname: 'api.vercel.com',
    path: `/v9/projects/${projectId}/env?teamId=${teamId}`,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!res.data.envs) {
    console.error('Failed to get env vars:', res);
    return;
  }

  console.log(`Found ${res.data.envs.length} env vars on Vercel. Updating values...`);

  for (const envVar of res.data.envs) {
    const key = envVar.key;
    const value = envConfig[key];

    if (value !== undefined && value !== '') {
      const patchRes = await request({
        hostname: 'api.vercel.com',
        path: `/v9/projects/${projectId}/env/${envVar.id}?teamId=${teamId}`,
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }, {
        value: String(value)
      });

      if (patchRes.status === 200) {
        console.log(`✅ ${key} updated successfully.`);
      } else {
        console.warn(`⚠️ Failed to update ${key}:`, patchRes.data);
      }
    } else {
      console.log(`⏩ Skipping ${key} (no value set in local .env)`);
    }
  }

  console.log('\n🚀 Triggering redeployment on Vercel with new environment variables...');
  const deployRes = await request({
    hostname: 'api.vercel.com',
    path: `/v13/deployments?teamId=${teamId}`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, {
    name: 'leadminer',
    project: projectId,
    target: 'production',
    gitSource: {
      type: 'github',
      repoId: repoId,
      ref: 'main'
    }
  });

  if (deployRes.status === 200) {
    console.log('🎉 Deployment triggered successfully!');
    console.log('Deployment ID:', deployRes.data.id);
    console.log('Deployment URL: https://' + deployRes.data.url);
    console.log('Check status at:', deployRes.data.inspectorUrl);
  } else {
    console.error('❌ Redeploy failed:', deployRes.data);
  }
}

main().catch(console.error);
