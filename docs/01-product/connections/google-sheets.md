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
6. Run api + app; open **Settings → חיבורים** (or `/workspace/integrations/connections`) → Connect Google Sheets (חיבור מלא or קריאה בלבד).
7. After OAuth, URL becomes `/workspace/integrations/connections/google_sheets` and the left detail sheet opens.
8. On each connection instance: Status (**מחובר**), **פעיל** switch, **בדוק חיבור**, permission badge.
9. With the instance **active**, paste a spreadsheet URL → **קשר קובץ** → pick tab → preview.
10. Map columns → **ייבא לאנשי קשר** (one-shot; requires CRM module).

## Connected vs active

| | Meaning | UI |
|---|---------|-----|
| **Connected** | Credentials stored (`status` `connected` or `inactive`) | Status pill **מחובר** |
| **Active** | Soft-enabled (`status === 'connected'`, DTO `active: true`) | Switch **פעיל** |
| **Inactive** | Soft-disabled; credentials kept | Switch **לא פעיל**; still **מחובר** |
| **Disconnected / delete** | Credentials removed | Delete icon when not active |

Bind, preview, sheets list, and token use require **active**. Inactive shows a banner and blocks file actions until re-enabled.

A workspace may have **multiple** Google Sheets connections (different Google accounts and/or access modes). Use **הוסף** on the catalog card to add another.

## APIs (after connect)

| Method | Route | Permission |
|--------|-------|------------|
| POST | `/api/connections/:id/resource` | `connections:manage` |
| GET | `/api/connections/:id/sheets` | `connections:use` |
| GET | `/api/connections/:id/preview?sheet=` | `connections:use` |
| POST | `/api/connections/:id/import/contacts` | `connections:use` + CRM module |
| POST | `/api/connections/:id/active` | `connections:manage` |
| POST | `/api/connections/:id/test` | `connections:manage` |

OAuth callback: `{APP_URL}/api/connections/oauth/google/google_sheets/callback`

Bound file is stored on each connection as `metadata`: `{ spreadsheetId, spreadsheetTitle?, lastBoundAt? }`.

## Scopes

**חיבור מלא**

- `https://www.googleapis.com/auth/spreadsheets`
- `https://www.googleapis.com/auth/drive.file`

**קריאה בלבד**

- `https://www.googleapis.com/auth/spreadsheets.readonly`

Connect UI: dropdown on **חבר** / **הוסף** → חיבור מלא | קריאה בלבד.

OAuth uses `include_granted_scopes=false` so a prior full grant on the same Google client does not widen a read-only request. If Google still shows edit permissions, revoke kodem under [Google Account → Third-party access](https://myaccount.google.com/connections) and reconnect.

## Code

| Area | Path |
|------|------|
| Catalog | `libs/platform/catalog` |
| OAuth / Sheets client | `libs/integrations/src/lib/google/` |
| Domain | `libs/platform/connections` |
| API | `apps/api/src/app/connections/` |
| UI | `apps/app/src/components/integrations/connections-catalog-view.tsx` |
| Routes | `apps/app/src/app/(app)/workspace/{integrations,settings}/connections/` (+ `[integrationId]`) |

## Common errors

| Symptom | Fix |
|---------|-----|
| `redirect_uri_mismatch` | Register the exact callback on the **Sheets** OAuth client |
| אין גישה לגיליון | Share the file with the connected Google account |
| לא נבחר גיליון | Bind a URL after OAuth |
| מחובר אך לא פעיל | Turn **פעיל** on before bind / preview |
| Decrypt errors | `CONNECTION_CREDENTIALS_KEY` changed — restore key or reconnect |

## Roadmap / TODO

Leave for later (do not block current Sheets connection work):

1. ~~**Column mapping → CRM**~~ **(done)** — Infer headers from preview, map to contact fields, one-shot import (`POST .../import/contacts`).
2. **Change / clear bound file** — Unbind or replace spreadsheet URL without deleting the OAuth connection.
3. **Expired / error recovery** — On `expired` / `error`, clear **חדש חיבור** that reuses the same connection instance.
4. **Primary tab** — Persist chosen sheet tab in `metadata` (not only for preview) so sync/import always target the right tab.
5. **Last checked / last used** — Show last successful test or API use on the connection card.
6. **Read-only guardrails** — Disable write-ish actions (and explain why) when capabilities are read-only.
7. **Recurring sync** — Worker job: pull rows on a schedule or on demand (needs mapping + primary tab first).
8. **Quota / rate-limit messaging** — Friendly Hebrew errors for Google 429 / 403 instead of generic failure.
9. **Google Picker (browse)** — Optional browse via Picker under `drive.file`; keep paste URL for shared / read-only. Do **not** add broad Drive list scopes for a custom file browser.
10. **Import upgrades** — Dedupe by email, update existing contacts, raise row cap / pagination.

Suggested Sheets order next: **2 → 3 → 4**, then sync after primary tab exists.
