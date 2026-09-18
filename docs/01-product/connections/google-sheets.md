# Connection: Google Sheets

| Field | Value |
|-------|--------|
| **Id** | `google_sheets` |
| **Provider** | `google` |
| **Category** | productivity |
| **Status** | **available** |
| **Capabilities** | `sheets.read`, `sheets.write` |
| **Backs channels** | — |

Read and write spreadsheets for a Workspace. Shared files work if the OAuth Google account has access.

Parent overview: [`../connections-and-channels.md`](../connections-and-channels.md).

## Env

```env
CONNECTION_CREDENTIALS_KEY=<openssl rand -base64 32>
GOOGLE_SHEETS_CLIENT_ID=
GOOGLE_SHEETS_CLIENT_SECRET=
GOOGLE_SHEETS_CALLBACK_URL=http://localhost:3000/api/connections/oauth/google/google_sheets/callback
APP_URL=http://localhost:3000
```

Dedicated OAuth client — do **not** reuse login `GOOGLE_CLIENT_ID`.

Azure (GitHub Environment): `OAUTH_GOOGLE_SHEETS_CLIENT_ID`, `OAUTH_GOOGLE_SHEETS_CLIENT_SECRET`, `CONNECTION_CREDENTIALS_KEY`.

## Install (local)

1. [Google Cloud Console](https://console.cloud.google.com/) → project → enable **Google Sheets API** (and Drive API if needed).
2. Create **Web** OAuth client (separate from Sign-In).
3. Authorized redirect URI (exact):

   ```
   http://localhost:3000/api/connections/oauth/google/google_sheets/callback
   ```

   Prod / dev:

   ```
   https://app.kodem.co.il/api/connections/oauth/google/google_sheets/callback
   https://app.dev.kodem.co.il/api/connections/oauth/google/google_sheets/callback
   ```

4. Paste Client ID / Secret into `.env`.
5. Consent screen in Testing → add test users.
6. Run api + app; open **Settings → חיבורים** → Connect Google Sheets.
7. Paste a spreadsheet URL → **קשר קובץ** → pick tab → preview.

## APIs (after connect)

| Method | Route | Permission |
|--------|-------|------------|
| POST | `/api/connections/:id/resource` | `connections:manage` |
| GET | `/api/connections/:id/sheets` | `connections:use` |
| GET | `/api/connections/:id/preview?sheet=` | `connections:use` |
| POST | `/api/connections/:id/test` | `connections:manage` |

OAuth callback: `{APP_URL}/api/connections/oauth/google/google_sheets/callback`

Metadata on the connection: `{ spreadsheetId, spreadsheetTitle?, lastBoundAt? }`.

## Scopes

- `https://www.googleapis.com/auth/spreadsheets`
- `https://www.googleapis.com/auth/drive.file`

## Code

| Area | Path |
|------|------|
| Catalog | `libs/platform/catalog` |
| OAuth / Sheets client | `libs/integrations/src/lib/google/` |
| Domain | `libs/platform/connections` |
| API | `apps/api/src/app/connections/` |
| UI | `apps/app/src/components/integrations/connections-catalog-view.tsx` |

## Common errors

| Symptom | Fix |
|---------|-----|
| `redirect_uri_mismatch` | Register the exact callback on the **Sheets** OAuth client |
| אין גישה לגיליון | Share the file with the connected Google account |
| לא נבחר גיליון | Bind a URL after OAuth |
| Decrypt errors | `CONNECTION_CREDENTIALS_KEY` changed — restore key or reconnect |

## Roadmap

- CRM import / column mapping
- Google Picker
- Recurring sync
