---
name: IMPACT visual system
status: active
font_sans: IBM Plex Sans
font_mono: IBM Plex Mono
background: "#07090b"
surface: "#0d1115"
border: "#20262d"
text: "#f2f5f7"
muted: "#8b949e"
risk: "#e35d5d"
finance: "#53a97b"
info: "#7ea4bf"
warning: "#c89a55"
radius_small: 4px
radius_medium: 6px
---

# Overview

IMPACT is a quantitative cyber-risk and financial decision simulator. Its visual character should feel like an institutional risk desk or financial-analysis terminal: dense but controlled, technical without looking theatrical, and polished enough to stand as a portfolio artifact.

The Cesium globe is the primary visual flourish. The rest of the product should support it with restraint rather than competing with it.

# Colors

Use near-black charcoal for the page and rails. Surfaces should differ through small luminance steps, not gradients or glow.

- Background: `#07090b`
- Rail panel: `#0a0d10`
- Surface: `#0d1115`
- Raised surface: `#11161b`
- Border: `#20262d`
- Strong border: `#303841`
- Primary text: `#f2f5f7`
- Secondary text: `#8b949e`
- Risk / adverse: muted red `#e35d5d`
- Finance / favorable: muted green `#53a97b`
- Information: steel blue `#7ea4bf`
- Caution: muted amber `#c89a55`

Reserve semantic colors for actual meaning. Do not use them as decoration.

# Typography

IBM Plex Sans is the product typeface. IBM Plex Mono is for financial values, tabular data, formulas, and chart labels where aligned numerals improve scanning.

Use sentence case for headings and body copy. Uppercase is acceptable only for short metadata labels. Avoid wide tracking in running text. Maintain clear contrast between labels, section headings, body copy, and numeric outputs.

# Layout

Desktop uses three rails:

1. Scenario / decision rail on the left.
2. FAIR and FMVA analysis rail in the center.
3. Geographic / company-context globe on the right.

The rails are separated by one-pixel lines. Avoid wrapping each rail in additional decorative containers. Use spacing and dividers to show hierarchy before adding another card.

On smaller screens, preserve the existing responsive behavior and prioritize scenario and analysis content over the globe.

# Elevation & Depth

The default interface is flat. Use borders and tonal surface changes rather than shadows. Shadows are reserved for true overlays such as dialogs when separation from the underlying app is necessary.

Do not use ambient glows, neon edges, frosted glass, or decorative gradient halos.

# Shapes

Default radii are 4px and 6px. Buttons and cards should not look pill-shaped unless the control is semantically a compact tag or status.

Use circles only where the shape communicates something specific, such as a point marker on the globe or a conventional information icon.

# Components

## Tabs

Tabs are text-led with a bottom rule for the active state. Avoid filled pill tabs.

## Metric surfaces

Metric cards use a flat surface, one-pixel border, compact spacing, and strong numeric hierarchy. Numbers may use IBM Plex Mono. Data colors should communicate risk, favorable outcome, information, or caution.

## Scenario choices

Choices are restrained dark rows with a clear number, label, optional summary, and subtle hover state. Do not add glow or large shadow effects.

## Charts

Charts should use solid grid lines and quiet axes. Data marks may use semantic colors. Avoid decorative chart gradients.

## Dialogs

Dialogs are concise operating surfaces, not mini landing pages. Use one surface, one border, limited copy, and a clear primary action.

## Globe

The globe may use realistic imagery, terrain, motion, atmosphere, and scenario markers because those features directly communicate geographic context. Keep surrounding UI chrome minimal.

# Do’s and Don’ts

Do:
- Make the important number or decision obvious first.
- Use whitespace asymmetrically to show grouping.
- Let FAIR and FMVA terminology carry the product identity.
- Use semantic color sparingly.
- Prefer dividers, typography, and spacing over nested cards.
- Keep numeric displays aligned and easy to compare.

Don’t:
- Stack rounded cards inside rounded cards.
- Use gradients as generic atmosphere.
- Add pulsing dots unless something genuinely requires ongoing attention.
- Use cyan, purple, or neon purely to make the app feel technical.
- Put every label in tiny uppercase text with wide tracking.
- Add shadows and borders to define the same surface twice.
- Turn ordinary controls into pills or badges.
