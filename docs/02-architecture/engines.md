# Kodem Architecture - Engines Model

**Version:** 1.0.0  
**Status:** Draft  
**Source of Truth:** Constitution + Product Principles

---

# 0. Core Idea

Kodem is not a monolithic system.

It is a set of independent engines that continuously build understanding of a business and convert it into action.

Each engine has a single responsibility.

All engines operate on the same underlying data model: the Workspace.

---

# 1. High-Level Architecture

## Engines Pipeline

```
Data Sources → Discovery Engine → Business Knowledge → Intelligence Engines → Actions
```

---

## Core Engines

1. Discovery Engine
2. Event Engine
3. Business Knowledge Engine
4. Insight Engine
5. Recommendation Engine
6. Rule Engine
7. Learning Engine

---

# 2. Discovery Engine

## Responsibility

The Discovery Engine is responsible for understanding a business from external and internal sources.

---

## Inputs

- Website
- User input
- Initial onboarding answers
- Basic integrations (optional)

---

## Outputs

- Initial Business Profile (v0)
- Extracted services
- Business classification
- Communication channels
- Hypotheses about the business

---

## Key Principle

> The system must understand the business before asking the user questions.

---

# 3. Event Engine

## Responsibility

The Event Engine captures everything that happens in the system.

---

## Events Include

- Lead created
- Message sent
- Integration connected
- Task completed
- Insight generated

---

## Key Principle

> Everything meaningful becomes an Event.

---

# 4. Business Knowledge Engine

## Responsibility

The Business Knowledge Engine maintains the evolving understanding of the Workspace.

---

## It Aggregates

- Business Profile
- Events
- Observations
- Hypotheses
- Insights

---

## Output

- Business Knowledge Graph (logical, not necessarily graph DB)
- Context for all AI systems

---

## Key Principle

> The system does not store data — it builds understanding.

---

# 5. Insight Engine

## Responsibility

Transforms Business Knowledge into meaningful insights.

---

## Inputs

- Business Knowledge
- Events
- Rules
- AI analysis

---

## Outputs

- Insights (3–5 in WOW stage)
- Explanations
- Confidence score

---

## Insight Structure

Each Insight MUST include:

- What is happening
- Why it matters
- Supporting data
- Optional confidence

---

## Key Principle

> Insights explain reality.

---

# 6. Recommendation Engine

## Responsibility

Transforms Insights into actionable next steps.

---

## Inputs

- Insights
- Business context
- Rules

---

## Outputs

- Single primary recommendation (WOW stage)
- Action plan
- Expected impact

---

## Key Principle

> Recommendations define what to do next.

---

# 7. Rule Engine

## Responsibility

Evaluates deterministic business logic.

---

## Examples

- If response time > X → trigger insight
- If no CTA detected → generate recommendation
- If lead created → create task

---

## Key Principle

> Rules are deterministic; insights are interpretative.

---

# 8. Learning Engine

## Responsibility

Continuously improves Business Knowledge over time.

---

## Learns from:

- User behavior
- Event patterns
- Integration data
- Outcomes of recommendations

---

## Output

- Updated hypotheses
- Improved confidence scores
- Better recommendations over time

---

## Key Principle

> The system becomes smarter with usage.

---

# 9. Engine Interaction Model

## Flow

### Step 1: Discovery Engine
Build initial understanding

↓

### Step 2: Event Engine
Starts capturing activity

↓

### Step 3: Business Knowledge Engine
Aggregates everything

↓

### Step 4: Insight Engine
Interprets reality

↓

### Step 5: Recommendation Engine
Suggests action

↓

### Step 6: Learning Engine
Improves future cycles

---

# 10. Critical Architectural Rules

## 10.1 No Engine Overlap

Each engine MUST have a single responsibility.

---

## 10.2 No Direct UI Logic

Engines MUST NOT know about UI.

They only produce structured outputs.

---

## 10.3 Event-Driven System

All engines react to Events, not direct function calls.

---

## 10.4 Business Knowledge is Central

All engines read from and write to Business Knowledge.

---

## 10.5 No Hard Dependency on AI

AI is a tool inside engines, not an engine itself.

---

# 11. WOW Flow Dependency

The WOW experience depends on:

- Discovery Engine → understanding
- Insight Engine → interpretation
- Recommendation Engine → action

If any of these fail → WOW fails.

---

# 12. Minimum Viable Engine Set (MVP)

To launch Kodem, only these are required:

- Discovery Engine
- Event Engine
- Insight Engine (v0 rules + AI)
- Recommendation Engine (single action logic)

Optional later:

- Learning Engine (advanced)
- Rule Engine (full system automation)