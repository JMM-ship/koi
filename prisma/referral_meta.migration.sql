-- Referral Program migration: meta table and unique index

-- 1) Lightweight meta table to track invite code change count per user
CREATE TABLE IF NOT EXISTS referral_meta (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  invite_code_changes INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2) Case-insensitive unique index for users.invite_code
-- Ensures global uniqueness irrespective of case
CREATE UNIQUE INDEX IF NOT EXISTS uk_users_invite_code_lower
ON users ((lower(invite_code)));

