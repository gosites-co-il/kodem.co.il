# Meta connections (index)

Meta messaging is split into **three Connections** (not one Meta card):

| Id | Doc | Backs channel |
|----|-----|---------------|
| `facebook` | [facebook.md](facebook.md) | [Facebook Messenger](../channels/facebook-messenger.md) |
| `instagram` | [instagram.md](instagram.md) | [Instagram](../channels/instagram.md) |
| `whatsapp` | [whatsapp.md](whatsapp.md) | [WhatsApp](../channels/whatsapp.md) |

Shared provider adapter: `meta`. OAuth callback:

```
{APP_URL}/api/connections/oauth/meta/{integrationId}/callback
```

Webhook (inbound):

```
{APP_URL}/api/channels/meta/webhook
```

Do **not** reuse login `FACEBOOK_CLIENT_*` — use `META_FACEBOOK_*` / `META_INSTAGRAM_*` / `META_WHATSAPP_*`.
