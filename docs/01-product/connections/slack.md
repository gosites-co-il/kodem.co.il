# Connection: Slack

| Field | Value |
|-------|--------|
| **Id** | `slack` |
| **Provider** | `slack` |
| **Category** | productivity |
| **Status** | coming_soon |
| **Capabilities** | `chat.post` |
| **Backs channels** | — |

Team notifications and workspace chat (outbound alerts, not a customer Channel).

## Planned env

```env
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_CALLBACK_URL=http://localhost:3000/api/connections/oauth/slack/slack/callback
```

## Notes

- Use for internal notifications (leads, insights), not CRM customer messaging.
