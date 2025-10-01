-- Aggregates schema for usage and cost (public schema)

-- Usage aggregates: tokens/requests per time bucket
create table if not exists public.usage_aggregates (
  api_key_id uuid not null,
  account_id uuid,
  model text not null,
  granularity text not null check (granularity in ('h','d','m')),
  bucket_at timestamptz not null,
  input_tokens  bigint not null default 0 check (input_tokens  >= 0),
  output_tokens bigint not null default 0 check (output_tokens >= 0),
  cache_tokens  bigint not null default 0 check (cache_tokens  >= 0),
  all_tokens    bigint not null default 0 check (all_tokens    >= 0),
  requests      bigint not null default 0 check (requests      >= 0),
  constraint usage_aggregates_pkey
    primary key (api_key_id, model, granularity, bucket_at),
  constraint usage_aggregates_api_key_id_fkey
    foreign key (api_key_id) references public.api_keys(id) on delete cascade,
  constraint usage_aggregates_account_id_fkey
    foreign key (account_id) references public.provider_accounts(id) on delete set null
);

create index if not exists idx_usage_aggs_api_bucket
  on public.usage_aggregates (api_key_id, granularity, bucket_at desc);
create index if not exists idx_usage_aggs_model_bucket
  on public.usage_aggregates (model, granularity, bucket_at desc);
create index if not exists idx_usage_aggs_account_bucket
  on public.usage_aggregates (account_id, granularity, bucket_at desc) where account_id is not null;

-- Cost aggregates: monetary cost per time bucket (e.g., USD)
create table if not exists public.cost_aggregates (
  api_key_id uuid not null,
  granularity text not null check (granularity in ('h','d','m','w')),
  bucket_at timestamptz not null,
  amount numeric(20,6) not null default 0 check (amount >= 0),
  constraint cost_aggregates_pkey
    primary key (api_key_id, granularity, bucket_at),
  constraint cost_aggregates_api_key_id_fkey
    foreign key (api_key_id) references public.api_keys(id) on delete cascade
);

create index if not exists idx_cost_aggs_api_bucket
  on public.cost_aggregates (api_key_id, granularity, bucket_at desc);

-- RPC function for additive upsert into usage_aggregates
create or replace function public.increment_usage_aggregates(
  p_api_key_id uuid,
  p_model text,
  p_granularity text,
  p_bucket_at timestamptz,
  p_input_tokens bigint,
  p_output_tokens bigint,
  p_cache_tokens bigint,
  p_all_tokens bigint,
  p_requests bigint
) returns void language sql as $$
insert into public.usage_aggregates (
  api_key_id, model, granularity, bucket_at,
  input_tokens, output_tokens, cache_tokens, all_tokens, requests
) values (
  p_api_key_id, p_model, p_granularity, p_bucket_at,
  p_input_tokens, p_output_tokens, p_cache_tokens, p_all_tokens, p_requests
)
on conflict (api_key_id, model, granularity, bucket_at)
do update set
  input_tokens  = public.usage_aggregates.input_tokens  + excluded.input_tokens,
  output_tokens = public.usage_aggregates.output_tokens + excluded.output_tokens,
  cache_tokens  = public.usage_aggregates.cache_tokens  + excluded.cache_tokens,
  all_tokens    = public.usage_aggregates.all_tokens    + excluded.all_tokens,
  requests      = public.usage_aggregates.requests      + excluded.requests;
$$;

