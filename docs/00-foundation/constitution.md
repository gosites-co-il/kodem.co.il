# Kodem Constitution

**Version:** 1.0.0  
**Status:** Draft  
**Source of Truth:** Product Principles + WOW Flow

---

# 0. Core Identity

Kodem is a system that continuously builds a live understanding of a business in order to recommend the highest-value next action.

Everything in the platform must serve this purpose.

If a feature does not improve understanding, decision-making, or action — it does not belong in the system.

---

# 1. The WOW Constraint (Highest Priority Rule)

## 1.1 Mandatory First Value

Every new Workspace MUST reach the WOW state defined in `wow-flow.md`.

If a system change breaks the ability to produce:

- Business understanding
- 3–5 insights
- 1 recommended action

It is invalid.

---

## 1.2 No Delayed Value

The system MUST NOT require:

- Setup completion
- Manual configuration
- Data preparation
- Integration dependency

to deliver initial value.

---

## 1.3 Insight First Architecture

The system MUST prioritize:

1. Interpretation
2. Then analytics
3. Then raw data (if ever shown)

---

# 2. Workspace-Centric System

## 2.1 Single Source of Truth

All data, intelligence, and actions belong to a Workspace.

No global business logic exists outside Workspace scope.

---

## 2.2 Isolation

Each Workspace is fully isolated:

- Data
- AI context
- Insights
- Events
- Integrations

---

# 3. Business Knowledge Model

## 3.1 Continuous Understanding

The system does not "store data".

It builds Business Knowledge over time.

---

## 3.2 Business Knowledge Includes

- Business Profile
- Events
- Observations
- Hypotheses
- Insights
- Recommendations
- Historical behavior patterns

---

## 3.3 Learning Requirement

Every system interaction MUST improve Business Knowledge.

If it does not contribute to understanding — it is invalid.

---

# 4. Event-Driven Core

## 4.1 Everything is an Event

All meaningful actions generate Events.

Examples:

- Lead created
- Message sent
- Integration connected
- Task completed

---

## 4.2 Events are immutable

Events:

- Cannot be modified
- Cannot be deleted (logically)
- Are always historical truth

---

## 4.3 Events feed everything

Events are the input for:

- Insight Engine
- Recommendation Engine
- Automation Engine
- Learning Engine

---

# 5. Insight System Rules

## 5.1 No Raw Data Presentation

The system MUST NOT present raw data as primary output.

All data must be interpreted into insights.

---

## 5.2 Insight Requirements

Every Insight MUST include:

- Explanation
- Reason it exists
- Business relevance

Optional:

- Confidence
- Suggested action

---

## 5.3 Action Linkage

Insights should connect to actions whenever possible.

Insight without action path is incomplete.

---

# 6. Recommendation System Rules

## 6.1 Single Action Principle

At early stages (including WOW flow):

- Only ONE primary recommendation MUST be shown

---

## 6.2 Action Clarity

Every recommendation MUST include:

- What to do
- Why it matters
- Expected business impact

---

## 6.3 No Competing Actions

The system MUST avoid:

- Multiple equal CTAs
- Decision overload
- Parallel recommendations in onboarding

---

# 7. AI System Rules

## 7.1 AI is Not Source of Truth

AI MUST only:

- Interpret data
- Summarize information
- Generate hypotheses
- Suggest actions

AI MUST NOT invent business facts.

---

## 7.2 Grounding Requirement

All AI outputs MUST be grounded in:

- Events
- Business Profile
- Integrations
- Observed data

---

## 7.3 Explainability

Every AI output MUST be explainable.

System must be able to answer:

- Why this was generated
- What data it used

---

# 8. Integration Principles

## 8.1 Integrations are Data Sources

Integrations exist to:

- Enrich Business Knowledge
- Generate Events
- Improve Insights

---

## 8.2 No Business Logic in Integrations

Integrations MUST NOT contain:

- Rules
- Decisions
- Business intelligence

They are only data pipelines.

---

# 9. Module System

## 9.1 Modules are Commercial Units

Modules define product packaging:

- Included features
- Paid add-ons
- Feature availability

---

## 9.2 Modules must not affect core architecture

Core system behavior MUST remain independent of:

- Subscription plans
- Module availability

---

# 10. UX Principles (System-Level)

## 10.1 Decision-Centered UI

Every screen MUST answer at least one:

- What should I do next?
- What changed?
- What is important?
- What needs attention?

---

## 10.2 No Empty States Without Guidance

Empty states MUST include:

- Explanation
- First action
- Expected outcome

---

## 10.3 Minimal Cognitive Load

Users MUST NOT need to understand:

- Data structure
- System architecture
- Engine design

Only business meaning.

---

# 11. System Evolution Rules

## 11.1 Progressive Enrichment

The system starts with minimal data and becomes richer over time.

---

## 11.2 No Breaking Changes to WOW Flow

Any change that impacts:

- First Business Understanding
- Insight generation
- Recommendation flow

MUST preserve or improve the WOW experience.

---

## 11.3 Learning is Continuous

Business Knowledge is never complete.

The system continuously updates its understanding.

---

# 12. Hard Constraint Summary

The system is INVALID if:

- It does not deliver value within minutes
- It shows raw data without interpretation
- It provides multiple competing actions in onboarding
- It fails to explain insights
- It depends on heavy setup before value
