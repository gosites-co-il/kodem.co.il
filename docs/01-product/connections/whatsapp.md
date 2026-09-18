# Connection: WhatsApp

| Field | Value |
|-------|--------|
| **Id** | `whatsapp` |
| **Provider** | `meta` |
| **Category** | messaging |
| **Status** | coming_soon |
| **Capabilities** | `messaging.whatsapp.send`, `messaging.whatsapp.receive` |
| **Backs channels** | [WhatsApp Channel](../channels/whatsapp.md) |

WhatsApp Business messaging Connection (Meta Cloud API). Distinct catalog card from the broader Meta Connection; same provider.

## Planned env

```env
WHATSAPP_CLIENT_ID=
WHATSAPP_CLIENT_SECRET=
WHATSAPP_CALLBACK_URL=http://localhost:3000/api/connections/oauth/meta/whatsapp/callback
# Phone number id / WABA id in metadata after connect
```

## Notes

- Product priority after Sheets usefulness: first real messaging Channel for Israeli SMB + CRM.
- See also [`meta.md`](meta.md) and [`../channels/whatsapp.md`](../channels/whatsapp.md).
