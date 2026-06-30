# Kodem AI Review Checklist

Version: 1.0

---

# Purpose

This document defines the mandatory self-review process for AI-generated code.

Before presenting any implementation, Cursor must review its own work against this checklist.

If a rule cannot be satisfied, explain why before continuing.

Never silently violate these standards.

---

# Primary Goal

Every code change should improve the platform.

Not only solve the requested task.

---

# Step 1 — Understand the Request

Before writing code, verify:

- Do I fully understand the user's request?
- Do I understand the business goal?
- Am I solving the root problem instead of the symptom?
- Is there missing information that should be clarified first?

If the request is ambiguous, ask questions before coding.

---

# Step 2 — Architecture Review

Verify:

- Does this fit the Kodem architecture?
- Does this respect Platform boundaries?
- Does this respect Workspace boundaries?
- Does this belong in the correct Module?
- Does this belong in an Engine instead?
- Am I introducing business logic into the wrong layer?
- Does this violate any architecture rule?

If architecture changes are required:

Stop and explain the architectural impact before implementing.

---

# Step 3 — Existing Code Review

Before creating anything new:

Search for existing:

- Components
- Hooks
- Services
- Utilities
- Repositories
- DTOs
- Interfaces
- Types
- Helpers

Prefer extending existing code.

Avoid duplication.

---

# Step 4 — Simplicity Review

Ask:

Can this solution be simpler?

Can I remove code?

Can I reuse existing functionality?

Am I introducing unnecessary abstraction?

Prefer the smallest solution that satisfies the requirement.

---

# Step 5 — Business Knowledge Review

Verify:

Does this affect Business Knowledge?

Should the Business Knowledge Model be updated?

Should an Event be generated?

Should an Engine react to this action?

Am I bypassing Business Knowledge?

Business Knowledge must remain the source of truth.

---

# Step 6 — Event Review

Ask:

Is this a meaningful business action?

If yes:

Should an Event be created?

Does the Event name follow conventions?

Can the action be replayed?

Would another Engine benefit from this Event?

---

# Step 7 — AI Review

If AI is involved:

Verify:

- AI is accessed only through the AI Gateway.
- Output is validated.
- Output is structured.
- Business rules remain deterministic.
- AI failures are handled gracefully.

Never trust AI responses without validation.

---

# Step 8 — Security Review

Verify:

Workspace isolation is respected.

Permissions are enforced.

No sensitive data is exposed.

Secrets are never logged.

Authorization is verified.

Input validation exists.

Output is sanitized where appropriate.

---

# Step 9 — Performance Review

Ask:

Does this introduce unnecessary database queries?

Can queries be optimized?

Can work move to a Worker?

Is caching appropriate?

Avoid premature optimization.

Optimize only where it matters.

---

# Step 10 — Code Quality Review

Verify:

Meaningful names.

Small functions.

Single Responsibility.

No dead code.

No commented-out code.

No duplicated logic.

Readable flow.

Minimal complexity.

---

# Step 11 — Dependency Review

Before adding a dependency:

Ask:

Can the existing platform solve this?

Can Nx libraries solve this?

Can native TypeScript solve this?

Every dependency must have a clear justification.

Avoid dependency bloat.

---

# Step 12 — API Review

If API changes:

Verify:

DTOs are validated.

Response models are explicit.

Errors are consistent.

HTTP status codes are correct.

Controllers contain no business logic.

---

# Step 13 — Database Review

Verify:

WorkspaceId exists where applicable.

Indexes are appropriate.

Relations are correct.

Soft delete is respected.

Audit fields exist.

Migrations are safe.

---

# Step 14 — Frontend Review

Verify:

UI logic stays in components/hooks.

Business logic stays in backend.

Components are reusable.

Accessibility is respected.

Loading and error states exist.

Responsive behavior is preserved.

---

# Step 15 — Testing Review

Ask:

Should this change include tests?

Does it affect business rules?

Does it change public behavior?

Would a regression test be valuable?

Testing is part of the implementation.

Not an afterthought.

---

# Step 16 — Documentation Review

Ask:

Should the following be updated?

- Glossary
- Architecture
- Product
- AI Rules
- API Documentation

Architecture evolves with the code.

Documentation is part of the feature.

---

# Final Quality Gate

Before responding, verify:

- The solution is complete.
- The solution is production-ready.
- No placeholders remain.
- No unnecessary abstractions were introduced.
- Existing patterns were reused.
- The implementation is easy to understand.
- The implementation aligns with the Kodem Constitution.

---

# Response Format

When presenting significant implementations:

Briefly summarize:

1. What was implemented.
2. Why this approach was chosen.
3. Architectural impact.
4. Trade-offs.
5. Future considerations (if any).

Keep explanations concise and actionable.

---

# Golden Principle

Cursor is not measured by how quickly it generates code.

Cursor is measured by how well that code will serve the Kodem platform five years from now.