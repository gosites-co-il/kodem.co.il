# Connection: Google Ads

| Field | Value |
|-------|--------|
| **Id** | `google_ads` |
| **Provider** | `google_ads` |
| **Category** | advertising |
| **Status** | coming_soon |
| **Capabilities** | `ads.read` |
| **Backs channels** | — |

Search and display campaign data.

## Planned env

```env
GOOGLE_ADS_CLIENT_ID=
GOOGLE_ADS_CLIENT_SECRET=
GOOGLE_ADS_CALLBACK_URL=http://localhost:3000/api/connections/oauth/google/google_ads/callback
# Also typically: developer token + customer / MCC ids in metadata or env
```

## Notes

- Heavier than Analytics: Google Ads API developer token and account hierarchy.
- Implement after Analytics / Business Profile unless ads insights are blocking.
