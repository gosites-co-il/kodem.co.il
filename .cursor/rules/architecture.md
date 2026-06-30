# Kodem System Architecture

Version: 1.0

---

# Purpose

This document defines how the Kodem system behaves at runtime.

It describes how data flows, how intelligence is generated, and how the system evolves over time.

It does NOT describe folder structure or coding style.

It defines system behavior.

---

# Core Principle

Kodem is an event-driven, intelligence-driven system.

Every meaningful action becomes an Event.

Every Event can produce Intelligence.

Every Intelligence updates the Business Knowledge Model.

---

# System Layers

The system is composed of five runtime layers:

```
User Interaction
    ↓
Modules
    ↓
Events
    ↓
Engines
    ↓
Business Knowledge Model (BKM)
```

---

# 1. User Interaction Layer

This is where users interact with the system.

Includes:

- Web App (Next.js)
- Marketing Site (Astro)
- API calls from external systems

This layer:

✔ Sends commands  
✔ Displays data  
✔ Triggers actions  

This layer does NOT contain business logic.

---

# 2. Modules Layer

Modules are the execution layer of business capabilities.

Examples:

- CRM
- Digital Card
- Marketing
- Insights

Modules:

- Receive user actions
- Validate intent
- Create Events
- Query Business Knowledge
- Render UI state

Modules DO NOT make strategic decisions.

---

# 3. Events Layer (System Backbone)

Everything important becomes an Event.

Examples:

- Lead.Created
- Lead.Contacted
- Campaign.Launched
- BusinessProfile.Updated

Events are:

- Immutable
- Append-only
- Source of truth for system activity

Events are NOT business logic.

They are facts.

---

# Event Flow Rule

Every meaningful module action MUST generate an Event.

No silent state changes are allowed for business actions.

---

# 4. Engines Layer (Intelligence Layer)

Engines are the brain of Kodem.

They consume:

- Events
- Business Knowledge
- External signals (via Integrations)

They produce:

- Insights
- Recommendations
- Predictions
- Knowledge updates

---

## Engine Characteristics

Engines:

✔ Are stateless  
✔ Are deterministic when possible  
✔ Can be async  
✔ Can be replayed from Events  

Engines never:

✘ Modify UI  
✘ Handle HTTP requests  
✘ Contain persistence logic  
✘ Directly call database

---

# 5. Business Knowledge Model (BKM)

The BKM is the system memory of each Workspace.

It represents:

- What the business is
- What it does
- What is happening now
- What should happen next

---

## BKM is updated by:

- Engines
- Learning processes
- Aggregated Events

---

## BKM is used by:

- Modules (UI decisions)
- Engines (analysis context)
- AI (context injection)

---

## BKM is NOT:

- A database table
- A cache
- A report

It is a **living model of the business**

---

# Data Flow (End-to-End)

A full system cycle looks like:

```
User Action
    ↓
Module validates intent
    ↓
Event is created
    ↓
Event is persisted
    ↓
Engine processes Event
    ↓
Engine updates BKM
    ↓
Module reads updated BKM
    ↓
User sees Insight / Result
```

---

# Workspace Isolation

Each Workspace is fully isolated.

Rules:

- No cross-workspace data access
- No shared business state
- No shared BKM
- No shared Events

Workspace is the tenant boundary.

---

# AI in the Architecture

AI is NOT a system layer.

AI is a tool used inside Engines and Modules.

---

## AI Rules:

- AI never owns business logic
- AI outputs must be validated
- AI must always be structured
- AI is optional, not required for system correctness

---

# Real-Time vs Async

Modules:

- Real-time (user interaction)

Events:

- Immediate capture of facts

Engines:

- Async processing
- Eventually consistent updates

BKM:

- Eventually consistent system state

---

# System Consistency Model

Kodem is:

✔ Eventually consistent  
✔ Replayable  
✔ Observable  
✔ Deterministic in business logic layers  

Kodem is NOT:

✘ Strongly consistent across all layers  
✘ Synchronous end-to-end system  

---

# Observability Principle

Every system action must be traceable via Events.

This enables:

- Debugging
- AI reasoning
- Business insights
- Replay / recovery

---

# Golden Rules

## Rule 1

If it changes business state → it must be an Event.

---

## Rule 2

If it interprets meaning → it is an Engine.

---

## Rule 3

If it interacts with user → it is a Module.

---

## Rule 4

If it stores truth → it belongs to BKM or Events.

---

## Rule 5

If it is external → it belongs to Integrations.

---

# Architecture Summary

Kodem is a system where:

- Modules capture reality
- Events record reality
- Engines interpret reality
- BKM represents understanding
- AI enhances interpretation

---

# Final Principle

The system is not a collection of features.

It is a continuous loop of:

Reality → Event → Intelligence → Knowledge → Better Reality