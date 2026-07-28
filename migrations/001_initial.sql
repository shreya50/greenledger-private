create table if not exists claims (
  id text primary key,
  canonical_key text not null unique,
  status text not null check (status in ('verified', 'retired')),
  registry text not null,
  project_id text not null,
  project_name text not null,
  country text not null,
  methodology text not null,
  vintage text not null,
  serial_start text not null,
  serial_end text not null,
  estimated_tco2e numeric not null check (estimated_tco2e >= 0),
  source_url text not null,
  source_hash_sha256 text not null,
  source_type text not null,
  citations jsonb not null default '[]'::jsonb,
  fixture_note text,
  verified_by text not null,
  verified_at timestamptz not null,
  retired_by text,
  retired_at timestamptz,
  onchain_status text not null default 'not-configured',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists claims_project_lookup on claims (registry, project_id);
create index if not exists claims_status_lookup on claims (status);
