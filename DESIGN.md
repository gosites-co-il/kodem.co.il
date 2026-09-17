---
name: KODEM
description: Vibrant shared design system for Hebrew RTL marketing and SaaS — conversion-strong on the site, calm and practical in the product.
colors:
  primary: "#D81159"
  primary-deep: "#8F2D56"
  secondary: "#218380"
  highlight: "#73D2DE"
  spark: "#FFBC42"
  background: "#F8FAFC"
  foreground: "#0B111E"
  card: "#FFFFFF"
  muted: "#EEF2F6"
  muted-foreground: "#515E70"
  border: "#D8DFE9"
  destructive: "#DC2828"
  primary-foreground: "#FFFFFF"
  secondary-foreground: "#FFFFFF"
  spark-foreground: "#0B111E"
  highlight-foreground: "#0B111E"
typography:
  display:
    fontFamily: "Assistant, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 3.75rem)"
    fontWeight: 800
    lineHeight: 1.12
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Assistant, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 3vw, 2rem)"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Assistant, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "Assistant, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "normal"
  label:
    fontFamily: "Assistant, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.04em"
rounded:
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  full: "9999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
  section: "4rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: "0.625rem 1rem"
    height: "2.5rem"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.primary-deep}"
    textColor: "{colors.primary-foreground}"
  button-cta-marketing:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.full}"
    padding: "0.75rem 1.75rem"
    height: "3rem"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    rounded: "{rounded.md}"
    padding: "0.625rem 1rem"
    height: "2.5rem"
  button-outline:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "0.625rem 1rem"
    height: "2.5rem"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "0.625rem 1rem"
    height: "2.5rem"
  input-default:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "0.5rem 0.75rem"
    height: "2.5rem"
  card-default:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "1.5rem"
  chip-default:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.full}"
    padding: "0.25rem 0.75rem"
---

# Design System: KODEM

## Overview

**Creative North Star: "The Vibrant Workshop"**

KODEM’s visual system is one workshop with two work modes. On the marketing site it is bold, colorful, and conversion-focused — strong hierarchy, high-energy accents, and CTAs that feel decisive. In the application it stays the same palette and type, but dials density and chrome quieter so everyday CRM and lead work feels clean, intuitive, and comfortable.

The shared language is Hebrew-first and RTL-native: Assistant for all roles, start-aligned text, and components from `@kodem/design-system`. Color is the differentiator from generic SaaS zinc: raspberry primary, teal trust, cyan highlight, and amber spark — used with restraint in-app and with presence on marketing.

**Key Characteristics:**
- One palette and type ramp across `apps/marketing` and `apps/app`
- Vibrant brand color with calm neutral surfaces for long sessions
- Flat-by-default depth; soft lift only on hover and key cards
- Marketing CTAs are full-pill and louder; app controls are rounded-md and quieter
- RTL / Hebrew is default, not an afterthought

## Colors

A warm-cool workshop palette: raspberry action, berry depth, teal trust, cyan glow, amber spark — on cool paper neutrals.

### Primary
- **Raspberry Signal** (`#D81159`): Primary actions, marketing conversion CTAs, key selected states. The loudest brand voice.
- **Berry Press** (`#8F2D56`): Hover/pressed primary, deep emphasis, strong headings accents when color is needed.

### Secondary
- **Workshop Teal** (`#218380`): Trust, links, secondary actions, success-adjacent brand moments that are not the main CTA.

### Tertiary
- **Cyan Highlight** (`#73D2DE`): Focus rings, soft glows, marketing atmosphere, light accent chips — never large text blocks.
- **Amber Spark** (`#FFBC42`): Attention, promotional callouts, positive sparks on marketing; rare in-app (badges, empty-state accents).

### Neutral
- **Cool Paper** (`#F8FAFC`): Default page background.
- **Ink** (`#0B111E`): Primary text and strong icons.
- **White Card** (`#FFFFFF`): Cards, popovers, elevated panels.
- **Mist** (`#EEF2F6`): Muted surfaces, zebra rows, subtle fills.
- **Slate Caption** (`#515E70`): Secondary text, helper copy.
- **Hairline** (`#D8DFE9`): Borders and input strokes.
- **Alert Red** (`#DC2828`): Destructive only — not a brand accent.

### Named Rules
**The One Workshop Rule.** Marketing and app share the same five brand hues and neutrals. Do not keep a separate zinc or ink-teal theme per app.

**The Loud-on-Site Rule.** Raspberry and amber may dominate marketing hero/CTA bands. In the app, raspberry is for primary actions only (roughly ≤10% of chrome); teal and neutrals carry the rest.

**The Spark Budget Rule.** Amber Spark is a highlight, not a background system. Never flood an app screen with `#FFBC42`.

## Typography

**Display Font:** Assistant (with `system-ui, sans-serif`)
**Body Font:** Assistant (same stack)
**Label/Mono Font:** Assistant (no separate mono required for brand UI)

**Character:** Contemporary Hebrew + Latin sans (Source Sans–paired Hebrew) — clear, friendly, and durable at dense app sizes and confident at marketing display sizes. One family keeps RTL metrics consistent.

