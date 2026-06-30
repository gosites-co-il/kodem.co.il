# Kodem Foundation Prompt

Version: 1.0

---

# Purpose

This prompt defines how to initialize new system components inside the Kodem platform.

It is used when starting:

- A new Module
- A new Engine
- A new Platform capability
- A new Workspace feature set
- A new Integration

The goal is to ensure every new capability starts aligned with the architecture.

---

# Core Principle

Every feature starts as a system design decision — not as code.

Never start by writing code.

Start by defining structure, ownership, and data flow.

---

# Step 1 — Understand the Business Need

Before implementation:

Ask:

- What business capability are we building?
- Which Module owns it?
- Does it affect Workspace state?
- Does it require Intelligence (Engine)?
- Does it require external data (Integration)?

If unclear → do not proceed.

---

# Step 2 — Map to Architecture

Identify where the feature belongs:

- Module (user-facing capability)
- Engine (intelligence / analysis)
- Platform (system capability)
- Workspace (tenant-specific data)
- Integration (external system)

A feature must have exactly one primary owner.

---

# Step 3 — Define Data Flow

Describe the full lifecycle:

```
User Action
→ Module
→ Event
→ Engine (optional)
→ Business Knowledge update
→ UI response
```

If this flow is unclear, the feature is not ready to implement.

---

# Step 4 — Define Events

Every meaningful action must generate Events.

Define:

- Event name
- Event payload (via contracts)
- When it is triggered
- Who consumes it

Example:

```
Lead.Created
Lead.Contacted
Lead.ScoreUpdated
```

---

# Step 5 — Define Contracts

Before coding:

Define or reuse:

- DTOs
- Event schemas
- API contracts
- AI schemas (if relevant)

Never start implementation without contracts.

---

# Step 6 — Define Business Knowledge Impact

Ask:

- What part of BKM does this update?
- Is this a new knowledge type?
- Does it enrich existing knowledge?
- Who consumes this knowledge?

If no impact → reconsider feature necessity.

---

# Step 7 — Define Engine Involvement

Ask:

- Does this require intelligence?
- Should an Engine process this Event?
- Is this rule-based or AI-based?

If Engine is needed:

Define:

- Input (Events)
- Output (Insights / Recommendations)
- Processing logic (deterministic vs AI-assisted)

---

# Step 8 — Define Module Boundaries

Ensure:

- Module owns UI + interaction logic
- Module does NOT contain intelligence
- Module does NOT mutate BKM directly
- Module emits Events only

---

# Step 9 — Define External Dependencies

Identify:

- Integrations needed
- External APIs
- Authentication flows
- Rate limits / constraints

All external calls go through Integration layer.

---

# Step 10 — Validate Architecture Fit

Before coding ask:

- Does this respect Nx boundaries?
- Does this respect Architecture rules?
- Does this introduce duplication?
- Does this violate separation of concerns?

If any answer is unclear → stop.

---

# Output Requirement

Before implementation, produce:

## 1. Feature Design Summary

- What we are building
- Why we are building it
- Who owns it

## 2. System Flow Diagram

- Modules
- Events
- Engines
- BKM impact

## 3. Contracts Definition

- DTOs
- Events
- APIs

## 4. Implementation Plan

- Step-by-step breakdown
- No code yet

---

# Golden Rule

If a feature cannot be described clearly before code — it is too early to implement.

---

# Final Principle

Kodem is not built by writing code.

Kodem is built by defining system behavior, then implementing it safely.