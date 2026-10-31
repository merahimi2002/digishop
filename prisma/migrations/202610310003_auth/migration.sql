ALTER TABLE "User" ADD COLUMN "disabled" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
-- Better Auth flow payload is a user ID; the bearer identifier (purpose + token) is hashed.
ALTER TABLE "Verification" DROP CONSTRAINT "verification_hash_only";
ALTER TABLE "Verification" ADD CONSTRAINT "verification_identifier_hashed" CHECK(identifier ~ '^[a-f0-9]{64}$');
CREATE UNIQUE INDEX "Verification_identifier_key" ON "Verification"(identifier);
CREATE TABLE "RateLimit" (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 key TEXT NOT NULL UNIQUE,
 count INTEGER NOT NULL CHECK(count>=0),
 "lastRequest" BIGINT NOT NULL CHECK("lastRequest">=0)
);
CREATE INDEX "RateLimit_lastRequest_idx" ON "RateLimit"("lastRequest");
