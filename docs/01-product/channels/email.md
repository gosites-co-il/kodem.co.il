# Channel: Email

| Field | Value |
|-------|--------|
| **Type** | `email` |
| **Name** | אימייל |
| **Status** | **available** |
| **Allowed providers** | `google` (Workspace), `microsoft`, `smtp` (later) |

Send and receive email with contacts. Not a Connection — back it with Google Workspace today.

## Related Connections

- [Google Workspace](../connections/google-workspace.md) (**Gmail send + list**)
- [Microsoft 365](../connections/microsoft-365.md) (coming soon)

## Configure

1. Connect **Google Workspace** under חיבורים (status **active** / `connected`).
2. Enable **Gmail API** on the Workspace OAuth client project.
3. **ערוצים** → Email → **הגדר עם …**.
4. **שלח** / **טען תיבה** call Gmail via the bound connection token.

## APIs

| Method | Route | Permission | Behavior |
|--------|-------|------------|----------|
| POST | `/api/channels/email/send` | `connections:use` | Body `{ to, subject?, body? }` → Gmail `users.messages.send` |
| GET | `/api/channels/email/messages?maxResults=` | `connections:use` | Lists recent messages (metadata + snippet) |

Requires primary binding to an **active** `google_workspace` connection.

## Code

| Area | Path |
|------|------|
| Gmail client | `libs/integrations/src/lib/google/gmail.ts` |
| Channel domain | `libs/platform/channels` |
| API | `apps/api/.../channels.controller.ts` |
| UI | `channels-catalog-view.tsx` |

## Notes

- Channel must not embed Gmail-specific logic beyond calling the Connection’s token + integrations adapter.
- Inactive Workspace connection blocks send/list with a Hebrew message.

## Roadmap

- Microsoft / SMTP backends
- Thread view, attachments, CRM contact linking
