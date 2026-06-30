# Kodem Feature Implementation Prompt

Version: 1.0

---

# Purpose

This prompt defines how to implement a complete feature inside the Kodem platform.

It assumes:

- Architecture is already defined
- Feature is already approved via foundation flow
- Ownership and boundaries are clear

This is the execution phase.

---

# Core Principle

A feature is not code.

A feature is a full system behavior implemented across layers:

- Modules
- Events
- Engines
- Contracts
- Database
- UI

---

# Step 1 — Understand Feature Scope

Restate clearly:

- What is being built
- What problem it solves
- Which Module owns it
- Which users are affected

If scope is unclear → stop.

---

# Step 2 — Identify System Impact

Break feature into system layers:

## Modules impact
- UI changes
- User interactions
- Event triggers

## Events impact
- New Events
- Modified Events
- Event consumers

## Engines impact
- New intelligence logic
- Updated inference rules
- AI involvement (if any)

## BKM impact
- What new knowledge is created or updated

## Database impact
- New tables
- Schema changes
- Indexing requirements

---

# Step 3 — Define Contracts First

Before writing implementation:

Define or reuse:

- DTOs
- Event schemas
- API contracts
- AI schemas (if applicable)

Contracts MUST exist before code.

---

# Step 4 — Implement in Correct Order

Always follow this order:

## 1. Contracts
Define types and schemas

## 2. Events
Define event structure and triggers

## 3. Database (if needed)
Migrations, repositories, mappers

## 4. Backend logic
Modules / services / APIs

## 5. Engines (if needed)
Intelligence processing

## 6. Frontend
UI implementation in Modules

---

# Step 5 — Event Implementation Rule

Every meaningful user action must:

1. Trigger a Module action
2. Emit an Event
3. Be persisted
4. Be observable

No silent state changes allowed.

---

# Step 6 — Engine Integration (if applicable)

If feature requires intelligence:

Define:

- Input Events
- Processing logic
- Output (Insights / Recommendations)
- Update to BKM

Engines must remain isolated from UI and HTTP.

---

# Step 7 — Business Knowledge Update

Ask:

- Does this feature update BKM?
- Is this a new knowledge type?
- Is this enrichment or mutation?

BKM updates must ALWAYS go through Engines.

---

# Step 8 — AI Usage (if applicable)

If AI is used:

- Must go through AI Gateway
- Must return structured output
- Must be validated before use
- Must never directly modify system state

AI = suggestion layer only

---

# Step 9 — Module Boundaries

Modules must:

- Own user interaction
- Emit Events
- Consume BKM
- Render UI state

Modules must NOT:

- Implement intelligence
- Directly mutate BKM
- Contain cross-module logic

---

# Step 10 — Implementation Safety Rules

Before completing feature:

Verify:

- No duplicated logic
- No architecture violation
- No direct cross-layer coupling
- No bypass of Events
- No direct database access outside database layer
- No business logic inside UI

---

# Step 11 — Testing Requirements

Determine:

- What must be tested
- What is critical business logic
- What can break in production

Prefer integration tests over unit tests for business flows.

---

# Step 12 — Observability Requirement

Ensure:

- Events are logged
- Actions are traceable
- Business flows are replayable
- Errors are structured

Every feature must be observable via Events.

---

# Output Format

When finishing a feature, always provide:

## 1. Implementation Summary

- What was built
- Which layers were affected

## 2. Event Map

- Events created
- Events consumed

## 3. Architecture Impact

- Any changes to structure

## 4. Trade-offs

- What was simplified or deferred

## 5. Future Extensions

- What is intentionally left for later

---

# Golden Rule

A feature is only complete when:

- It is fully functional
- It is observable via Events
- It respects Architecture boundaries
- It updates Business Knowledge correctly
- It is production-ready

---

# Final Principle

Kodem features are not built by coding.

They are built by orchestrating system behavior across layers.