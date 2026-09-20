# Connection: Instagram

| Field | Value |
|-------|--------|
| **Id** | `instagram` |
| **Provider** | `meta` |
| **Category** | social |
| **Status** | **available** |
| **Capabilities** | `messaging.instagram.send`, `messaging.instagram.receive` |
| **Backs channels** | [Instagram](../channels/instagram.md) |

## Env

```env
META_INSTAGRAM_CLIENT_ID=
META_INSTAGRAM_CLIENT_SECRET=
META_INSTAGRAM_CALLBACK_URL=http://localhost:3000/api/connections/oauth/meta/instagram/callback
```

## Install

1. Instagram Business / Creator account linked to a Facebook Page.
2. Meta App scopes: `instagram_basic`, `instagram_manage_messages`, `pages_show_list`, …
3. Connect → bind IG account → test → configure [Instagram channel](../channels/instagram.md).

## Metadata

`{ igUserId, igUsername?, pageId?, lastBoundAt? }`
