# Kodem Nx Workspace Standards

Version: 1.0

---

# Purpose

This document defines how the Kodem platform is organized inside the Nx monorepo.

The workspace structure reflects the business architecture of the platform.

Every application and library has a single responsibility.

The goal is to create a repository that remains maintainable as the platform grows.

---

# Monorepo Principles

The Nx workspace exists to:

- Keep applications thin
- Maximize code reuse
- Enforce architectural boundaries
- Enable independent feature development
- Improve build performance
- Improve testing
- Scale safely

Applications compose.

Libraries implement.

---

# High Level Structure

```
apps/
libs/
tools/
docs/
.cursor/
```

Applications are entry points.

Libraries contain reusable implementation.

---

# Applications

Current applications:

```
apps/

marketing/      Astro marketing website

app/            Next.js SaaS application

api/            NestJS REST API

worker/         NestJS background workers
```

Applications should contain only:

- routing
- composition
- configuration
- dependency wiring

Applications should NOT contain:

- business logic
- domain models
- repositories
- AI logic
- integrations

---

# Library Categories

Libraries are grouped by responsibility.

```
libs/

platform/

workspace/

modules/

engines/

integrations/

database/

shared/
```

Each category has a specific purpose.

---

# Platform Libraries

Platform libraries provide global platform capabilities.

Examples:

```
platform/

auth/

billing/

subscription/

ai/

notifications/

feature-flags/

logging/

monitoring/
```

Platform libraries:

✔ reusable

✔ global

✔ independent from business modules

Platform libraries never depend on Modules.

---

# Workspace Libraries

Workspace libraries represent the business itself.

Examples:

```
workspace/

profile/

members/

permissions/

settings/

branding/
```

Workspace is the tenant boundary.

Everything owned by a customer belongs here.

---

# Module Libraries

Modules expose business capabilities.

Examples:

```
modules/

crm/

digital-card/

marketing/

insights/

automation/

booking/
```

Each module owns:

- UI
- API contracts
- feature services
- application logic

Modules never own Business Knowledge.

---

# Engine Libraries

Engines create intelligence.

Examples:

```
engines/

discovery/

learning/

recommendation/

insight/

rule/
```

Engines consume:

Events

Business Knowledge

AI

Integrations

Engines produce:

Observations

Insights

Recommendations

Knowledge Updates

---

# Integration Libraries

Every external system belongs here.

Examples:

```
integrations/

google/

meta/

stripe/

whatsapp/

search-console/

openai/
```

Integrations contain:

API clients

OAuth

SDK wrappers

Webhooks

Provider mappings

No business logic.

---

# Database Libraries

Database libraries contain persistence only.

Examples:

```
database/

prisma/

repositories/

migrations/

seed/
```

Database libraries should never contain business logic.

---

# Shared Libraries

Shared libraries contain generic reusable code.

Examples:

```
shared/

ui/

types/

utils/

validation/

config/
```

Shared libraries must never contain business-specific knowledge.

---

# Library Responsibilities

Every library should answer one question:

"What business capability does this implement?"

If the answer is unclear,

the library should not exist.

---

# Dependency Direction

Allowed dependency flow:

```
Platform

↓

Workspace

↓

Modules

↓

Applications
```

Engines may depend on:

Workspace

Platform

Integrations

Database

Shared

Modules should never directly depend on Engines.

Communication should happen through contracts or events.

---

# Public API

Every library exposes a single public API.

Example:

```
index.ts
```

Only export stable interfaces.

Never expose internal implementation.

---

# Import Rules

Good

```ts
import { LeadService } from '@kodem/modules/crm';
```

Bad

```ts
import { LeadService } from '../../../../services/lead.service';
```

Never import internal files.

Never bypass public APIs.

---

# Tags

Every library must have Nx tags.

Examples:

```
scope:platform

scope:workspace

scope:module

scope:engine

scope:integration

scope:shared

scope:database
```

Additional tags:

```
type:feature

type:data

type:ui

type:util

type:api
```

Boundary rules should be enforced through Nx.

---

# Folder Structure

Organize by feature.

Avoid technical folders such as:

```
controllers/

services/

repositories/
```

at the root of large libraries.

Instead:

```
crm/

lead/

contact/

pipeline/
```

Each feature owns everything it needs.

---

# Library Size

Prefer many focused libraries.

Avoid giant libraries.

When a library becomes difficult to understand,

split it.

---

# Shared Code Rule

Before moving code into shared ask:

Will this be reused by at least two libraries?

If not,

keep it local.

---

# Business Logic

Business logic belongs inside:

Workspace

Modules

Engines

Never inside:

Apps

Database

Shared

Integrations

---

# UI

UI belongs inside Modules.

Business rules belong in backend libraries.

React components should remain presentation-focused.

---

# Workers

Workers orchestrate background execution.

Workers should:

Consume Events

Execute Engines

Call Integrations

Schedule Jobs

Workers should never implement business rules.

---

# AI

AI providers belong behind the AI Gateway.

Never call providers directly from Modules.

Never call providers directly from Engines.

Always use the Platform AI abstraction.

---

# Feature Development

Every new feature should answer:

Which Module owns it?

Which Workspace data does it affect?

Does it update Business Knowledge?

Should it create Events?

Does it require an Engine?

---

# Creating a New Library

Before creating a library ask:

Can an existing library be extended?

Is this a reusable capability?

Does it represent a business concept?

Will another module depend on it?

Avoid creating libraries prematurely.

---

# Code Ownership

Each library should have a clear owner.

Avoid shared ownership of business logic.

Business rules should exist only once.

---

# Testing

Libraries should be independently testable.

Prefer testing at library boundaries.

Applications should contain minimal tests.

---

# Performance

Use Nx affected commands whenever possible.

Avoid rebuilding the entire workspace.

Keep dependencies small.

Prefer incremental builds.

---

# Golden Questions

Before adding code ask:

Does it belong in the correct library?

Can another library reuse it?

Does it violate dependency rules?

Does it increase coupling?

Does it match the Platform architecture?

---

# Golden Rule

The Nx workspace is a reflection of the Kodem architecture.

If the repository structure becomes confusing,

the architecture has already started to decay.