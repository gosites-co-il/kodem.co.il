# Kodem Engineering Standards

Version: 1.0

---

# Purpose

This document defines the engineering standards for the Kodem platform.

Every Pull Request, generated code, and AI-assisted implementation must follow these standards.

The goal is long-term maintainability, consistency and scalability.

When in doubt, choose readability over cleverness.

---

# Engineering Principles

## Write code for humans

Code is read far more often than it is written.

Optimize for readability.

---

## Simplicity wins

Prefer simple solutions.

Avoid unnecessary abstractions.

Avoid premature optimization.

---

## Consistency over preference

Follow the existing architecture.

Do not introduce personal coding styles.

Consistency is more valuable than perfection.

---

## Architecture before implementation

Never implement a feature that violates the platform architecture.

When architecture and implementation conflict, revisit the architecture.

---

# General TypeScript Rules

Strict mode is mandatory.

Never disable strict typing.

Avoid using:

- any
- unknown (unless required)
- @ts-ignore

Prefer:

- explicit interfaces
- readonly properties
- discriminated unions
- utility types

---

# Naming

Use descriptive names.

Good

```ts
workspaceRepository
```

Bad

```ts
repo
```

Good

```ts
createLead()
```

Bad

```ts
save()
```

Avoid abbreviations.

---

# Functions

Functions should perform one responsibility.

Prefer:

```ts
createLead()

assignLead()

qualifyLead()
```

Instead of:

```ts
processLead()
```

---

Maximum function size:

~40 lines.

If a function becomes difficult to understand, split it.

---

# Classes

Keep classes focused.

Prefer composition over inheritance.

Services should have one responsibility.

Avoid "God Services".

---

# Dependency Injection

Always inject abstractions.

Never instantiate dependencies directly.

Good

```ts
constructor(
    private readonly repository: LeadRepository
) {}
```

Bad

```ts
const repository = new LeadRepository()
```

---

# Folder Structure

Organize by feature.

Not by technical layer.

Good

```
crm/

    lead/

    contact/

    pipeline/
```

Avoid

```
controllers/

services/

repositories/
```

inside large modules.

Each feature owns its implementation.

---

# DTOs

DTOs describe API contracts only.

DTOs are never entities.

DTOs never contain business logic.

---

Naming

CreateLeadDto

UpdateLeadDto

LeadResponseDto

---

# Domain Models

Business models must not depend on NestJS.

Business models must not depend on Prisma.

Business models must remain framework-independent.

---

# Business Logic

Business logic belongs inside:

- Domain Services
- Engines
- Domain Models

Business logic never belongs inside:

- Controllers
- React Components
- DTOs
- Prisma Models

---

# Controllers

Controllers orchestrate.

Controllers do not decide.

Controllers should:

- Validate
- Authenticate
- Authorize
- Call Application Services
- Return responses

Nothing more.

---

# React Components

Components should remain presentational whenever possible.

Avoid business logic inside components.

Move logic into:

- hooks
- services
- state managers

---

# Hooks

Hooks encapsulate behavior.

Keep hooks reusable.

Avoid giant hooks.

---

# State Management

Store only UI state.

Business state belongs to the backend.

Avoid duplicating backend business rules.

---

# Prisma

Prisma models represent persistence.

They are not business models.

Never expose Prisma models directly to the UI.

Use mapping.

---

# Database

Every table should include:

- id
- workspaceId (when applicable)
- createdAt
- updatedAt

Prefer UUIDs.

Soft delete where appropriate.

---

# Workspace Isolation

Every query must respect Workspace boundaries.

Never expose data across Workspaces.

Workspace isolation is mandatory.

---

# Events

Every meaningful business action should generate an Event.

Events are immutable.

Events should describe something that happened.

Examples

Lead.Created

Lead.Assigned

Campaign.Published

---

# Error Handling

Never throw generic errors.

Prefer domain-specific errors.

Example

LeadNotFoundError

