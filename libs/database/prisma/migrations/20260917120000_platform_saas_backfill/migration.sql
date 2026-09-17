-- Idempotent SaaS foundation data backfills

-- Grandfather existing users as email-verified so nobody is locked out.
UPDATE "User"
SET "emailVerifiedAt" = COALESCE("emailVerifiedAt", "createdAt")
WHERE "emailVerifiedAt" IS NULL;

-- Ensure every workspace has an ACTIVE FREE subscription.
INSERT INTO "Subscription" (
  "id",
  "workspaceId",
  "planId",
  "status",
  "currentPeriodStart",
  "currentPeriodEnd",
  "createdAt",
  "updatedAt"
)
SELECT
  'sub_' || gen_random_uuid()::text,
  w."id",
  'free',
  'active',
  NOW(),
  NOW() + INTERVAL '30 days',
  NOW(),
  NOW()
FROM "Workspace" w
WHERE NOT EXISTS (
  SELECT 1 FROM "Subscription" s WHERE s."workspaceId" = w."id"
);

-- Map setupData.modules.activated[] → WorkspaceModule ENABLED rows.
INSERT INTO "WorkspaceModule" (
  "id",
  "workspaceId",
  "moduleId",
  "status",
  "enabledAt",
  "createdAt",
  "updatedAt"
)
SELECT
  'wmod_' || gen_random_uuid()::text,
  w."id",
  module_id,
  'ENABLED',
  NOW(),
  NOW(),
  NOW()
FROM "Workspace" w
CROSS JOIN LATERAL (
  SELECT jsonb_array_elements_text(
    CASE
      WHEN w."setupData" IS NULL OR btrim(w."setupData") = '' THEN '[]'::jsonb
      WHEN jsonb_typeof(w."setupData"::jsonb -> 'modules' -> 'activated') = 'array'
        THEN w."setupData"::jsonb -> 'modules' -> 'activated'
      ELSE '[]'::jsonb
    END
  ) AS module_id
) activated
WHERE module_id IS NOT NULL
  AND btrim(module_id) <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM "WorkspaceModule" wm
    WHERE wm."workspaceId" = w."id"
      AND wm."moduleId" = module_id
  );

-- Default free modules for workspaces that still have none after setupData migrate.
INSERT INTO "WorkspaceModule" (
  "id",
  "workspaceId",
  "moduleId",
  "status",
  "enabledAt",
  "createdAt",
  "updatedAt"
)
SELECT
  'wmod_' || gen_random_uuid()::text,
  w."id",
  m.module_id,
  'ENABLED',
  NOW(),
  NOW(),
  NOW()
FROM "Workspace" w
CROSS JOIN (
  VALUES
    ('crm'),
    ('knowledge'),
    ('insights'),
    ('digital_card')
) AS m(module_id)
WHERE NOT EXISTS (
  SELECT 1 FROM "WorkspaceModule" wm WHERE wm."workspaceId" = w."id"
)
AND NOT EXISTS (
  SELECT 1
  FROM "WorkspaceModule" wm
  WHERE wm."workspaceId" = w."id"
    AND wm."moduleId" = m.module_id
);
