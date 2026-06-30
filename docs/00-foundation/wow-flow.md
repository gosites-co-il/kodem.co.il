# Kodem - WOW Flow (First Hour Experience)

**Version:** 1.0.0  
**Status:** Draft  
**Location:** docs/00-foundation/wow-flow.md

---

# Purpose

This document defines the first-time user experience in Kodem.

The goal is to deliver real business value within minutes of signup.

The user must experience:

- Immediate business understanding
- Actionable insights
- A clear recommended next step

No configuration-heavy onboarding is allowed.

---

# Core Principle

> The product is proven in the first 5 minutes, not after setup.

---

# Target Outcome

Within 60 minutes, every new Workspace must have:

1. A generated Business Profile (v0)
2. 3–5 meaningful Insights
3. 1 clear Recommended Action
4. A visible "WOW moment" in the dashboard

---

# Step 1 — Signup (0–2 minutes)

## Goal
Minimal friction entry into the system.

## Flow

- Email / Google login
- Workspace name (auto-derived from domain if available)

## After signup

User sees:

> “Let’s understand your business”

Single CTA:

👉 Continue

No other options.

---

# Step 2 — Business Discovery (2–10 minutes)

## Goal
Automatically understand the business with minimal user input.

## Primary Data Source

### Website (if available)

The system must crawl and analyze:

- Homepage
- Services / Products page
- Contact page
- About page

## Extracted Data

- Business type (industry inference)
- Services offered
- Target audience
- Contact methods
- Location signals
- Call-to-action patterns
- Messaging tone

---

## Fallback (no website)

If no website exists:

Ask ONLY ONE question:

> “What does your business do?”

No additional questions in this stage.

---

## Optional Integrations (skippable)

User may optionally connect:

- Google
- Meta
- WhatsApp

Important:

- These are NOT required for onboarding completion
- User must be able to proceed without them

---

# Step 3 — Business Profile Creation (10–30 minutes async)

## Goal
Build initial understanding of the business.

## Output

A first version of:

> Business Profile v0

## Contains:

- Industry classification (AI inferred)
- Core services
- Customer type estimation
- Communication channels
- Business positioning hypothesis

---

## Engines Running

### 1. Discovery Engine
Extracts structured business information from unstructured sources.

### 2. Pattern Engine (Rules v0)
Identifies obvious gaps:

- Missing CTA
- Missing contact clarity
- Weak service hierarchy

### 3. Insight Engine (v0)
Generates 3–5 initial insights only.

---

# Step 4 — WOW Dashboard (0–30 minutes after signup)

## Goal
Deliver immediate perceived value.

## Constraint

Only show insights AFTER at least minimal Business Profile exists.

---

## Dashboard Structure

Title:

> “Here’s what we found about your business”

---

## Content Rules

- Maximum 5 cards
- No raw data tables
- No configuration UI
- No empty states without guidance

---

## Required Insight Types

### 1. Business Understanding

Explains what the business does.

Example:

- Industry classification
- Main services
- Communication method

---

### 2. Conversion Insight

Identifies a possible friction point.

Example:

- Missing or unclear CTA
- Low visibility of contact method

---

### 3. Structure Insight

Explains clarity of services or offering.

Example:

- Too many services
- No prioritization

---

### 4. Opportunity Insight

Shows potential improvement.

Example:

- Adding WhatsApp increases conversion

---

### 5. Recommended Action (CRITICAL)

Only ONE action is shown.

Must include:

- What to do
- Why it matters
- Expected impact (approximate)

---

# Step 5 — Immediate Activation (30–60 minutes)

## Goal
Convert insight into action.

## Flow

User is guided to ONE of:

- Edit Digital Card
- Add CTA
- Connect WhatsApp
- Improve contact flow

---

## Rule

No multiple competing actions.

Only one primary action is allowed at this stage.

---

# Design Principles of WOW Flow

## 1. No Setup Dependency

User does NOT need to configure anything to get value.

---

## 2. Progressive Understanding

System improves understanding over time:

- Website → basic profile
- Integrations → deeper understanding
- User activity → refinement

---

## 3. Insight Before Analytics

The system never shows raw dashboards first.

It shows interpretation.

---

## 4. Single Action Focus

Every stage must have one dominant next step.

---

## 5. Real Business Reflection

Insights must reflect reality, not placeholders or templates.

---

# Definition of WOW Moment

The WOW moment occurs when:

- The user sees their business correctly described
- 3–5 meaningful insights are presented
- At least one issue or opportunity is identified
- A single clear recommendation is provided
- The recommendation feels immediately actionable

---

# Success Criteria

The WOW flow is successful if:

- User understands value within 5 minutes
- User believes system "understands their business"
- User clicks or acts on at least one recommendation
- User proceeds to connect more data sources

---

# End of Document