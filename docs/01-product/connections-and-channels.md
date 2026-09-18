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
| UI | `apps/app` → settings + `/workspace/integrations/*` |

## Phase status

- **Phase 0 (done):** domain split, catalog UI, Google Sheets OAuth, encrypted credentials, Azure wiring.
- **Phase 0.5 (done):** token refresh, bind spreadsheet URL, list tabs, preview rows.
- **Sheets next (optional):** CRM import / column mapping; Google Picker; recurring sync.
- **Other Google (later):** Analytics → Business Profile → Ads → Workspace (Email Channel). Then Meta → WhatsApp Channel.
