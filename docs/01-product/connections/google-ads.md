# Connection: Google Ads

| Field | Value |
|-------|--------|
| **Id** | `google_ads` |
| **Provider** | `google_ads` |
| **Category** | advertising |
| **Status** | **coming_soon** (next phase) |
| **Capabilities** | `ads.read` |
| **Backs channels** | — |

Search and display campaign data.

## Next phase — not in current parallel pass

Implement after Analytics / Business Profile / Workspace Email stubs.

### Developer token checklist

1. Google Ads account → **Tools and settings → API Center** (or apply via [Ads API get started](https://developers.google.com/google-ads/api/docs/get-started/dev-token)).
2. Request a **developer token** (Explorer / test access is enough initially).
3. Note a test **customer id** / MCC.
4. Create a dedicated Web OAuth client (`GOOGLE_ADS_*`) — separate from login / Sheets / Analytics.
5. Env: `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, `GOOGLE_ADS_DEVELOPER_TOKEN`, callback  
   `/api/connections/oauth/google/google_ads/callback` (or keep provider-specific callback when adapter lands).

Until the developer token exists, campaign reads cannot ship; OAuth-only shell is optional and deferred with this doc.

## Planned env

```env
GOOGLE_ADS_CLIENT_ID=
GOOGLE_ADS_CLIENT_SECRET=
GOOGLE_ADS_CALLBACK_URL=http://localhost:3000/api/connections/oauth/google/google_ads/callback
GOOGLE_ADS_DEVELOPER_TOKEN=
```

## Notes

- Heavier than Analytics: developer token + account hierarchy.
- Catalog remains `coming_soon` / stub adapter until this phase.
