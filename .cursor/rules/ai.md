# Kodem AI System Rules

Version: 1.0

---

# Purpose

This document defines how AI is used inside the Kodem platform.

AI is a capability layer — not a system layer.

AI must never own business logic or system truth.

---

# Core Principle

AI enhances intelligence.

It does not define reality.

---

# AI Position in the Architecture

AI is used inside:

- Modules (for assistance)
- Engines (for interpretation)
- Integrations (for providers)

AI is NOT a standalone layer.

AI is NOT part of system truth.

---

# Forbidden Responsibilities

AI must NEVER:

✘ Decide business rules  
✘ Modify database directly  
✘ Create Events without validation  
✘ Override deterministic logic  
✘ Replace Engines  
✘ Replace Business Knowledge Model (BKM)

---

# Allowed Responsibilities

AI MAY:

✔ Summarize data  
✔ Classify inputs  
✔ Suggest actions  
✔ Generate insights (proposed, not final)  
✔ Assist Engines  
✔ Enrich Business Knowledge (after validation)  

---

# AI Output Rule

All AI outputs MUST be:

- Structured
- Validated
- Interpretable
- Schema-based when possible

Unstructured free-text outputs are discouraged in production flows.

---

# AI Gateway Rule

All AI access must go through the AI Gateway.

Never call external AI providers directly.

The AI Gateway handles:

- Provider selection
- Prompt management
- Response validation
- Fallback logic
- Cost control

---

# Determinism Rule

Business logic must remain deterministic.

AI outputs are:

- Probabilistic
- Non-deterministic
- Advisory only

Therefore:

AI can suggest → system decides.

---

# AI in Modules

Modules may use AI for:

- User assistance
- Content generation
- Classification
- Form completion
- Lead enrichment

But Modules must always validate AI outputs before applying them.

---

# AI in Engines

Engines use AI for:

- Pattern detection
- Insight generation
- Recommendation creation
- Knowledge enrichment

But Engines must combine AI with:

- Events
- Rules
- Business Knowledge

AI alone is never sufficient.

---

# AI + Events Rule

AI is NOT allowed to directly emit Events.

Flow must always be:

```
AI Suggestion
    ↓
Engine Validation
    ↓
Event Creation (deterministic)
```

---

# AI + Business Knowledge Rule

AI can propose updates to the BKM.

But:

✔ Engine validates  
✔ Rules engine approves  
✔ System applies change  

AI never directly mutates BKM.

---

# Structured AI Output Standard

Whenever possible AI outputs must follow schemas like:

Example:

```ts
LeadInsight {
  score: number
  reason: string
  confidence: number
}
```

Unstructured text is considered legacy behavior.

---

# AI Failure Handling

AI is unreliable by design.

System must handle:

- Timeout
- Invalid schema
- Hallucinated data
- Missing fields
- Partial responses

Fallback behavior is mandatory.

---

# Multi-AI Strategy

Workspace may define AI strategy:

- Platform-managed AI
- Preferred provider
- Bring-your-own API key

But architecture remains unchanged regardless of provider.

---

# Cost Awareness

AI calls are expensive system operations.

Rules:

- Avoid unnecessary calls
- Cache results when possible
- Batch processing preferred in Engines
- Do not use AI for deterministic logic

---

# AI in Business Context

AI must always be aware of:

- Workspace context
- Business Knowledge Model
- Event history

AI without context is invalid.

---

# AI Safety Rule

AI must never:

- Leak data across Workspaces
- Access unauthorized data
- Infer hidden sensitive information

Workspace isolation applies strictly.

---

# AI vs Engine Responsibility

| Responsibility | AI | Engine |
|----------------|----|--------|
| Suggest insights | ✔ | ✔ |
| Decide actions | ✘ | ✔ |
| Create events | ✘ | ✔ |
| Validate logic | ✘ | ✔ |
| Generate ideas | ✔ | ✔ |

---

# Golden Rule

AI is a co-pilot — never the pilot.

---

# System Design Principle

If AI disappears, the system must still function correctly.

AI improves the system.

It does not define it.

---

# Final Principle

Kodem is not an AI product.

Kodem is a business intelligence system that uses AI as an enhancement layer.