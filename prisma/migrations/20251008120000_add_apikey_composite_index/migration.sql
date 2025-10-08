-- Create composite index to speed up user API key listing and assignment
-- Safe to run multiple times due to IF NOT EXISTS
CREATE INDEX IF NOT EXISTS "idx_api_keys_owner_status_created"
ON "api_keys"("owner_user_id", "status", "created_at");

