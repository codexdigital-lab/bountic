create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'bounty_status') then
    create type public.bounty_status as enum ('OPEN', 'LOCKED', 'PAID');
  end if;

  if not exists (select 1 from pg_type where typname = 'funding_payment_status') then
    create type public.funding_payment_status as enum ('PENDING', 'SUCCESS');
  end if;

  if not exists (select 1 from pg_type where typname = 'payout_status') then
    create type public.payout_status as enum ('PENDING', 'SUCCESS', 'FAILED');
  end if;
end;
$$;

create table if not exists public.users (
  github_username text primary key,
  locus_wallet_address text,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.bounties (
  issue_id text primary key,
  status public.bounty_status not null default 'OPEN',
  total_amount double precision not null default 0,
  ledger_comment_id text,
  funded_by_agent boolean not null default false,
  payout_tx_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bounties_total_amount_non_negative check (total_amount >= 0)
);

create table if not exists public.funding_events (
  id uuid primary key default gen_random_uuid(),
  issue_id text not null references public.bounties(issue_id) on delete cascade,
  funder_username text not null,
  amount double precision not null,
  locus_checkout_id text not null,
  payment_status public.funding_payment_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  constraint funding_events_amount_positive check (amount > 0)
);

create table if not exists public.payout_events (
  id uuid primary key default gen_random_uuid(),
  issue_id text not null references public.bounties(issue_id) on delete cascade,
  recipient_username text not null,
  amount double precision not null,
  locus_transaction_id text,
  transaction_hash text,
  status public.payout_status not null default 'PENDING',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint payout_events_amount_positive check (amount > 0)
);

create index if not exists bounties_status_idx on public.bounties(status);
create index if not exists bounties_total_amount_idx on public.bounties(total_amount desc);
create index if not exists bounties_funded_by_agent_idx on public.bounties(funded_by_agent);
create index if not exists funding_events_issue_id_idx on public.funding_events(issue_id);
create index if not exists funding_events_payment_status_idx on public.funding_events(payment_status);
create unique index if not exists funding_events_locus_checkout_id_idx
  on public.funding_events(locus_checkout_id);
create index if not exists payout_events_issue_id_idx on public.payout_events(issue_id);
create index if not exists payout_events_recipient_username_idx
  on public.payout_events(recipient_username);

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists bounties_set_updated_at on public.bounties;
create trigger bounties_set_updated_at
before update on public.bounties
for each row
execute function public.set_updated_at_timestamp();

alter table public.users enable row level security;
alter table public.bounties enable row level security;
alter table public.funding_events enable row level security;
alter table public.payout_events enable row level security;

drop policy if exists bounties_select_public on public.bounties;
create policy bounties_select_public
  on public.bounties
  for select
  using (true);

drop policy if exists users_select_self_by_email on public.users;
create policy users_select_self_by_email
  on public.users
  for select
  using (email = (auth.jwt() ->> 'email'));

drop policy if exists users_update_self_by_email on public.users;
create policy users_update_self_by_email
  on public.users
  for update
  using (email = (auth.jwt() ->> 'email'))
  with check (email = (auth.jwt() ->> 'email'));

drop policy if exists users_insert_self_by_email on public.users;
create policy users_insert_self_by_email
  on public.users
  for insert
  with check (email = (auth.jwt() ->> 'email'));

drop policy if exists payout_events_select_self on public.payout_events;
create policy payout_events_select_self
  on public.payout_events
  for select
  using (
    exists (
      select 1
      from public.users
      where users.github_username = payout_events.recipient_username
        and users.email = (auth.jwt() ->> 'email')
    )
  );
