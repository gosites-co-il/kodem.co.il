# Connection: Google Workspace

| Field | Value |
|-------|--------|
| **Id** | `google_workspace` |
| **Provider** | `google` |
| **Category** | productivity |
| **Status** | **available** |
| **Capabilities** | `email.read`, `email.send` (OAuth today); calendar/drive reserved |
| **Backs channels** | [Email](../channels/email.md) |

Gmail OAuth for a Workspace. Primary path to back the Email Channel.

Parent overview: [`../connections-and-channels.md`](../connections-and-channels.md).

## Env

```env
GOOGLE_WORKSPACE_CLIENT_ID=
GOOGLE_WORKSPACE_CLIENT_SECRET=
GOOGLE_WORKSPACE_CALLBACK_URL=http://localhost:3000/api/connections/oauth/google/google_workspace/callback
APP_URL=http://localhost:3000
```

Dedicated OAuth client (not login, not Sheets). Azure: `OAUTH_GOOGLE_WORKSPACE_CLIENT_ID` / `_SECRET`.

## Enable APIs

1. **Gmail API**

## Install (local)

1. Web OAuth client; redirect:

   ```
   http://localhost:3000/api/connections/oauth/google/google_workspace/callback
   ```

2. Connect from **חיבורים** → detail `/workspace/integrations/connections/google_workspace`.
3. **בדוק חיבור** validates token refresh.
4. Open **ערוצים** → Email → **הגדר עם …** (links the Workspace connection).
5. **שלח** / **טען תיבה** call Gmail via the bound connection token.

## Scopes (current)

- `openid`, `email`, `profile`
- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/gmail.send`

## Notes

- No spreadsheet/property bind — the Google account is the resource.
- Email Channel send/list uses this connection’s access token (`libs/integrations/.../gmail.ts`).

## Roadmap

- Calendar / Drive scopes when needed
- Deeper mailbox UX on the [Email Channel](../channels/email.md)
