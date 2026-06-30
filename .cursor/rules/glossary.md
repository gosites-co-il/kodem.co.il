# Kodem Glossary

Version: 1.0

---

# Purpose

This glossary defines the official language of the Kodem platform.

All code, documentation, prompts, comments, pull requests and architectural discussions should use these terms consistently.

Avoid introducing synonyms when an official term already exists.

---

# Platform

The global SaaS platform operated by Kodem.

The Platform owns:

- Authentication
- Subscription Management
- AI Gateway
- Module Catalog
- Integration Catalog
- Shared Infrastructure
- Global Configuration

The Platform is NOT a Workspace.

There is only one Platform.

---

# Workspace

A Workspace represents a single business.

Everything owned by a customer belongs to a Workspace.

Examples:

- Business Profile
- Members
- Events
- Assets
- Business Knowledge
- Modules
- AI Configuration

A Workspace is the primary tenant of the platform.

---

# Member

A Member is a user inside a Workspace.

A Member always belongs to a Workspace.

Examples:

- Owner
- Manager
- Employee
- Marketing Manager

Users may belong to multiple Workspaces.

Members do not.

---

# User

A User represents a person authenticated by the Platform.

Users can belong to multiple Workspaces.

Permissions are granted through Membership.

---

# Business Profile

The structured identity of the business.

Includes:

- Name
- Brand
- Industry
- Website
- Contact Details
- Locations
- Social Accounts

The Business Profile describes who the business is.

---

# Business Knowledge Model (BKM)

The most valuable asset in Kodem.

The Business Knowledge Model represents everything the platform knows about a business.

It evolves continuously.

It includes:

- Facts
- Relationships
- Goals
- Products
- Services
- Audience
- History
- Observations
- Patterns
- Hypotheses
- Insights
- Recommendations

Every interaction should enrich the BKM.

The BKM is always the source of truth.

---

# Event

An immutable record describing something that happened.

Examples:

Lead.Created

Campaign.Published

BusinessProfile.Updated

Recommendation.Accepted

Events drive the entire platform.

---

# Event Stream

The chronological history of all events inside a Workspace.

Engines consume Event Streams.

---

# Engine

An Engine analyzes Business Knowledge and Events.

Engines produce intelligence.

Engines never own data.

Current engines:

- Discovery
- Learning
- Insight
- Recommendation
- Rule

Future engines may be added.

---

# Module

A Module provides business capabilities.

Modules consume Business Knowledge.

Modules never become the source of truth.

Examples:

CRM

Digital Card

Marketing

Insights

Automation

Booking

Modules may be included in subscription plans or purchased separately.

---

# Insight

An explanation.

An Insight answers:

"What is happening?"

Examples:

Lead conversion decreased.

Traffic increased from Google.

Response time improved.

Insights explain reality.

---

# Recommendation

An action.

A Recommendation answers:

"What should the business do next?"

Every Recommendation should include:

- Reason
- Priority
- Expected Impact

---

# Observation

A detected fact.

Examples:

Traffic increased.

Sales decreased.

New visitors doubled.

Observations may later become Insights.

---

# Hypothesis

A possible explanation.

Hypotheses require validation.

They should never be presented as facts.

---

# Rule

A deterministic business rule.

Rules are not AI.

Examples:

Notify owner when lead value exceeds threshold.

Mark recommendation as stale after 30 days.

---

# AI Gateway

The platform abstraction responsible for AI providers.

The AI Gateway hides provider implementation details.

Supported providers may include:

- OpenAI
- Gemini
- Claude
- Azure OpenAI

Future providers can be added without changing business logic.

---

# AI Strategy

Defines how a Workspace consumes AI.

Possible strategies:

Platform Managed

Preferred Provider

Bring Your Own AI

Future strategies may be added.

---

# Connection

A configured integration between a Workspace and an external provider.

Examples:

Google Analytics

Google Ads

Meta

WhatsApp

Stripe

Search Console

A Connection belongs to a Workspace.

---

# Integration

A reusable connector implemented by the Platform.

Integrations are shared across all Workspaces.

Connections use Integrations.

---

# Asset

A digital resource owned by a Workspace.

Examples:

Logo

Images

Documents

Videos

Landing Pages

Digital Card Assets

---

# Subscription

The commercial agreement between a Workspace and the Platform.

Subscriptions determine:

- Enabled Modules
- AI Strategy
- Usage Limits
- Feature Access

---

# Plan

A predefined subscription offering.

Examples:

Starter

Pro

Business

Enterprise

---

# Feature Flag

A platform-controlled capability toggle.

Feature Flags are managed globally.

---

# Workspace Configuration

Settings specific to a Workspace.

Examples:

Language

Timezone

Currency

Notifications

AI Settings

Brand Settings

---

# Source of Truth

The authoritative representation of business knowledge.

In Kodem:

Business Knowledge Model is always the Source of Truth.

Modules are never the Source of Truth.

---

# Golden Language Rules

Say:

Workspace

Never:

Customer Database

---

Say:

Business Knowledge Model

Never:

Internal Cache

---

Say:

Engine

Never:

Background Service

---

Say:

Module

Never:

Feature Group

---

Say:

Connection

Never:

OAuth Record

---

Say:

Platform

Never:

Backend

---

# Final Principle

If a new concept is introduced, add it to this glossary before implementing it.