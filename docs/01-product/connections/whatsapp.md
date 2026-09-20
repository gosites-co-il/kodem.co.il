# Connection: WhatsApp

| Field | Value |
|-------|--------|
| **Id** | `whatsapp` |
| **Provider** | `meta` |
| **Category** | messaging |
| **Status** | **available** |
| **Capabilities** | `messaging.whatsapp.send`, `messaging.whatsapp.receive` |
| **Backs channels** | [WhatsApp Channel](../channels/whatsapp.md) |

WhatsApp Business Cloud API.

## Env

```env
META_WHATSAPP_CLIENT_ID=
META_WHATSAPP_CLIENT_SECRET=
META_WHATSAPP_CALLBACK_URL=http://localhost:3000/api/connections/oauth/meta/whatsapp/callback
META_APP_SECRET=
META_WEBHOOK_VERIFY_TOKEN=
```

## Install

1. Meta App with WhatsApp product; scopes `whatsapp_business_management`, `whatsapp_business_messaging`, `business_management`.
2. Connect from חיבורים → list phone numbers → bind.
3. Webhook URL: `{APP_URL}/api/channels/meta/webhook` (needs public HTTPS; use a tunnel locally).
4. Configure [WhatsApp channel](../channels/whatsapp.md) for send / list (inbound via webhook buffer).

## Metadata

`{ phoneNumberId, displayPhoneNumber?, wabaId?, lastBoundAt? }`

## Notes

- If phone list is empty after OAuth, complete **Embedded Signup** in Meta and reconnect.
- Template messages / 24h session rules apply for production outbound.