### Hierarchy
- **Display** (800, clamp ~2.25–3.75rem, 1.12): Marketing heroes and rare product empty-state titles.
- **Headline** (700, clamp ~1.5–2rem, 1.25): Section titles, page titles in-app.
- **Title** (600, 1.125rem, 1.4): Card titles, dialog titles, nav group labels.
- **Body** (400, 1rem, 1.625): Prose and form copy; aim ~65–75ch on marketing long form.
- **Label** (600, 0.75rem, +0.04em): Eyebrows, badges, table headers, button labels when compact.

### Named Rules
**The Single Face Rule.** Do not introduce Inter, Roboto, or a second display family. Assistant covers Hebrew + Latin.

## Layout

Shared spatial model: Tailwind default spacing with a few site/app shells.

- Marketing content width: `max-w-6xl` with `px-4 sm:px-6` (`.container-site`).
- App shell width: up to `max-w-7xl` for nav/content.
- Section rhythm (marketing): `py-16 sm:py-20 lg:py-24`.
- Header: sticky; marketing ~`4.25rem`, app nav `h-14`.
- Marketing hero: often full first viewport minus header (`min-h-[calc(100svh-4.25rem)]`), two-column from `lg`.
- Density: marketing airier (larger section gaps, bigger CTAs); app tighter (compact tables, `text-sm` controls) without changing the token scale.

### Named Rules
**The Dual Density Rule.** Same tokens; marketing adds section air and larger hit targets, app compresses chrome — never by inventing a second spacing scale.

## Elevation & Depth

Flat-by-default. Depth appears as soft tonal separation and light shadows only on interaction or marketing cards — stronger on the site, subtler in the app.

### Shadow Vocabulary
- **Card rest** (`0 4px 24px -4px hsl(222 47% 11% / 0.08)`): Marketing cards / bento at rest.
- **Soft lift** (`0 10px 40px -12px hsl(222 47% 11% / 0.12)`): Hover lift on marketing cards and menus.
- **App default:** Prefer border + background shift over shadow; if needed, use the card-rest shadow at reduced opacity.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. Soft lift is a response (hover, open menu, featured marketing card), not permanent decoration on every panel.

## Shapes

Gently curved workshop geometry: shared `0.75rem` base radius; marketing CTAs go full-pill for conversion emphasis.

- **sm** (`0.5rem`): Small chips, tight controls.
- **md** (`0.75rem`): Default buttons, inputs, app cards.
- **lg** (`1rem`): Larger marketing cards, dialogs.
- **full** (`9999px`): Marketing primary CTAs and pill nav links only.

Borders are hairline (`#D8DFE9`) — no heavy strokes. Focus uses cyan highlight ring (`#73D2DE`) with offset on background.

### Named Rules
**The Pill-for-Conversion Rule.** Full pills are a marketing signature for primary CTAs. In-app primary buttons stay `rounded-md` so daily tools feel calmer.

## Components

Primitives live in `@kodem/design-system` (shadcn-based). Brand colors map onto semantic tokens (`primary`, `secondary`, `ring`, etc.) so both apps consume one component API.

### Buttons
- **Shape:** App default gently curved (`0.75rem`); marketing CTA full pill.
- **Primary:** Raspberry Signal background, white text; hover Berry Press.
- **Secondary:** Workshop Teal, white text.
- **Outline / Ghost:** Neutral surfaces; ghost for tertiary chrome.
- **Marketing CTA:** Taller (`h-12`), pill, primary fill — conversion-first.
- **Focus:** Cyan Highlight ring (`ring-2`, offset 2).

### Chips
- **Style:** Mist background, ink text, full pill, compact padding.
- **Selected:** Teal or raspberry soft tint with matching text — never amber fill for selected filters in-app.

### Cards / Containers
- **Corner Style:** `lg` (`1rem`) marketing; `md`/`lg` in-app.
- **Background:** White Card on Cool Paper.
- **Shadow Strategy:** Flat-by-default; marketing may use card-rest / soft-lift.
- **Border:** Hairline when flat.
- **Internal Padding:** `1.5rem` default (`p-6`).

### Inputs / Fields
- **Style:** White fill, hairline border, `0.75rem` radius, `h-10`.
- **Focus:** Cyan Highlight ring (not raspberry) to keep typing calm.
- **Error:** Alert Red border/text; do not use raspberry for errors.

### Navigation
- **Marketing:** Sticky blurred header; pill text links; raspberry pill CTA.
- **App:** Compact `h-14` bar, `rounded-md` triggers, muted hover fills — same hues, lower chroma usage.

## Do's and Don'ts

### Do:
- **Do** use the same five brand hues + neutrals in marketing and app.
- **Do** put conversion weight on Raspberry Signal CTAs on marketing surfaces.
- **Do** keep app chrome mostly neutrals + teal, with raspberry reserved for primary actions.
- **Do** design RTL-first with Assistant and start alignment.
- **Do** honor `prefers-reduced-motion` (marketing already hard-kills motion).

### Don't:
- **Don't** keep separate zinc (app) or old ink-teal (marketing) as competing systems.
- **Don't** use purple-on-white SaaS defaults, cream+terracotta editorial clichés, or Inter as the UI face.
- **Don't** use Amber Spark as large app backgrounds or primary buttons.
- **Don't** invent testimonials, fake metrics, or decorative proof chips as a visual pattern.
- **Don't** mix full-pill primary buttons into dense app toolbars.
