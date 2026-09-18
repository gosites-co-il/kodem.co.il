# Connection: Google Analytics

| Field | Value |
|-------|--------|
| **Id** | `google_analytics` |
| **Provider** | `google_analytics` |
| **Category** | analytics |
| **Status** | coming_soon |
| **Capabilities** | `analytics.read` |
| **Backs channels** | — |

Website traffic and conversion data for insights engines.

## Planned env

```env
GOOGLE_ANALYTICS_CLIENT_ID=
GOOGLE_ANALYTICS_CLIENT_SECRET=
GOOGLE_ANALYTICS_CALLBACK_URL=http://localhost:3000/api/connections/oauth/google/google_analytics/callback
```

Suggested next Google Connection after Sheets (read-only, high value for BKM / insights).

## Notes

- Enable Google Analytics Data API (GA4) in Cloud Console when implementing.
- Store property / measurement selection in connection `metadata` (similar to Sheets spreadsheet bind).
