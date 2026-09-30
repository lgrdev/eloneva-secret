---
name: Kinetic Sentinel
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#464835'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#777963'
  outline-variant: '#c7c8af'
  surface-tint: '#596400'
  primary: '#596400'
  on-primary: '#ffffff'
  primary-container: '#b3c527'
  on-primary-container: '#474f00'
  inverse-primary: '#bed134'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#006398'
  on-tertiary: '#ffffff'
  tertiary-container: '#78c2ff'
  on-tertiary-container: '#004f7a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#daed4f'
  primary-fixed-dim: '#bed134'
  on-primary-fixed: '#1a1e00'
  on-primary-fixed-variant: '#434b00'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#cce5ff'
  tertiary-fixed-dim: '#93ccff'
  on-tertiary-fixed: '#001d31'
  on-tertiary-fixed-variant: '#004b73'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-hero:
    fontFamily: Space Grotesk
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 64px
    letterSpacing: -0.03em
  display-hero-mobile:
    fontFamily: Space Grotesk
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 20px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.06em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  margin: 2rem
  margin-sm: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system expresses a high-assurance, precision-engineered cybersecurity posture. It pairs the electric vitality of a technical chartreuse accent with the grounded authority of deep slate architecture. Designed for enterprise security engineers, compliance officers, and devsecops teams, the aesthetic rejects the tired tropes of "hacker terminals" or nebulous blue corporate SaaS. Instead, it projects razor-sharp situational awareness, mathematical certainty, and uncompromising data sovereignty.

The design movement is **Technical Modernism with Precision Layering**:
- **Structured Precision**: High-density layouts, disciplined spatial intervals, and explicit structural dividers replace ambient decorative elements.
- **Controlled Luminescence**: The energetic lime primary is deployed strictly as an active-state signifier, focus catalyst, or cryptographic key indicator—never as wide decorative washes.
- **Deep Stability**: Neutral slate foundations provide low visual fatigue during prolonged incident-response monitoring, ensuring immediate contrast against threat alerts and cryptographic telemetry.

## Colors

The palette balances vibrant chartreuse energy with structural deep-slate contrast to establish institutional trust alongside modern execution.

### Palette Architecture
- **Primary (`#b3c527`)**: The active signal. Used for critical interactive triggers, authenticated encryption badges, verified status states, and high-priority primary actions. When pairing with text, always use slate-950 (`#020617`) or deep black (`#0f172a`) on top of this color to exceed WCAG AAA readability standards.
- **Secondary (`#0f172a`)**: The structural anchor. Used for primary typography, core chrome framing, sidebars, dense data tables, and high-impact navigational containers.
- **Tertiary (`#0284c7`)**: The telemetry channel. A crisp cyber-cyan utilized for secure socket handshakes, telemetry streams, audit links, and non-blocking informational chips.
- **Neutral (`#64748b`)**: Calibrated slate scale providing subtle borders, inactive metadata, utility iconography, and structural backdrops (`#f8fafc` canvas, `#f1f5f9` surface-subtle).

### Contrast & Application Rules
1. **Never use white text over the primary `#b3c527`**. Primary buttons and badges exclusively require deep slate text (`#0f172a` / `#111827`).
2. **Tinted Backgrounds**: Subtle primary tints must stay at 8%–12% opacity against neutral whites (`#f4f7dc` maximum saturation) to prevent screen glare.
3. **Semantic Overrides**: Standard error states use `#ef4444` (critical breach), warnings use `#f59e0b` (policy advisory), and success defaults to `#10b981` (validation pass), keeping `#b3c527` dedicated to identity and security actionability.

## Typography

The typographic hierarchy implements three specialized typefaces to serve distinct operational needs:
1. **Space Grotesk (Headlines & Metrics)**: Provides an engineered, tech-forward authority. Its geometric construction asserts structural stability in dashboard headers, page titles, and high-impact security readouts.
2. **Hanken Grotesk (Body & Content)**: A contemporary grotesque that remains neutral, invisible, and highly legible across dense data grids, documentation, and operational logs.
3. **JetBrains Mono (Telemetry, Hashes, & Labels)**: Monospaced precision for cryptographic signatures, public keys, IP addresses, audit logs, and micro-labels. Its inclusion guarantees alignment in dense tabular views.

## Layout & Spacing

The layout is governed by an **Adaptive 12-Column Fluid Grid System** anchored to an 8px base rhythm (with 4px sub-intervals for dense data states).

### Layout Rhythms
- **Desktop (>= 1280px)**: 12-column grid, `margin: 2.5rem`, `gutter: 1.5rem`. Maximum container width is constrained to `1600px` for high-density monitoring displays.
- **Tablet (768px - 1279px)**: 8-column grid, `margin: 1.5rem`, `gutter: 1rem`. Side navigation condenses into an iconographic rail.
- **Mobile (< 768px)**: 4-column fluid stack, `margin: 1rem`, `gutter: 1rem`. Multi-column analytical tables convert into vertical inspect cards.

