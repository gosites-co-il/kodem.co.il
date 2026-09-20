# Channel: Email

| Field | Value |
|-------|--------|
| **Type** | `email` |
| **Name** | אימייל |
| **Status** | **available** (stubs) |
| **Allowed providers** | `google`, `microsoft`, `smtp` |

Send and receive email with contacts. Not a Connection — back it with Google Workspace, Microsoft 365, or SMTP.

## Related Connections

- [Google Workspace](../connections/google-workspace.md) (**implemented** — stubs)
- [Microsoft 365](../connections/microsoft-365.md) (coming soon)

## Configure

1. Connect **Google Workspace** under חיבורים (status **active**).
2. **ערוצים** → Email → **הגדר עם &lt;account&gt;**.
3. Use stub actions until Gmail sync ships.

## Stub APIs

| Method | Route | Behavior |
|--------|-------|----------|
| POST | `/api/channels/email/send` | Validates channel + `to`; returns `{ success, stub: true, message }` — no Gmail call |
| GET | `/api/channels/email/messages` | Returns `{ messages: [], stub: true }` |

Permissions: `connections:use` (send/list), `connections:manage` (configure).

## Notes

- Channel must not embed Gmail-specific logic; adapters live on Connections.
- Real send/receive is next after Workspace OAuth is proven in production.

## Roadmap

- Call Gmail send/list through the bound Workspace connection
- Microsoft / SMTP backends