WorkspaceAccessDeniedError

InvalidCampaignStateError

---

# Logging

Use structured logging.

Never log:

Passwords

Tokens

Secrets

Personal sensitive information

Every log should include:

WorkspaceId

CorrelationId

Timestamp

---

# Validation

Validate input as early as possible.

Never trust client input.

Always validate:

API

Workers

External integrations

---

# Async Operations

Long-running tasks should execute in Workers.

Avoid blocking HTTP requests.

---

# AI

AI responses must always be validated.

Never trust LLM output.

Prefer structured JSON responses.

Business rules never depend solely on AI.

---

# Comments

Write code that explains itself.

Comments should explain "why".

Never explain obvious code.

---

# Testing

Prefer integration tests for business flows.

Unit test:

- Engines
- Business Rules
- Domain Services

Avoid testing framework internals.

---

# Performance

Optimize only after measuring.

Never sacrifice readability for micro-optimizations.

---

# Security

Never expose secrets.

Never trust user input.

Always authorize Workspace access.

Escape output when necessary.

Follow the principle of least privilege.

---

# Code Reviews

Every change should improve at least one of:

- Readability
- Simplicity
- Reusability
- Testability
- Maintainability

---

# Golden Questions

Before writing code ask:

Does this belong here?

Can this be reused?

Is this the simplest solution?

Does this respect Workspace boundaries?

Does this improve Business Knowledge?

Would another developer understand this in six months?

---

# Golden Rule

Future developers—including AI—should immediately understand why the code exists, where it belongs, and how it fits into the Kodem architecture.



---

# AI Coding Rules

Cursor is treated as a Senior Software Engineer working on the Kodem platform.

Generated code must follow all architectural and engineering rules.

When uncertain, ask for clarification instead of making assumptions.

---

## Think Before Coding

Always analyze the request before writing code.

Understand:

- The business goal
- The architectural impact
- Existing implementations
- Potential side effects

Prefer proposing improvements before implementing them.

---

## Search Before Creating

Before creating:

- Components
- Services
- Hooks
- Utilities
- Types
- DTOs
- Interfaces

Always search the repository for an existing implementation.

Prefer extending existing code over creating duplicates.

---

## Respect the Architecture

Never violate architectural boundaries.

Never bypass:

- Platform
- Workspace
- Business Knowledge
- Engines
- Module Boundaries

If the requested implementation conflicts with the architecture, explain why before proceeding.

---

## Build Vertical Slices

Implement complete features.

Avoid creating empty folders, placeholder classes or speculative abstractions.

Only build what is needed for the current milestone.

---

## Production Ready

Generated code should be production-ready.

Avoid:

- TODO
- FIXME
- Placeholder implementations
- Fake data
- Mock business logic

Unless explicitly requested.

---

## Small Commits

Every implementation should represent one logical change.

Avoid modifying unrelated files.

Keep Pull Requests focused.

---

## Explain Important Decisions

When introducing:

- New patterns
- New dependencies
- Architectural changes

Always explain:

- Why
- Alternatives
- Trade-offs

---

## Avoid Over Engineering

Do not introduce abstractions for hypothetical future requirements.

Prefer simple solutions.

Expand only when necessary.

---

## Follow Existing Patterns

When multiple implementations exist, follow the dominant repository pattern.

Do not introduce competing patterns.

Consistency is more important than novelty.

---

## Protect Business Knowledge

Business Knowledge is the heart of Kodem.

Never duplicate it.

Never bypass it.

Never move business logic into the UI.

Every implementation should strengthen the Business Knowledge Model.

---

## AI Responsibility

Cursor is responsible for maintaining long-term code quality.

Optimize for:

- Readability
- Simplicity
- Maintainability
- Scalability

Never optimize for writing less code.

Optimize for writing better code.

---

## Golden Question

Before generating code ask:

"Is this how I would implement it if this project had to be maintained for the next 10 years?"

