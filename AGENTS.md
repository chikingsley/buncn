# AGENTS.md

## Purpose
This file defines the shared working standard for UI iteration in this repo so future sessions stay consistent.

## UI North Star
Use a token-first system and avoid one-off spacing/size tweaks.

### 1) Spacing Scale
- Base unit: `4px`
- Preferred spacing steps: `4, 8, 12, 16, 20, 24, 32`
- Prefer scale values over arbitrary values unless visually justified.

### 2) Proportion Rules for Cards
- Treat card layout as ratio-based, not per-element guesswork.
- For media cards:
  - Artwork region: ~`35%–45%` of total card height
  - Controls/content region: ~`55%–65%`
- Maintain hierarchy:
  - Primary action > secondary transport > utility actions

### 3) Alignment Rules
- Shared headers across adjacent panes must use shared height tokens.
- Adjacent separators should align on the same Y baseline.
- Prefer one source of truth token for line color/thickness.

### 4) Contrast Rules
- UI boundaries (separators, pane dividers) must be clearly visible without squinting.
- If users report faint separators, increase contrast token first (not random local overrides).

### 5) Component Behavior Rules
- Use official shadcn/Base UI component structure to avoid context/runtime errors.
- Normalize Base UI state selectors (`data-active`, etc.) before adding cosmetic overrides.
- For menu items in this codebase, prefer click handlers compatible with current Base UI wrappers.

## Workflow for UI Changes
1. Identify whether issue is ratio, spacing token, or alignment token.
2. Apply token-level fix before component-local hacks.
3. Verify with:
- `bunx biome check <touched-files>`
- `bun run typecheck`
4. Capture decisions in `STATUS.md`.

## Do/Don't
- Do: keep variant systems explicit (`default`, `thin`, etc.)
- Do: prefer consistent classes over ad-hoc one-off values
- Don't: patch every element separately when one container token can solve it
- Don't: reintroduce nested interactive elements (button-in-button)
