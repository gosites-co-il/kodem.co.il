# Connection: Google Workspace

| Field | Value |
|-------|--------|
| **Id** | `google_workspace` |
| **Provider** | `google` |
| **Category** | productivity |
| **Status** | coming_soon |
| **Capabilities** | `email.read`, `email.send`, `calendar.read`, `calendar.write`, `drive.read`, `drive.write` |
| **Backs channels** | [Email](../channels/email.md) |

Gmail, Calendar, and Drive for a Workspace. Primary path to back the Email Channel with Google.

## Planned env

```env
GOOGLE_WORKSPACE_CLIENT_ID=
GOOGLE_WORKSPACE_CLIENT_SECRET=
GOOGLE_WORKSPACE_CALLBACK_URL=http://localhost:3000/api/connections/oauth/google/google_workspace/callback
```

Dedicated OAuth client (not login, not Sheets). Pattern matches other Google connections — see [`google-sheets.md`](google-sheets.md).

## Notes

- Reuses Google adapter + `googleConnectionClientConfig('google_workspace')` once scopes are added in `googleScopesFor`.
- Prefer shipping Email Channel wiring together with this Connection.
