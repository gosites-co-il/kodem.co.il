# Connection: Google Business Profile

| Field | Value |
|-------|--------|
| **Id** | `google_business` |
| **Provider** | `google_business` |
| **Category** | local |
| **Status** | coming_soon |
| **Capabilities** | `local.reviews.read`, `local.listing.read` |
| **Backs channels** | — |

Reviews, listings, and local presence for SMB workspaces.

## Planned env

```env
GOOGLE_BUSINESS_CLIENT_ID=
GOOGLE_BUSINESS_CLIENT_SECRET=
GOOGLE_BUSINESS_CALLBACK_URL=http://localhost:3000/api/connections/oauth/google/google_business/callback
```

## Notes

- Fits Israeli SMB / local businesses after Analytics.
- Bind a Business Profile location id in `metadata` after OAuth.
