  BEGIN;

  -- 用于 gen_random_uuid()
  CREATE EXTENSION IF NOT EXISTS pgcrypto;

  -- ========== users ==========
  CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    nickname text,
    avatar_url text,
    role text NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
    status text NOT NULL DEFAULT 'active' CHECK (status IN
  ('active','suspended','deleted')),
    locale text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );

  -- ========== account_groups ==========
  CREATE TABLE IF NOT EXISTS account_groups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    provider text NOT NULL,
    strategy text NOT NULL CHECK (strategy IN
  ('round_robin','weighted','least_load','failover')),
    default_region text,
    default_models jsonb NOT NULL DEFAULT '{}'::jsonb,
    is_active bool NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );

  -- ========== provider_accounts ==========
  CREATE TABLE IF NOT EXISTS provider_accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider text NOT NULL,
    name text,
    region text,
    allowed_models jsonb NOT NULL DEFAULT '[]'::jsonb,
    credential_ref text,
    encrypted_credentials jsonb,
    max_concurrency int CHECK (max_concurrency >= 0),
    max_rpm int CHECK (max_rpm >= 0),
    max_tpm int CHECK (max_tpm >= 0),
    daily_tokens_limit bigint CHECK (daily_tokens_limit >= 0),
    weight int NOT NULL DEFAULT 1 CHECK (weight >= 0),
    priority int NOT NULL DEFAULT 0,
    is_active bool NOT NULL DEFAULT true,
    group_id uuid REFERENCES account_groups(id) ON DELETE SET NULL,
    status text NOT NULL DEFAULT 'healthy' CHECK (status IN
  ('healthy','degraded','down','cooldown')),
    last_error text,
    cooldown_until timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_provider_accounts_provider ON
  provider_accounts(provider);
  CREATE INDEX IF NOT EXISTS idx_provider_accounts_group ON
  provider_accounts(group_id);
  CREATE INDEX IF NOT EXISTS idx_provider_accounts_active ON
  provider_accounts(is_active);

  -- ========== packages ==========
  CREATE TABLE IF NOT EXISTS packages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    version text NOT NULL,
    description text,
    price_cents int NOT NULL CHECK (price_cents >= 0),
    currency text NOT NULL DEFAULT 'USD',
    daily_points int NOT NULL CHECK (daily_points >= 0),
    plan_type text NOT NULL CHECK (plan_type IN ('basic','pro','enterprise')),
    valid_days int CHECK (valid_days > 0),
    features jsonb NOT NULL DEFAULT '{}'::jsonb,
    limitations jsonb NOT NULL DEFAULT '{}'::jsonb,
    is_active bool NOT NULL DEFAULT true,
    sort_order int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (name, version)
  );
  CREATE INDEX IF NOT EXISTS idx_packages_active ON packages(is_active);

  -- ========== orders ==========
  CREATE TABLE IF NOT EXISTS orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_no text UNIQUE NOT NULL,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status text NOT NULL DEFAULT 'created'
      CHECK (status IN ('created','paid','canceled','failed','refunded')),
    amount_cents int NOT NULL CHECK (amount_cents >= 0),
    currency text NOT NULL,
    product_type text NOT NULL CHECK (product_type IN ('package','credits')),
    package_id uuid REFERENCES packages(id) ON DELETE RESTRICT,
    credits_points int CHECK (credits_points >= 0),
    payment_provider text,
    payment_session_id text,
    paid_at timestamptz,
    details jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
  CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
  CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

  -- ========== wallets ==========
  CREATE TABLE IF NOT EXISTS wallets (
    user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE RESTRICT,
    package_daily_quota_tokens bigint NOT NULL DEFAULT 0 CHECK
  (package_daily_quota_tokens >= 0),
    package_tokens_remaining bigint NOT NULL DEFAULT 0 CHECK
  (package_tokens_remaining >= 0),
    package_reset_at timestamptz,
    independent_tokens bigint NOT NULL DEFAULT 0 CHECK (independent_tokens >= 0),
    locked_tokens bigint NOT NULL DEFAULT 0 CHECK (locked_tokens >= 0),
    version int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );

  -- ========== api_keys ==========
  CREATE TABLE IF NOT EXISTS api_keys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    key_hash text UNIQUE NOT NULL,
    prefix text NOT NULL,
    name text,
    status text NOT NULL DEFAULT 'active' CHECK (status IN
  ('active','disabled','deleted')),
    expires_at timestamptz,
    meta jsonb NOT NULL DEFAULT '{}'::jsonb,
    last_used_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_api_keys_owner ON api_keys(owner_user_id);
  CREATE INDEX IF NOT EXISTS idx_api_keys_status ON api_keys(status);

  -- ========== user_packages ==========
  CREATE TABLE IF NOT EXISTS user_packages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    package_id uuid NOT NULL REFERENCES packages(id) ON DELETE RESTRICT,
    order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
    start_at timestamptz NOT NULL,
    end_at timestamptz NOT NULL,
    daily_points int NOT NULL CHECK (daily_points >= 0),
    daily_quota_tokens bigint NOT NULL CHECK (daily_quota_tokens >= 0),
    is_active bool NOT NULL DEFAULT true,
    package_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_user_packages_user_active ON
  user_packages(user_id, is_active);
  CREATE INDEX IF NOT EXISTS idx_user_packages_user_time ON user_packages(user_id,
  start_at, end_at);

  -- ========== usage_records ==========
  CREATE TABLE IF NOT EXISTS usage_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id text UNIQUE NOT NULL,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    api_key_id uuid REFERENCES api_keys(id) ON DELETE SET NULL,
    provider text NOT NULL,
    model text NOT NULL,
    prompt_tokens int NOT NULL DEFAULT 0 CHECK (prompt_tokens >= 0),
    completion_tokens int NOT NULL DEFAULT 0 CHECK (completion_tokens >= 0),
    cache_tokens int NOT NULL DEFAULT 0 CHECK (cache_tokens >= 0),
    total_tokens int NOT NULL DEFAULT 0 CHECK (total_tokens >= 0),
    tokens_charged int NOT NULL DEFAULT 0 CHECK (tokens_charged >= 0),
    points_charged int NOT NULL DEFAULT 0 CHECK (points_charged >= 0),
    bucket_package_tokens int NOT NULL DEFAULT 0 CHECK (bucket_package_tokens >=
  0),
    bucket_independent_tokens int NOT NULL DEFAULT 0 CHECK
  (bucket_independent_tokens >= 0),
    status text NOT NULL CHECK (status IN ('success','partial','fail','canceled')),
    error_code text,
    latency_ms int,
    meta jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_usage_records_user ON usage_records(user_id);
  CREATE INDEX IF NOT EXISTS idx_usage_records_api_key ON
  usage_records(api_key_id);
  CREATE INDEX IF NOT EXISTS idx_usage_records_created_at ON
  usage_records(created_at);

  -- ========== credit_transactions ==========
  CREATE TABLE IF NOT EXISTS credit_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    type text NOT NULL CHECK (type IN ('income','expense','adjustment','reset')),
    bucket text NOT NULL CHECK (bucket IN ('package','independent','mixed','none')),
    tokens int NOT NULL,  -- 可正可负
    points int NOT NULL,  -- 可正可负
    before_package_tokens bigint,
    after_package_tokens bigint,
    before_independent_tokens bigint,
    after_independent_tokens bigint,
    request_id text,
    order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
    reason text,
    meta jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_credit_tx_user ON credit_transactions(user_id);
  CREATE INDEX IF NOT EXISTS idx_credit_tx_created_at ON
  credit_transactions(created_at);
  CREATE INDEX IF NOT EXISTS idx_credit_tx_order ON credit_transactions(order_id);
  CREATE INDEX IF NOT EXISTS idx_credit_tx_request ON
  credit_transactions(request_id);

  -- ========== rate_limit_policies ==========
  CREATE TABLE IF NOT EXISTS rate_limit_policies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_type text NOT NULL CHECK (subject_type IN ('user','api_key')),
    subject_id uuid NOT NULL,
    window_minutes int CHECK (window_minutes > 0),
    max_requests int CHECK (max_requests >= 0),
    max_tokens int CHECK (max_tokens >= 0),
    max_points int CHECK (max_points >= 0),
    daily_points_limit int CHECK (daily_points_limit >= 0),
    weekly_model_points_limit jsonb NOT NULL DEFAULT '{}'::jsonb,
    enabled bool NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (subject_type, subject_id)
  );
  CREATE INDEX IF NOT EXISTS idx_rl_policies_enabled ON
  rate_limit_policies(enabled);

  -- ========== admin_audit_logs ==========
  CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    action text NOT NULL,
    target_type text NOT NULL,
    target_id text NOT NULL,
    before jsonb,
    after jsonb,
    ip text,
    created_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_admin_audit_admin ON
  admin_audit_logs(admin_user_id);
  CREATE INDEX IF NOT EXISTS idx_admin_audit_created_at ON
  admin_audit_logs(created_at);

  -- ========== oauth_sessions ==========
  CREATE TABLE IF NOT EXISTS oauth_sessions (
    session_id text PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    type text NOT NULL,
    data jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_oauth_sessions_user ON oauth_sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_oauth_sessions_expires ON
  oauth_sessions(expires_at);

  COMMIT;