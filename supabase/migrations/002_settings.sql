-- Settings key-value store (for Meta tokens, etc.)
create table if not exists settings (
  key text primary key,
  value jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
