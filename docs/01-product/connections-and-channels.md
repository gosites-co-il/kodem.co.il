# Connections & Channels

Workspace integrations for external providers (Connections) and customer communication media (Channels).

## Concepts

| Term | Meaning |
|------|---------|
| **Connection** | A configured link between a Workspace and an external provider (e.g. Google Sheets). Tokens are encrypted at rest. |
| **Channel** | A communication medium used by CRM / campaigns (e.g. Email, WhatsApp). Not the same as a Connection. |
| **Integration** | Catalog entry + adapter for a provider (`google_sheets`, `meta`, …). |

A Channel may be backed by one or more Connections (e.g. Email ← Gmail / Outlook / SMTP). Channels must not embed provider-specific logic.

Shared catalog: Settings → חיבורים and `/workspace/integrations/connections` use the same list.

## Architecture

```
UI (Settings / Integrations)
  → API /api/connections/* , /api/channels/*
  → @kodem/platform/connections | channels
  → @kodem/integrations (adapters + OAuth)
  → Prisma (encrypted credentials)
```

Permissions: `connections:manage` / `connections:use` (and channel equivalents).

OAuth callback (Google example):

```
{APP_URL}/api/connections/oauth/google/{integrationId}/callback
```

Each Google Connection uses its **own** OAuth client. Do not reuse login `GOOGLE_CLIENT_ID`.

Env pattern for a connection:

```
{INTEGRATION_ID_UPPER}_CLIENT_ID
{INTEGRATION_ID_UPPER}_CLIENT_SECRET
{INTEGRATION_ID_UPPER}_CALLBACK_URL   # optional; defaults as above
```

Example for Sheets: `GOOGLE_SHEETS_CLIENT_ID`, `GOOGLE_SHEETS_CLIENT_SECRET`, `GOOGLE_SHEETS_CALLBACK_URL`.

`CONNECTION_CREDENTIALS_KEY` encrypts stored OAuth tokens (AES-256-GCM via scrypt). Minimum 16 characters; use a long random string in every real environment. Changing it invalidates existing stored credentials.

---

## Local install — Google Sheets

### 1. Env

```bash
cp .env.example .env
```

Set at least:

```env
CONNECTION_CREDENTIALS_KEY=<openssl rand -base64 32>
GOOGLE_SHEETS_CLIENT_ID=...
GOOGLE_SHEETS_CLIENT_SECRET=...
GOOGLE_SHEETS_CALLBACK_URL=http://localhost:3000/api/connections/oauth/google/google_sheets/callback
APP_URL=http://localhost:3000
```

Generate a key:

```bash
openssl rand -base64 32
```

### 2. Google Cloud Console

1. Open [Google Cloud Console](https://console.cloud.google.com/) → create or select a project.
2. **APIs & Services → Library** → enable **Google Sheets API** (and **Google Drive API** if you use Drive file scopes).
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**.
   - Application type: **Web application**
   - Name: e.g. `Kodem Google Sheets (local)` — separate from the Sign-In client.
4. **Authorized redirect URIs** — must match exactly:

   ```
   http://localhost:3000/api/connections/oauth/google/google_sheets/callback
   ```

5. Copy Client ID and Client Secret into `.env` as `GOOGLE_SHEETS_*`.
6. If the OAuth consent screen is in **Testing**, add your Google account as a test user.

### 3. Run the stack

```bash
npm install
npm run db:generate
npm run db:migrate   # or db:push for local throwaway DBs
CI=true npx nx serve api
CI=true npx nx serve worker   # optional for engines
CI=true npx nx dev app
```

Or with Docker Compose (passes the same env vars into the api container):

```bash
docker compose up -d --build
```

### 4. Connect in the UI

1. Sign in to a workspace.
2. Open **Settings → חיבורים** or `/workspace/integrations/connections`.
3. Choose **Google Sheets → Connect** and complete Google consent.
4. On success you return to the catalog with a connected status.

### Common errors

| Symptom | Fix |
|---------|-----|
| `redirect_uri_mismatch` | Redirect URI on the **Sheets** client must match `GOOGLE_SHEETS_CALLBACK_URL` / `APP_URL` exactly (scheme, host, path, no trailing slash mismatch). |
| Connect button disabled / “not configured” | `GOOGLE_SHEETS_CLIENT_ID` and `GOOGLE_SHEETS_CLIENT_SECRET` missing or empty. |
| Decrypt / credential errors after restart | `CONNECTION_CREDENTIALS_KEY` changed; reconnect the integration or restore the previous key. |

---

## Deployed environments (Azure)

GitHub Environment (`development` / `production`):

| Type | Name |
|------|------|
| Variable | `OAUTH_GOOGLE_SHEETS_CLIENT_ID` |
| Secret | `OAUTH_GOOGLE_SHEETS_CLIENT_SECRET` |
| Secret | `CONNECTION_CREDENTIALS_KEY` |

Bicep maps these to `GOOGLE_SHEETS_*` and `CONNECTION_CREDENTIALS_KEY` on the api container. Callback is built as:

```
https://<APP_CUSTOM_DOMAIN>/api/connections/oauth/google/google_sheets/callback
```

Register that URI on the Sheets OAuth client for each environment (dev and prod use different hosts and usually different clients or redirect entries).

Full deploy variable list: [`deploy/azure/README.md`](../../deploy/azure/README.md).

---

## Code map

| Area | Path |
|------|------|
| Catalog | `libs/platform/catalog` |
| Connection domain | `libs/platform/connections` |
| Channel domain | `libs/platform/channels` |
| Adapters / OAuth | `libs/integrations` |
| API | `apps/api` connections + OAuth controllers |
| UI | `apps/app` → settings + `/workspace/integrations/*` |

## Phase status

- **Phase 0 (done):** domain split, catalog UI, Google Sheets OAuth, encrypted credentials, Azure wiring.
- **Later:** Google Workspace family, Meta → WhatsApp Channel, more adapters.
