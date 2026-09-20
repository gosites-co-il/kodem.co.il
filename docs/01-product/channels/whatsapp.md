# Channel: WhatsApp

| Field | Value |
|-------|--------|
| **Type** | `whatsapp` |
| **Name** | WhatsApp |
| **Status** | **available** |
| **Allowed providers** | `meta` |

## Related Connections

- [WhatsApp Connection](../connections/whatsapp.md)

## Configure

1. Connect + bind phone under חיבורים.
2. ערוצים → WhatsApp → **הגדר עם …**.
3. **שלח** / **טען תיבה** (inbound from webhook buffer).

## APIs

| Method | Route |
|--------|-------|
| POST | `/api/channels/whatsapp/send` `{ to, body }` |
| GET | `/api/channels/whatsapp/messages` |
| GET/POST | `/api/channels/meta/webhook` |
