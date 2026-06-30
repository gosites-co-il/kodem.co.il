# Kodem - Cursor Instructions

## Version: 2.0.0
## Type: System Rules for AI Development Agent

---

# 0. System Context

You are working inside the Kodem Nx monorepo.

Kodem is a PLG AI business intelligence system that helps businesses understand what is happening and what they should do next.

Core concepts:
- Workspace-based system
- Event-driven architecture
- Engines-based intelligence system
- Business Knowledge accumulation
- Insight → Recommendation → Action flow
- WOW-first user experience

---

# 1. Core Product Identity

Kodem is NOT:
- Not a CRM system
- Not a dashboard system
- Not a reporting tool

Kodem IS:
> A system that understands a business and tells the user what to do next.

Every implementation must support this identity.

---

# 2. WOW Flow is Mandatory

The system MUST preserve the WOW flow defined in:
- docs/00-foundation/wow-flow.md

Minimum required output:
- Business understanding within minutes
- 3–5 meaningful insights
- 1 clear recommended action

If a change breaks this flow → it is INVALID.

---

# 3. Architecture Rules (Nx Monorepo)

## 3.1 Dependency Rules

- apps → libs only
- libs → never depend on apps
- engines → no UI access
- ui → no business logic
- ai → no business logic ownership

---

## 3.2 Apps Responsibilities

- web (Next.js): SaaS product UI
- marketing (Astro): public website
- api (NestJS): backend orchestration
- worker: executes engines asynchronously

---

# 4. Engines (CORE SYSTEM)

Engines are the heart of Kodem.

- discovery
- insight
- recommendation
- rule
- learning

Rules:
- Must be stateless or minimally stateful
- Must NOT access database directly
- Must NOT know UI exists
- Must return structured outputs only
- Must operate on Events and Business Knowledge

---

# 5. Event System

- Every meaningful action MUST generate an Event
- Events are immutable source of truth
- Events drive all engines
- No engine runs without event context

---

# 6. Business Knowledge Model

The system does NOT store data.

It builds Business Knowledge over time:

Includes:
- Business Profile
- Events
- Observations
- Hypotheses
- Insights
- Recommendations

Every interaction MUST improve Business Knowledge.

---

# 7. Insight Rules

- Insights explain reality
- Insights must be grounded in real data
- No hallucinated business facts allowed

Each Insight MUST include:
- What is happening
- Why it matters
- Supporting evidence
- Optional confidence score

---

# 8. Recommendation Rules

- Recommendations define actions
- Each recommendation MUST include:
  - Action
  - Reason
  - Expected impact

Only ONE primary recommendation is allowed in WOW stage.

---

# 9. AI Usage Rules

- AI is only used inside engines or AI library
- AI is NOT allowed to define business logic
- AI outputs MUST be grounded in real data
- No invented business facts

---

# 10. UI Rules (Next.js + shadcn)

- UI is presentation only
- Uses shadcn components inside apps/web
- UI MUST NOT contain business logic
- UI MUST NOT generate insights

UI responsibilities:
- Display insights
- Display recommendations
- Trigger API actions

---

# 11. Marketing App Rules (Astro)

- Static-first
- SEO optimized
- No backend dependency
- Only public content and signup flow

---

# 12. Business Logic Location Rules

Allowed:
- libs/engines
- libs/business
- libs/core

NOT allowed:
- apps/*
- libs/ui
- marketing app

---

# 13. Development Thinking Model

When implementing any feature:

1. Identify relevant engine
2. Identify triggering event
3. Identify produced insight
4. Identify recommendation path
5. Verify improvement of WOW flow

If any step is missing → implementation is incomplete

---

# 14. AI Developer Thinking Mode

Cursor is allowed to think proactively within system constraints.

---

## 14.1 Allowed Behavior

Cursor SHOULD:
- Suggest better architecture
- Propose engine improvements
- Detect missing events or insights
- Recommend refactoring
- Ask clarifying questions

---

## 14.2 Required Constraints

Cursor MUST NOT:
- Bypass engines with direct logic in API/UI
- Break Nx architecture boundaries
- Move business logic into UI or apps
- Ignore event-driven architecture
- Break WOW flow

---

## 14.3 Thinking Rule

For every feature, reason internally:

- Which engine owns this?
- What event triggers it?
- What insight is generated?
- What recommendation follows?
- Does it improve WOW flow?

---

## 14.4 Proactive Improvement Rule

Cursor SHOULD suggest improvements.

Cursor MUST NOT implement architectural changes without confirmation.

---

## 14.5 Architecture Guardrail

Any suggestion conflicting with:
- Engines model
- Event-driven system
- WOW flow

must be rejected or adapted.

---

# 15. Hard System Constraints

System is INVALID if it:

- Requires heavy onboarding before value
- Shows raw data without interpretation
- Breaks WOW flow
- Bypasses engines
- Skips event generation

---

# 16. Golden Rule

> If you're unsure where code belongs, it belongs in an engine or domain layer — never in UI.

# 17. Nx Hard Code Rules

These rules are enforced at code-level discipline.

---

## 17.1 Import Rules (CRITICAL)

- Apps may import only from libs
- Libs may NOT import from apps
- Cross-lib imports must respect dependency graph

---

## 17.2 Engine Isolation Rule

Engines MUST NOT:

- import API layers
- import UI layers
- import database layer directly
- call HTTP endpoints

Engines MAY only use:

- libs/core
- libs/business
- libs/events
- libs/ai

---

## 17.3 No Circular Dependencies

Any circular dependency between libs is INVALID.

If detected:
- code must be refactored immediately
- not bypassed with hacks

---

## 17.4 UI Isolation Rule

apps/web (Next.js with shadcn) MUST:

- only consume API responses
- never call engines directly
- never contain business logic
- never compute insights locally

---

## 17.5 API Layer Discipline (NestJS)

API MUST:

- orchestrate flows only
- emit events
- call services
- NEVER contain engine logic

If logic grows in controllers → it must be moved to engines.

---

## 17.6 Worker Discipline

Worker MUST:

- be the ONLY place that runs engines
- process events asynchronously
- write results back to DB

Worker MUST NOT:
- expose HTTP endpoints
- serve UI logic
- implement business rules

---

## 17.7 Library Ownership Rule

Each lib MUST have a single responsibility:

- core → primitives only
- business → domain entities
- engines → intelligence logic
- ai → LLM abstraction only
- events → event system only
- integrations → external systems only
- database → persistence only
- ui → presentation only

---

## 17.8 Dependency Direction Rule

Allowed flow:

UI → API → Worker → Engines → Business/Core → DB

Reverse direction is INVALID.

---

## 17.9 Nx Tag Enforcement Rule

Every project MUST have Nx tags:

- type:app | type:lib
- layer:core | domain | engines | ai | integration
- scope:web | api | worker | marketing

No tag = project is INVALID.

---

## 17.10 Enforcement Mindset

If a developer is unsure where code belongs:

Priority order:
1. Engine
2. Domain (business/core)
3. Service layer (API/worker)
4. NEVER UI