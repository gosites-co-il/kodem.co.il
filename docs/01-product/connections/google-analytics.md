# Connection: Google Analytics

| Field | Value |
|-------|--------|
| **Id** | `google_analytics` |
| **Provider** | `google` |
| **Category** | analytics |
| **Status** | **available** |
| **Capabilities** | `analytics.read` |
| **Backs channels** | — |

Website traffic and conversion data for insights engines.

Parent overview: [`../connections-and-channels.md`](../connections-and-channels.md).

## Env

```env
GOOGLE_ANALYTICS_CLIENT_ID=
GOOGLE_ANALYTICS_CLIENT_SECRET=
GOOGLE_ANALYTICS_CALLBACK_URL=http://localhost:3000/api/connections/oauth/google/google_analytics/callback
APP_URL=http://localhost:3000
```

Dedicated OAuth client — do **not** reuse login or Sheets clients.

Azure: `OAUTH_GOOGLE_ANALYTICS_CLIENT_ID`, `OAUTH_GOOGLE_ANALYTICS_CLIENT_SECRET`.

## Enable APIs

In Google Cloud Console (same project as the OAuth client):

1. **Google Analytics Admin API**
2. **Google Analytics Data API**

## Install (local)

1. Create **Web** OAuth client; redirect URI:

   ```
   http://localhost:3000/api/connections/oauth/google/google_analytics/callback
   ```

2. Paste ID/secret into `.env`.
3. Run api + app → **חיבורים** → Google Analytics → חבר.
4. Detail route: `/workspace/integrations/connections/google_analytics`.
5. With connection **active**, pick a GA4 property → **קשר נכס** → **בדוק חיבור**.

## Connected vs active

Same model as Sheets: Status **מחובר** vs switch **פעיל**. Bind / list properties / test smoke require **active**.

Metadata: `{ propertyId, propertyName?, lastBoundAt? }`.

## APIs

| Method | Route | Permission |
|--------|-------|------------|
| GET | `/api/connections/:id/analytics/properties` | `connections:use` |
| POST | `/api/connections/:id/resource` | body `{ propertyId }` | `connections:manage` |
| POST | `/api/connections/:id/test` | smoke: last-7-days sessions | `connections:manage` |
| POST | `/api/connections/:id/active` | soft enable | `connections:manage` |

## Scopes

- `openid`, `email`, `profile`
- `https://www.googleapis.com/auth/analytics.readonly`

## Code

| Area | Path |
|------|------|
| Client | `libs/integrations/src/lib/google/analytics.ts` |
| Domain | `libs/platform/connections` |
| UI panel | `connections-catalog-view.tsx` → `AnalyticsResourcePanel` |

## Roadmap

- Last-7-days summary panel (MVP C)
- Insights engine wiring
