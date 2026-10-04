-- Migration 0019: Discovered Channel Staging for Zero-Waste YouTube API Quota Management

CREATE TABLE IF NOT EXISTS discovered_channel_staging (
  id BIGSERIAL PRIMARY KEY,
  keyword_id BIGINT REFERENCES keywords(id) ON DELETE CASCADE,
  channel_id VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_channel_staging_keyword_channel ON discovered_channel_staging (keyword_id, channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_staging_status_created ON discovered_channel_staging (status, created_at);
CREATE INDEX IF NOT EXISTS idx_channel_staging_channel_id ON discovered_channel_staging (channel_id);
