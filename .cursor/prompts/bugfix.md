# Kodem Bug Fix Prompt

Version: 1.0

---

# Purpose

This prompt defines how to safely fix bugs inside the Kodem platform.

Bug fixing is not feature development.

Bug fixing is not refactoring.

Bug fixing is restoring expected system behavior.

---

# Core Principle

A bug is a deviation between:

Expected system behavior  
vs  
Actual system behavior

Nothing more.

---

# Step 1 — Reproduce the Issue

Before fixing anything:

- Reproduce the bug
- Identify exact conditions
- Identify affected Module
- Identify related Events
- Identify Engines involved
- Identify BKM impact

If bug cannot be reproduced → do not fix.

---

# Step 2 — Classify the Bug

## 1. UI Bug
- Rendering issue
- State inconsistency
- Frontend logic error

## 2. Module Bug
- Incorrect business flow
- Wrong validation
- Missing Event emission

## 3. Event Bug
- Missing Event
- Duplicate Event
- Incorrect Event payload
- Event ordering issue

## 4. Engine Bug
- Wrong inference
- Incorrect Insight
- Misinterpreted Events
- AI misalignment

## 5. Data Bug
- Incorrect persistence
- Missing relations
- Wrong mapping
- Corrupted BKM state

## 6. Integration Bug
- External API failure
- Webhook issues
- Authentication issues

---

# Step 3 — Identify Root Cause

Never fix symptoms.

Always trace:

- Where the incorrect state originated
- Which layer introduced it
- Why the system allowed it

---

# Step 4 — Event Traceability Check

Because Kodem is event-driven:

Always check:

- Which Event triggered the bug state?
- Was an Event missing?
- Was an Event duplicated?
- Was Event processing incorrect?

Most bugs are Event-chain issues.

---

# Step 5 — Business Knowledge Validation

Verify:

- Is BKM correct?
- If not, how did it become inconsistent?
- Which Engine or Event caused drift?

BKM is the system truth layer.

---

# Step 6 — Fix Strategy Selection

## Option A — Local Fix
Fix in Module or UI only

Use when:
- Behavior is isolated
- No Event or BKM impact

---

## Option B — Event Fix
Fix Event emission or handling

Use when:
- Flow is incorrect
- Missing or wrong Events

---

## Option C — Engine Fix
Fix intelligence logic

Use when:
- Insights are incorrect
- AI or rule logic is wrong

---

## Option D — Data Fix
Fix persistence layer

Use when:
- Data is corrupted
- Mapping is wrong
- Repository issue

---

# Step 7 — Do NOT Break Event History

Never:

✘ Delete Events  
✘ Modify past Events  
✘ Change meaning of Events silently  

If correction is required:

✔ Create compensating Event  
✔ Version Event if needed  

---

# Step 8 — Preserve System Contracts

Ensure:

- Contracts remain backward compatible
- DTOs are not breaking consumers
- API behavior is stable

---

# Step 9 — Validate Workspace Isolation

Ensure bug fix does NOT:

- Leak data between Workspaces
- Affect other tenants
- Modify shared state incorrectly

---

# Step 10 — AI Validation (if involved)

If AI contributed:

- Validate output schema
- Ensure deterministic fallback exists
- Check prompt correctness
- Ensure no hallucinated data entered system

---

# Step 11 — Testing Requirement

Before completion:

- Reproduce bug → confirm failure
- Apply fix → confirm resolution
- Ensure no regression in related flows
- Validate Events still correct
- Validate BKM consistency

---

# Step 12 — Observability Check

Ensure:

- Event chain is still traceable
- Logs show correct flow
- Debugging remains possible
- No hidden state corruption exists

---

# Output Requirement

When finishing bug fix:

## 1. Root Cause Analysis

- Where bug originated
- Why it happened

## 2. Fix Summary

- What was changed
- Which layer was affected

## 3. Risk Analysis

- What could break
- Why it is safe

## 4. Verification Steps

- How to confirm fix works

---

# Golden Rule

A bug fix that introduces new inconsistencies is worse than the original bug.

---

# Final Principle

Kodem bug fixing is not patching code.

It is restoring system correctness across all layers: Modules → Events → Engines → BKM.