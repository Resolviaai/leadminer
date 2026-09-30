-- 0015_daily_api_usage_and_jev_cache.sql
-- Global serverless atomic quota tracking and persistent Jev evaluation caching

CREATE TABLE IF NOT EXISTS daily_api_usage (
    id BIGSERIAL PRIMARY KEY,
    service VARCHAR(50) NOT NULL,
    usage_date VARCHAR(10) NOT NULL, -- e.g. 'YYYY-MM-DD' in America/Los_Angeles
    call_count INT NOT NULL DEFAULT 0,
    cache_hits INT NOT NULL DEFAULT 0,
    input_tokens BIGINT NOT NULL DEFAULT 0,
    output_tokens BIGINT NOT NULL DEFAULT 0,
    successful_calls INT NOT NULL DEFAULT 0,
    failed_calls INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_daily_api_usage_service_date UNIQUE (service, usage_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_api_usage_service_date ON daily_api_usage (service, usage_date);

CREATE TABLE IF NOT EXISTS jev_evaluations_cache (
    id BIGSERIAL PRIMARY KEY,
    cache_key VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 hash of normalized input + version
    question_set_version VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    source_type VARCHAR(100) DEFAULT 'youtube_description',
    state_snippet TEXT,
    evaluation JSONB NOT NULL,
    input_tokens INT NOT NULL DEFAULT 0,
    output_tokens INT NOT NULL DEFAULT 0,
    latency_ms INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jev_eval_cache_key ON jev_evaluations_cache (cache_key);
CREATE INDEX IF NOT EXISTS idx_jev_eval_created_at ON jev_evaluations_cache (created_at);
CREATE INDEX IF NOT EXISTS idx_jev_eval_model_version ON jev_evaluations_cache (model, question_set_version);
