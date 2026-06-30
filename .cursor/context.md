# Kodem System Context

Version: 1.0

---

# Purpose

This file defines the current state of the Kodem project.

It provides working context for AI agents (Cursor) during development.

Unlike architecture or rules, this file is dynamic.

It should be updated as the system evolves.

---

# System Overview

Kodem is an AI-powered Business Operating System.

It helps businesses:

- Understand their operations
- Manage customers (CRM)
- Capture business knowledge
- Generate insights
- Improve decision-making using AI

---

# Core System Model

The system is based on five runtime concepts:

```
Modules → Events → Engines → Business Knowledge Model (BKM) → Insights
```

---

# Current System State

## Implemented Concepts

✔ Nx Monorepo structure defined  
✔ Architecture layer defined  
✔ AI integration rules defined  
✔ Event-driven system model defined  
✔ Module-based system design defined  

---

## Defined (Not Yet Implemented)

⏳ Workspace implementation  
⏳ CRM module  
⏳ Digital Card module  
⏳ Event system runtime implementation  
⏳ Engine execution pipeline  
⏳ Business Knowledge persistence layer  
⏳ AI Gateway implementation  

---

## Active Development Focus

At this stage, development should prioritize:

1. Workspace foundation
2. Core Module structure (CRM + Digital Card)
3. Event system implementation
4. Basic BKM structure
5. First Engine (Insight Engine V1)

---

# Active Architecture Boundaries

## Must be respected at all times:

- Modules own UI + user interactions
- Events represent system truth
- Engines produce intelligence only
- BKM is system memory
- AI is a supporting layer only

---

# What Cursor Should Optimize For

When generating code, prioritize:

✔ Working vertical slices  
✔ Event-driven correctness  
✔ Clear module ownership  
✔ Minimal abstractions  
✔ Reusability aligned with Nx structure  

---

# What Cursor Should Avoid

Never:

✘ Over-engineer missing features  
✘ Create unnecessary libraries  
✘ Add AI without validation layer  
✘ Bypass Event system  
✘ Mix UI and business logic  
✘ Implement Engines inside Modules  

---

# Current Milestone Mindset

The system is currently in:

> MVP Foundation Phase

Meaning:

- Focus is on core system loop
- Not on scalability optimizations
- Not on advanced AI features
- Not on marketplace or extensibility

---

# MVP Core Loop

The first usable system must enable:

```
User creates Workspace
→ Adds business info
→ System builds initial Business Knowledge
→ CRM captures leads
→ Events are generated
→ Insight Engine produces value
→ User sees improvement suggestions
```

---

# System Health Indicators

The system is considered healthy if:

- Events are consistently generated
- BKM is continuously updated
- Modules remain simple and isolated
- Engines operate independently
- AI does not control system behavior

---

# Architecture Drift Warning

If any of the following happens:

- Business logic appears in UI
- Events are skipped
- Engines become tightly coupled to Modules
- Database is accessed directly outside repository layer

→ The architecture is drifting and must be corrected immediately.

---

# Development Priority Rules

Always prioritize:

1. Correct system behavior
2. Event integrity
3. Business Knowledge accuracy
4. Module clarity
5. Simplicity of implementation

Never prioritize:

- Premature optimization
- Generic abstractions
- AI complexity
- Over-engineering

---

# Golden Rule

The system is not defined by what exists in code.

It is defined by how Events, Engines, Modules, and Business Knowledge interact.

---

# Final Principle

Kodem is a living system.

This context reflects its current state.

When the system evolves, this file must evolve with it.