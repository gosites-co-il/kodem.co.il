# Connections & Channels

Workspace integrations for external providers (**Connections**) and customer communication media (**Channels**).

## Per-item docs

| Kind | Index |
|------|--------|
| **Connections** | [`connections/README.md`](connections/README.md) |
| **Channels** | [`channels/README.md`](channels/README.md) |

Available today: [Google Sheets](connections/google-sheets.md) (OAuth + bind spreadsheet + preview).

## Concepts

| Term | Meaning |
|------|---------|
| **Connection** | A configured link between a Workspace and an external provider (e.g. Google Sheets). Tokens are encrypted at rest. |
| **Connected** | OAuth credentials are stored (`status` is `connected` or `inactive`). Soft-disable does **not** disconnect. |
| **Active** | Soft enablement (`active: true` ⇔ `status === 'connected'`). Bind, preview, and provider API use require **active**. |
| **Channel** | A communication medium used by CRM / campaigns (e.g. Email, WhatsApp). Not the same as a Connection. |
| **Integration** | Catalog entry + adapter for a provider (`google_sheets`, `meta`, …). |

A Channel may be backed by one or more Connections (e.g. Email ← Gmail / Outlook / SMTP). Channels must not embed provider-specific logic.

### Catalog UI

- Shared list: **Settings → חיבורים** and `/workspace/integrations/connections` (same component).
- Detail sheet (open connection): `/workspace/integrations/connections/{integrationId}` and `/workspace/settings/connections/{integrationId}`.
- Closing the sheet returns to the list URL. OAuth success redirects into the detail route for that integration.
- Per-instance card in the sheet: Status pill (**מחובר** / error states), permission badge, **פעיל** switch, **בדוק חיבור**, delete (when not active).

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

`CONNECTION_CREDENTIALS_KEY` encrypts stored OAuth tokens (AES-256-GCM via scrypt). Minimum 16 characters; use a long random string in every real environment. Changing it invalidates existing stored credentials.

Install, APIs, and errors for Sheets: [`connections/google-sheets.md`](connections/google-sheets.md).

Azure deploy vars: [`../../deploy/azure/README.md`](../../deploy/azure/README.md).

## Code map

| Area | Path |
|------|------|
| Catalog | `libs/platform/catalog` |
| Connection domain | `libs/platform/connections` |
| Channel domain | `libs/platform/channels` |
| Adapters / OAuth / Sheets client | `libs/integrations` |
| API | `apps/api` connections + OAuth controllers |
| UI | `apps/app` → settings + `/workspace/integrations/connections` (+ `[integrationId]`) |

## Phase status

- **Phase 0 (done):** domain split, catalog UI, Google Sheets OAuth, encrypted credentials, Azure wiring.
- **Phase 0.5 (done):** token refresh, bind spreadsheet URL, list tabs, preview rows.
- **Phase 0.6 (done):** multi-connection, full vs read-only OAuth, connected vs active, detail route sync, per-card test.
- **Sheets next:** see TODO list in [`connections/google-sheets.md`](connections/google-sheets.md) (mapping → CRM, unbind, reconnect UX, primary tab, sync, Picker later).
- **Other Google (later):** Analytics → Business Profile → Ads → Workspace (Email Channel). Then Meta → WhatsApp Channel.
