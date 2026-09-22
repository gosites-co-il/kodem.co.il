# Connection: Facebook

| Field | Value |
|-------|--------|
| **Id** | `facebook` |
| **Provider** | `meta` |
| **Category** | social |
| **Status** | **available** |
| **Capabilities** | `messaging.messenger.send`, `messaging.messenger.receive` |
| **Backs channels** | [Facebook Messenger](../channels/facebook-messenger.md) |

## Env

```env
META_FACEBOOK_CLIENT_ID=
META_FACEBOOK_CLIENT_SECRET=
META_FACEBOOK_CALLBACK_URL=http://localhost:3000/api/connections/oauth/meta/facebook/callback
```

Do **not** reuse login `FACEBOOK_CLIENT_*`.

## Install

1. Meta App → Facebook Login for Business / Graph API.
2. Redirect URI: callback above.
3. Permissions: `pages_show_list`, `pages_messaging`, `pages_manage_metadata`, `pages_read_engagement` (do **not** add `email` / `public_profile` for Connections — Meta often returns Invalid Scopes).
4. Connect from חיבורים → Facebook → bind a **Page** → test.
5. Configure [Messenger channel](../channels/facebook-messenger.md).

## Metadata

`{ pageId, pageName?, lastBoundAt? }` — page access token stored in encrypted credentials as `pageAccessToken`.
