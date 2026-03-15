-- CastFlow Initial Schema

-- Episodes
create table if not exists episodes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  audio_url text not null,
  duration_seconds integer,
  status text not null default 'uploaded',
  created_at timestamptz not null default now(),
  user_id text not null default 'default'
);

-- Transcripts
create table if not exists transcripts (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references episodes(id) on delete cascade,
  full_text text not null,
  segments jsonb not null default '[]',
  language text not null default 'zh-TW',
  created_at timestamptz not null default now()
);

create index if not exists idx_transcripts_episode_id on transcripts(episode_id);

-- Writing Rules
create table if not exists writing_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  scope text not null default 'global',
  platform text,
  content text not null,
  user_id text not null default 'default',
  created_at timestamptz not null default now()
);

-- Style DNAs
create table if not exists style_dnas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  platform text not null,
  dimensions jsonb not null default '{}',
  source_example_count integer not null default 0,
  extracted_at timestamptz not null default now(),
  user_id text not null default 'default'
);

-- Style Examples
create table if not exists style_examples (
  id uuid primary key default gen_random_uuid(),
  style_dna_id uuid not null references style_dnas(id) on delete cascade,
  platform text not null,
  content text not null,
  engagement jsonb not null default '{}',
  performance_tier text,
  published_at timestamptz,
  user_id text not null default 'default'
);

create index if not exists idx_style_examples_dna_id on style_examples(style_dna_id);

-- Platform Templates
create table if not exists platform_templates (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  name text not null,
  system_prompt text not null,
  format_rules text,
  user_id text not null default 'default',
  created_at timestamptz not null default now()
);

-- Contents (generated)
create table if not exists contents (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references episodes(id) on delete cascade,
  style_dna_id uuid references style_dnas(id) on delete set null,
  platform text not null,
  body text not null,
  media_urls jsonb not null default '[]',
  status text not null default 'draft',
  scheduled_at timestamptz,
  published_at timestamptz,
  user_id text not null default 'default'
);

create index if not exists idx_contents_episode_id on contents(episode_id);
create index if not exists idx_contents_status on contents(status);
create index if not exists idx_contents_scheduled_at on contents(scheduled_at) where status = 'scheduled';

-- Publish Logs
create table if not exists publish_logs (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references contents(id) on delete cascade,
  platform text not null,
  platform_post_id text,
  response jsonb,
  status text not null default 'pending',
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_publish_logs_content_id on publish_logs(content_id);
