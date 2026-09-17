# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary audiences:

- Small and medium-sized businesses (SMBs) that need a single place to manage leads, customers, and growth work
- Marketing agencies that run client acquisition and retention workflows
- Account managers who own day-to-day lead follow-up and client relationships

Situation: teams juggle leads, outreach, and marketing performance across tools; they need operational CRM workflows first, then broader growth surfaces over time.

## Product Purpose

KODEM (Kodem) is a web platform for SMBs, agencies, and account managers to run customer acquisition and relationship work in one system.

The product story spans:

- CRM
- Lead management
- Automations
- SEO and marketing analytics
- Digital business card
- Product catalog

Success means users can capture and work leads reliably, keep relationships moving, and expand into marketing and presence surfaces without switching systems.

## Positioning

KODEM is an integrated business growth workspace: CRM and lead management at the core, with automations, marketing analytics, digital business card, and product catalog as part of the same product surface — not a stand-alone single-feature tool.

## Operating Context

- Hebrew-first, RTL web product (`apps/app` SaaS UI and `apps/marketing` public site)
- Workspace-centric multi-user product with roles (owner, admin, member, viewer)
- Monorepo: marketing site, SaaS app, API, and worker share one product and one design system
- Typical flow: acquire lead → manage in CRM → follow up / automate → measure marketing performance → extend presence (digital card, catalog)

## Capabilities and Constraints

**Launching now (confirmed ship focus):**

- CRM
- Integrations
- Lead management

**In the durable product story (not all launch-complete):**

- Automations
- SEO and marketing analytics
- Digital business card
- Product catalog

**Technical / product facts from the codebase (preserve):**

- Apps: `apps/marketing` (Astro, public), `apps/app` (Next.js SaaS), `apps/api`, `apps/worker`
- Shared design system and shared design surface across apps; single root product authority
- Auth: email/password and OAuth; workspace setup / onboarding gates
- CRM domain concepts include Lead, Contact, Customer, Company, Task, Activity
- Do not invent shipping claims for modules or integrations that are still roadmap or `coming_soon` in catalog/UI
- Marketing pricing and comparison copy may differ from platform plan catalog — treat plan details as undecided unless confirmed in product/billing source of truth

**Undecided / open:**

- Exact English-market priority (product UI and marketing are Hebrew-first today)
- Which non-launch modules ship next and in what order beyond the launch trio

## Brand Commitments

- Name: **KODEM** / **Kodem** (domains include `kodem.co.il`, `app.kodem.co.il`)
- Voice (from existing product/marketing direction): direct, practical, Israeli SMB-facing; prefer honest capability claims over aspirational feature lists
- Visual identity and design tokens live in the shared design system — product truth here does not define palette/typography

## Evidence on Hand

- Real product surfaces and module scaffolding in `apps/app` and marketing module pages under `apps/marketing`
- Testimonials: intentionally empty in marketing — **do not fabricate**
- Case studies: absent — **do not fabricate**
- Product screenshots: placeholders in marketing — **do not fabricate** live product proof
- Privacy/terms pages exist as placeholders until legal copy is published

## Product Principles

1. **Ship the operating core first** — CRM, lead management, and integrations must be truthful and usable before adjacent growth surfaces.
2. **One workspace, many growth surfaces** — CRM, automations, analytics, digital card, and catalog belong to one product story, not separate brands.
3. **Shared design system across apps** — marketing and SaaS share visual and interaction language; avoid one-off UI worlds per app.
4. **Do not invent proof** — no fake testimonials, metrics, screenshots, or “available now” claims for unshipped modules.
5. **Hebrew-first, RTL-correct** — copy and layout must work for Israeli SMB and agency users before assuming EN parity.
