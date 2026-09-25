# Connection: WhatsApp

| Field | Value |
|-------|--------|
| **Id** | `whatsapp` |
| **Provider** | `meta` |
| **Category** | messaging |
| **Status** | **available** |
| **Capabilities** | `messaging.whatsapp.send`, `messaging.whatsapp.receive` |
| **Backs channels** | [WhatsApp Channel](../channels/whatsapp.md) |

WhatsApp Business Cloud API via **Meta Embedded Signup** (Facebook Login for Business) plus optional list/bind for numbers already on Cloud API.

## Env

```env
META_WHATSAPP_CLIENT_ID=
META_WHATSAPP_CLIENT_SECRET=
META_WHATSAPP_CALLBACK_URL=http://localhost:3000/api/connections/oauth/meta/whatsapp/callback
# Facebook Login for Business → Embedded Signup Builder → Configuration ID
META_WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID=
META_APP_SECRET=
META_WEBHOOK_VERIFY_TOKEN=
```

Optional browser overrides (otherwise the app loads App ID + config id from the API):

```env
NEXT_PUBLIC_META_APP_ID=
NEXT_PUBLIC_META_WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID=
```

## Install

1. Meta App with WhatsApp product; create a **Facebook Login for Business** Embedded Signup (v4) configuration and copy the **Configuration ID**.
2. Allowed domains + Valid OAuth Redirect URIs for `{APP_URL}`; enable JavaScript SDK login.
3. From חיבורים → WhatsApp → pre-wizard (phone + Business app vs new number) → **חבר מספר וואטסאפ** opens Meta Embedded Signup.
4. On success the API exchanges the code, stores the BISU token, subscribes the WABA, and auto-binds `phoneNumberId` when Meta returns it.
5. If phones already exist on the connection, use list/bind in the sheet (or **חבר מספר חדש דרך Meta**).
6. Webhook URL: `{APP_URL}/api/channels/meta/webhook` (public HTTPS).
7. Configure [WhatsApp channel](../channels/whatsapp.md) for send / list.

## Metadata

`{ phoneNumberId, displayPhoneNumber?, wabaId?, lastBoundAt? }`

## Notes

- Coexistence (green WhatsApp Business app) uses `featureType: whatsapp_business_app_onboarding` when the user selects that option.
- Template messages / 24h session rules apply for production outbound.
- Advanced Access is required for customers who are not admins on your Meta app.
