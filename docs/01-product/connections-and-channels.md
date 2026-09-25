# Connections & Channels

Workspace integrations for external providers (**Connections**) and customer communication media (**Channels**).

## Per-item docs

| Kind | Index |
|------|--------|
| **Connections** | [`connections/README.md`](connections/README.md) |
| **Channels** | [`channels/README.md`](channels/README.md) |

**Available:** [Sheets](connections/google-sheets.md), [Analytics](connections/google-analytics.md), [Business Profile](connections/google-business.md), [Workspace](connections/google-workspace.md) + [Email](channels/email.md); [Facebook](connections/facebook.md), [Instagram](connections/instagram.md), [WhatsApp](connections/whatsapp.md) + matching channels.

**Later:** [Google Ads](connections/google-ads.md) (developer token).

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

- Integrations home: `/workspace/integrations` — overview, how-to, connections vs channels, featured tools, and connection status.
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

Per-connection install guides under [`connections/`](connections/). Azure deploy vars: [`../../deploy/azure/README.md`](../../deploy/azure/README.md).

## Code map

| Area | Path |
|------|------|
| Catalog | `libs/platform/catalog` |
| Connection domain | `libs/platform/connections` |
| Channel domain | `libs/platform/channels` |
| Adapters / OAuth / Google clients | `libs/integrations` |
| API | `apps/api` connections + OAuth + channels controllers |
| UI | `apps/app` → settings + `/workspace/integrations/connections` (+ `[integrationId]`) |

## Phase status

- **Phase 0–0.6 (done):** Sheets OAuth, bind/preview, multi-connection, connected vs active, detail routes.
- **Phase 1 (done):** Analytics + Business Profile; Workspace + Email; Sheets CRM import.
- **Phase 2 (done):** Meta — Facebook / Instagram / WhatsApp Connections + Channels (send/list + webhook receive).
- **Next:**
  1. **Fix Business Profile quota** (ops) — see [`connections/google-business.md`](connections/google-business.md).
  2. Meta App Review / Advanced Access for production messaging.
  3. ~~WhatsApp Embedded Signup fallback when phone list is empty~~ — shipped (Connections wizard + empty-list CTA).
- **Later:** Google Ads — [`connections/google-ads.md`](connections/google-ads.md).
- **Sheets backlog:** unbind, reconnect UX, primary tab, sync, Picker — see [`connections/google-sheets.md`](connections/google-sheets.md).
