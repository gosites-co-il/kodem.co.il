# Connection: Meta

| Field | Value |
|-------|--------|
| **Id** | `meta` |
| **Provider** | `meta` |
| **Category** | social |
| **Status** | coming_soon |
| **Capabilities** | Instagram / Messenger / WhatsApp messaging send & receive |
| **Backs channels** | [Instagram](../channels/instagram.md), [Facebook Messenger](../channels/facebook-messenger.md), [WhatsApp](../channels/whatsapp.md) |

Facebook / Instagram (and WhatsApp capabilities via Meta) as a single Connection that can back multiple Channels.

## Planned env

```env
META_CLIENT_ID=
META_CLIENT_SECRET=
META_CALLBACK_URL=http://localhost:3000/api/connections/oauth/meta/meta/callback
# Webhooks / app secret / verify token as needed
```

## Notes

- Prefer Meta Connection + Channel bindings over duplicating OAuth per messaging surface where Meta allows one app.
- Related catalog entry: [`whatsapp.md`](whatsapp.md) (WhatsApp-focused Connection).
