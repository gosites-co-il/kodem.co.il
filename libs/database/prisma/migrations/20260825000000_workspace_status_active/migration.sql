-- Align workspace lifecycle with onboardingStatus as the setup gate.
-- New workspaces default to active; backfill legacy onboarding status rows.

ALTER TABLE "Workspace" ALTER COLUMN "status" SET DEFAULT 'active';

UPDATE "Workspace" SET "status" = 'active' WHERE "status" = 'onboarding';
