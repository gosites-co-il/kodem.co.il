# Kodem Refactor Prompt

Version: 1.0

---

# Purpose

This prompt defines how to safely refactor existing Kodem system components.

Refactoring is NOT feature development.

Refactoring is system improvement without changing external behavior.

---

# Core Principle

Refactor only when:

- System becomes harder to understand
- Duplication appears
- Boundaries are violated
- Architecture drift is detected
- Performance or maintainability is degraded

Never refactor for aesthetic reasons only.

---

# Step 1 — Understand Current System Behavior

Before changing anything:

- Understand what the code currently does
- Identify all affected Modules
- Identify Events involved
- Identify Engines consuming those Events
- Identify BKM impact

If behavior is unclear → stop.

---

# Step 2 — Identify Refactor Type

Classify refactor:

## 1. Structural Refactor
- Folder / library restructuring
- Nx boundary correction
- Module separation or merging

## 2. Logical Refactor
- Business logic cleanup
- Service decomposition
- Rule simplification

## 3. Data Refactor
- Schema changes
- Repository improvements
- Mapper corrections

## 4. Event Refactor
- Event renaming
- Payload restructuring
- Event flow simplification

## 5. Performance Refactor
- Query optimization
- Engine execution improvements
- Reducing unnecessary AI calls

---

# Step 3 — Guarantee Behavioral Consistency

Refactor must NOT change:

- Business behavior
- Event meaning
- BKM truth
- Module responsibilities

If behavior changes → this is NOT refactor, it is a feature.

---

# Step 4 — Event Integrity Rule

Events are immutable contracts.

When refactoring:

- Never silently delete Events
- Never change meaning of Events
- If needed, create new versioned Events

Example:

```
Lead.Created.v1 → Lead.Created.v2
```

---

# Step 5 — Contracts First

Before touching implementation:

- Update or extend Contracts
- Ensure backward compatibility
- Identify consumers of the contract

Contracts are the first layer to change.

---

# Step 6 — Dependency Analysis

Before refactoring:

Map dependencies:

- Modules using the code
- Engines consuming Events
- Integrations involved
- Database dependencies

No refactor should introduce breaking hidden changes.

---

# Step 7 — Nx Structure Validation

Ensure:

- Library boundaries are respected
- No circular dependencies exist
- Code is in correct scope
- Public APIs remain stable

If structure is wrong → fix structure before logic.

---

# Step 8 — Business Knowledge Safety

Ensure:

- BKM is not corrupted
- No duplicate knowledge sources exist
- Engines still produce same meaning
- No silent drift in interpretation

BKM is the source of truth.

---

# Step 9 — Safe Refactoring Strategy

Preferred approach:

## 1. Add new implementation
Do NOT delete old logic immediately

## 2. Migrate consumers gradually

## 3. Validate output consistency

## 4. Remove legacy code only after full migration

---

# Step 10 — AI Safety (if involved)

If AI exists in the flow:

- Ensure prompt behavior remains consistent
- Ensure structured output is unchanged
- Validate schema compatibility
- Avoid model-dependent logic changes

---

# Step 11 — Testing Requirement

Before completing refactor:

Ensure:

- No regression in Events
- No change in BKM output
- Module behavior unchanged
- API contracts unchanged

Refactor must be invisible to end users.

---

# Step 12 — Observability Check

Ensure:

- Events still emitted correctly
- Logs remain consistent
- System traceability is preserved
- Debugging is still possible

---

# Output Requirement

When completing a refactor:

## 1. Refactor Summary

- What was changed
- Why it was needed

## 2. Risk Analysis

- What could break
- What was preserved

## 3. Migration Steps

- How change was applied safely

## 4. System Impact

- Modules affected
- Events affected
- Engines affected

---

# Golden Rule

Refactoring is not rewriting the system.

It is aligning the system back to its intended architecture.

---

# Final Principle

A well-designed system should become easier to refactor over time, not harder.