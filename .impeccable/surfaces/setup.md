---
version: 1
slug: "setup"
primary_target: "route:/setup"
related_targets:
  - "apps/app/src/components/setup"
  - "apps/app/src/app/(setup)/setup/page.tsx"
---

# Surface: Workspace setup (/setup)

Mode: Operate
Audience: New workspace owners / agencies creating a client workspace
Job: Complete identity (business + workspace + subdomain) then continue questionnaire to an active workspace
Proof: Live slug availability (DB + Cloudflare DNS check-only)
Constraints: DESIGN.md Vibrant Workshop; Hebrew RTL; sheet ~5/8; no DNS create in step 1

## Direction contract

THESIS: Split stage — brand panel owns ~3/8, docked questionnaire sheet owns ~5/8; stepper + one focused question cluster per step; refuses full-bleed form-only or bottom-sheet onboarding.
OWN-WORLD: Raspberry Signal primary on Cool Paper; brand panel in primary-deep/raspberry field with KODEM mark; white sheet with soft offset shadow; Assistant type; flat controls.
STORY: Name the business and workspace, claim `{slug}.app.kodem.co.il` when available, continue.
FIRST VIEWPORT: Brand panel (end side) + sheet (start side, ~5/8 width) with horizontal stepper, three fields (business name, workspace name, subdomain), availability chip, primary המשך.
FORM: User-approved hybrid of comps A (end-dock sheet) + C (brand panel); mocks `.impeccable/mocks/setup-sheet/`.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Approved composition

- Hybrid: A’s dock + C’s brand panel
- Approved assets: `.impeccable/mocks/setup-sheet/setup-sheet-comp-a-end-dock.png`, `.impeccable/mocks/setup-sheet/setup-sheet-comp-c-split.png`