### Spacing Application
- Use `space-xs` (4px) and `space-sm` (8px) for internal micro-alignments, tag padding, input adornments, and table row density.
- Use `space-md` (16px) for standard component interior padding (card bodies, modal gutters).
- Use `space-lg` (24px) for card separations and control cluster intervals.
- Use `space-xl` (40px) exclusively for major sectional demarcations on canvas.

## Elevation & Depth

Depth is established primarily through **Surface Tiers & Low-Contrast Borders** rather than heavy drop shadows. This preserves crisp visual fidelity in high-density data environments.

- **Level 0 (Canvas Base)**: `#f8fafc` (Slate 50). The foundation upon which dashboards sit.
- **Level 1 (Structural Cards & Sidebars)**: Pure white `#ffffff` with a hairline border `1px solid #e2e8f0` (Slate 200). Shadow is suppressed or kept to a crisp ambient feather: `0 1px 2px 0 rgba(15, 23, 42, 0.04)`.
- **Level 2 (Dropdowns, Popovers, & Active Cards)**: `#ffffff` elevated by `0 4px 12px -2px rgba(15, 23, 42, 0.08)`, bound by a sharp border `1px solid #cbd5e1`.
- **Level 3 (Modals & Cryptographic Prompt Overlays)**: `#ffffff` with `0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.06)`, framed by a deep-slate backdrop filter with a 40% alpha blur (`backdrop-blur-sm bg-slate-950/40`).
- **Active State Glow**: Focused cryptographic inputs or active secret-entry elements project a distinct, non-blur ring: `0 0 0 2px #ffffff, 0 0 0 4px #b3c527`.

## Shapes

The shape system employs **Soft Geometric Precision (`roundedness: 1`)**. Rounded corners are kept controlled and architectural (4px standard base, 8px for containers) to reinforce institutional security, engineering rigor, and structural stability. Circular pills are strictly limited to small read-only status indicators.

- **Base Radius (`0.25rem` / 4px)**: Inputs, secondary action buttons, inline badges, code blocks, and data-table cells.
- **Large Radius (`0.5rem` / 8px)**: Dashboard panels, modal sheets, card perimeters, and dropdown menus.
- **Extra Large Radius (`0.75rem` / 12px)**: Standalone promotional hero callouts or floating notifications.
- **Pill (`9999px`)**: System status dots, health chips, and zero-knowledge identity beacons only.

## Components

### Buttons
- **Primary**: Background `#b3c527`, text `#0f172a` (JetBrains Mono or Hanken Grotesk bold), border: none. Hover: `#a2b31f`. Focus: 2px offset with `#b3c527` halo. Never use white text.
- **Secondary (Structural)**: Background `#0f172a`, text `#ffffff`. Hover: `#1e293b`.
- **Tertiary / Ghost**: Transparent background, text `#0f172a`, border `1px solid #e2e8f0`. Hover: background `#f1f5f9` with subtle border `#cbd5e1`.

### Inputs & Vault Entry Fields
- Height 40px, background `#ffffff`, border `1px solid #cbd5e1`, font `Hanken Grotesk` (or `JetBrains Mono` for secret tokens/API keys).
- Active Focus: Border `#0f172a`, box-shadow `0 0 0 3px rgba(179, 197, 39, 0.45)`.
- Secret Masking: Toggleable visibility adorned with monospaced disc glyphs (`••••••••`) rather than standard browser asterisks.

### Chips & Telemetry Tags
- **Status (Verified Secret)**: Background `rgba(179, 197, 39, 0.15)`, text `#3f4705`, border `1px solid rgba(179, 197, 39, 0.4)`. Contains a 6px solid `#b3c527` status dot.
- **Informational**: Background `#f1f5f9`, text `#475569`, border `1px solid #e2e8f0`.

### Cards & Vault Containers
- Background `#ffffff`, border `1px solid #e2e8f0`, border-radius `0.5rem`.
- Header: Separated by a hairline `1px solid #f1f5f9` border, featuring a Space Grotesk section headline paired with a JetBrains Mono metadata indicator.
- Hoverable Cards: Border transitions smoothly to `#b3c527` on hover with a crisp 1px stroke.

### Checkboxes & Radio Controls
- Base: 16x16px, border `1.5px solid #94a3b8`, radius 4px (checkbox) or circle (radio).
- Checked: Background `#0f172a`, border `#0f172a`. The check icon itself is colored `#b3c527` for high-contrast identity recognition.

### Secret Inspector (Specialized Domain Component)
- Read-only data display for cryptographic keys, hashes, and authorization vectors.
- Framed in `#0f172a` dark mode styling even within light themes: dark background `#020617`, text `#e2e8f0`, highlighted values `#b3c527`, accompanied by an instant one-click copy button and audit-trail timestamp.