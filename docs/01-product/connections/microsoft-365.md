# Connection: Microsoft 365

| Field | Value |
|-------|--------|
| **Id** | `microsoft_365` |
| **Provider** | `microsoft` |
| **Category** | productivity |
| **Status** | coming_soon |
| **Capabilities** | `email.read`, `email.send`, `calendar.read`, `calendar.write` |
| **Backs channels** | [Email](../channels/email.md) |

Outlook, Teams, and OneDrive via Microsoft identity.

## Planned env

```env
MICROSOFT_365_CLIENT_ID=
MICROSOFT_365_CLIENT_SECRET=
MICROSOFT_365_CALLBACK_URL=http://localhost:3000/api/connections/oauth/microsoft/microsoft_365/callback
```

## Notes

- Azure AD app registration; Graph API scopes for mail/calendar.
- Alternate Email Channel backing alongside Google Workspace.
