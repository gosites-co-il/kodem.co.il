# Connection: Google Business Profile

| Field | Value |
|-------|--------|
| **Id** | `google_business` |
| **Provider** | `google` |
| **Category** | local |
| **Status** | **available** |
| **Capabilities** | `local.reviews.read`, `local.listing.read` |
| **Backs channels** | — |

Reviews, listings, and local presence for SMB workspaces.

Parent overview: [`../connections-and-channels.md`](../connections-and-channels.md).

## Env

```env
GOOGLE_BUSINESS_CLIENT_ID=
GOOGLE_BUSINESS_CLIENT_SECRET=
GOOGLE_BUSINESS_CALLBACK_URL=http://localhost:3000/api/connections/oauth/google/google_business/callback
APP_URL=http://localhost:3000
```

Dedicated OAuth client. Azure: `OAUTH_GOOGLE_BUSINESS_CLIENT_ID` / `_SECRET`.

## Enable APIs

1. **My Business Account Management API** (`mybusinessaccountmanagement.googleapis.com`)
2. **My Business Business Information API** (`mybusinessbusinessinformation.googleapis.com`)

### Quota `0` / 429 RESOURCE_EXHAUSTED

If list/bind fails with `quota_limit_value: "0"`, the project has **no** Requests-per-minute quota yet (not a temporary burst).

1. Cloud Console → **APIs & Services → Enabled APIs** — confirm both APIs above are enabled on the **same** project as the OAuth client.
2. **IAM & Admin → Quotas** (or API → Quotas) → find `DefaultRequestsPerMinutePerProject` for Account Management → **Edit quotas** / request increase (even a small limit like 60).
3. Wait for Google to approve; until then use **קשר לפי מזהה** in the UI (`locations/{id}`).

Binding by location id still calls Business Information API (get location) — that API needs quota too.

## Install (local)

1. Web OAuth client; redirect:

   ```
   http://localhost:3000/api/connections/oauth/google/google_business/callback
   ```

2. `.env` → connect from **חיבורים**.
3. Detail: `/workspace/integrations/connections/google_business`.
4. Active → pick location → **קשר מיקום** → **בדוק חיבור**.

## Metadata

`{ locationName, locationTitle?, lastBoundAt? }`

## APIs

| Method | Route | Notes |
|--------|-------|--------|
| GET | `/api/connections/:id/business/locations` | list |
| POST | `/api/connections/:id/resource` | `{ locationName }` |
| POST | `/api/connections/:id/test` | get location title |

## Scopes

- `openid`, `email`, `profile`
- `https://www.googleapis.com/auth/business.manage`

## Code

| Area | Path |
|------|------|
| Client | `libs/integrations/src/lib/google/business-profile.ts` |
| UI | `BusinessResourcePanel` in connections catalog |

## Roadmap

- Reviews list / rating panel (MVP C)
