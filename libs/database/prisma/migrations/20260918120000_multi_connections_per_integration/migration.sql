-- Allow multiple WorkspaceConnection rows per integration within a workspace.
DROP INDEX IF EXISTS "WorkspaceConnection_workspaceId_integrationId_key";

CREATE INDEX IF NOT EXISTS "WorkspaceConnection_workspaceId_integrationId_idx"
  ON "WorkspaceConnection"("workspaceId", "integrationId");
