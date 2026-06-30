# Kodem AI Context

Version: 1.0

---

# Purpose

This file provides the primary context for AI-assisted development inside the Kodem repository.

Read this file before making architectural or implementation decisions.

This document summarizes the platform. Detailed rules are located under `.cursor/rules`.

---

# What is Kodem?

Kodem is an AI-powered Business Operating System.

It helps businesses understand themselves, improve continuously, and make better decisions.

Kodem is **not**:

- A CRM
- A Dashboard
- A Website Builder
- An AI Chatbot

Instead, it is a platform that continuously builds and enriches a Business Knowledge Model (BKM) for every business.

---

# Core Architecture

The platform is organized into four conceptual layers.

```text
Platform

↓

Workspace

↓

Business Knowledge Model

↓

Modules
```

Users interact with Modules.

Modules consume Business Knowledge.

Business Knowledge is maintained by Engines.

The Platform provides shared services.

---

# Platform

The Platform provides shared infrastructure.

Examples:

- Authentication
- Authorization
- Subscription Management
- AI Gateway
- Integrations
- Module Catalog
- Feature Flags
- Monitoring
- Logging

There is only one Platform.

---

# Workspace

A Workspace represents a single business.

Everything owned by a customer belongs to a Workspace.

Each Workspace contains:

- Business Profile
- Members
- Events
- Business Knowledge
- Assets
- AI Configuration
- Module Configuration

---

# Business Knowledge Model (BKM)

The Business Knowledge Model is the most valuable asset of Kodem.

The BKM is the platform's understanding of a business.

Every feature should improve it.

Modules consume it.

Engines enrich it.

The BKM is always the source of truth.

---

# Modules

Modules provide business capabilities.

Examples:

Core Modules

- CRM
- Digital Card

Premium Modules

- Marketing
- Insights
- Automation
- Booking

Modules never own business knowledge.

---

# Engines

Engines continuously improve Business Knowledge.

Current Engines:

- Discovery
- Learning
- Insight
- Recommendation
- Rule

Engines never know about UI.

---

# Events

Every meaningful action creates an immutable Event.

Events trigger Workers.

Workers execute Engines.

Engines update Business Knowledge.

---

# AI

All AI communication happens through the AI Gateway.

Never call AI providers directly.

Workspace AI configuration determines which provider or strategy should be used.

Supported strategies include:

- Platform Managed
- Preferred Provider
- Bring Your Own AI

---

# Repository

This repository is an Nx Integrated Monorepo.

Applications:

- marketing (Astro)
- web (Next.js)
- api (NestJS)
- worker (NestJS)

Shared logic belongs inside libs.

Avoid duplicating code between applications.

---

# Development Principles

Always prioritize:

1. Architecture
2. Maintainability
3. Simplicity
4. Reusability
5. Scalability

Never optimize for short-term convenience.

---

# Before Implementing

Always ask:

- Does this belong to the Platform?
- Does this belong to the Workspace?
- Does this improve the Business Knowledge Model?
- Should this generate an Event?
- Can this be reused?
- Does this fit the existing architecture?

If the answer is uncertain, stop and revisit the architecture before implementing.

---

# Rule Files

Before implementing features, consult the following documents:

- `.cursor/rules/product.md`
- `.cursor/rules/glossary.md`
- `.cursor/rules/architecture.md`
- `.cursor/rules/nx.md`
- `.cursor/rules/coding-standards.md`
- `.cursor/rules/ai.md`

These files define the official development rules for the Kodem platform.