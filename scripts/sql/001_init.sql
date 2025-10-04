-- Requires: Postgres with pgcrypto or gen_random_uuid via pgcrypto or pg_catalog
-- If gen_random_uuid() is unavailable, replace with uuid_generate_v4() from uuid-ossp extension.

create table if not exists emails (
  id uuid primary key default gen_random_uuid(),
  gmail_id text unique,
  from_addr text,
  subject text,
  date timestamptz,
  snippet text,
  html text,
  raw_headers jsonb,
  score int default 0,
  decision text check (decision in ('deliver','banner','quarantine')) default 'deliver',
  quarantined boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_emails_date on emails(date desc);

create table if not exists artifacts (
  id uuid primary key default gen_random_uuid(),
  email_id uuid not null references emails(id) on delete cascade,
  type text not null,
  value text not null,
  risk int default 0,
  created_at timestamptz default now()
);

create index if not exists idx_artifacts_email on artifacts(email_id);

create table if not exists sandbox_runs (
  id uuid primary key default gen_random_uuid(),
  email_id uuid not null references emails(id) on delete cascade,
  safe_html text,
  created_at timestamptz default now()
);

create table if not exists gmail_accounts (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  access_token text not null,
  access_token_expires_at timestamptz,
  refresh_token text,
  scope text,
  token_type text,
  updated_at timestamptz default now()
);
