# STATUS.md

## Last Updated
2026-03-06

## Decision Log

### 2026-03-06
- Upgraded Bun tooling baseline to `1.3.10`:
  - Aligned `packageManager`, GitHub Actions, and composite setup action.
  - Switched CI installs to `bun ci` for lockfile-enforced reproducibility.
- Corrected Bun build/runtime scripts:
  - `build` now produces a compiled standalone Bun binary.
  - `start` now runs the compiled production artifact instead of the source entry.
  - Rationale: Bun `1.3.10` full-stack HTML-import JS bundles still failed to boot reliably in local verification, while `--compile` worked.
- Hardened Base UI wrappers:
  - Fixed slider thumb rendering to default to a single thumb and pass explicit thumb indices.
  - Fixed form context guards to throw reliably outside `FormField`/`FormItem`.
  - Restored calendar day-button focus by wiring the internal ref.
  - Preserved `SidebarMenuButton` custom composition when tooltips are enabled.
- Fixed app-level correctness issues:
  - Data-grid edits now preserve hidden rows while filtered.
  - Data-grid footer only renders add-row affordance when a handler exists.
  - Live grid preload now shows loading/error states with retry instead of blanking.
  - Mail actions now surface unimplemented actions and mutation failures.
  - Task page and mail page request handling now ignore stale responses.
- Corrected task API behavior:
  - Restored real CRUD semantics for create/delete operations.
  - Partial task updates now update only provided fields.
  - Create-task now persists `estimatedHours`.
  - Added runtime request validation and SQL support for advanced task filters.

### 2026-02-19
- Adopted a token-first UI approach documented in `AGENTS.md`:
  - Use `4px` spacing scale and ratio-based component sizing instead of ad-hoc local tweaks.
- Standardized media card variants:
  - Explicit `default` and `thin` variants for music/audiobook cards.
  - Rationale: predictable tuning and easier future iteration.
- Chose integrated seek icons for audiobook controls:
  - `Replay30` / `Forward30` style over custom stacked text+icon composition.
  - Rationale: cleaner alignment, more native look, lower maintenance.
- Hardened share behavior:
  - Fallback to clipboard with guarded error handling.
  - Rationale: avoid unhandled promise rejections in demo/runtime contexts.
- Identified layout stretch issue in card grid:
  - Use grid `items-start` to prevent thin cards stretching to tallest row item.
  - Rationale: preserve intended card height proportions.

## Current Snapshot
Project is in iterative polish mode. Core functionality is working across Mail and Media Player, with UI consistency still being tightened.

## Completed Recently

### Mail
- Sidebar migrated to official shadcn sidebar primitives.
- Mail layout refactored to use `Sidebar + SidebarInset` with resizable list/display panes.
- Sidebar collapse behavior enabled and working.
- Runtime menu context error fixed (`MenuGroupRootContext`) in user nav menu.
- Theme toggle fixed by switching to click-compatible handlers in `mode-toggle`.
- Toolbar vertical separators in mail display corrected.
- Header/sidebar overlap fixed by offsetting fixed sidebar under global app header.
- Label contrast in mail list improved.

### Data Table / Filters
- Filter menu nested-button artifact fixed.
- Feature toggle stuck-state behavior fixed.

### Media Player
- Audio tab replaced with a dedicated vertical card showcase.
- Implemented:
  - Music card (shuffle, prev/play/next, repeat cycle, queue drawer, share)
  - Audiobook card (prev chapter, replay/forward 30s icons, speed menu, queue drawer, share)
  - Default + thin variants
- Timeline thumb now visible at `0:00` and during playback.
- Share action hardened to avoid unhandled promise rejections.
- Grid stretch issue fixed so thin cards keep natural height.
- Horizontal insets slightly increased across cards.

## Current Open Polish Items

### Mail
1. Separator line contrast still slightly light in some contexts.
2. Header separator baseline alignment can be tightened further to pixel-perfect parity.

### Media
1. Thin card still under active proportion tuning (user-driven visual preference).
2. Need one final pass to lock proportion tokens so thin/default variants feel uniformly "designed".

## Suggested Next Session Checklist
1. Mail: unify separator token (same color/thickness/opacity) for top header + sidebar header separators.
2. Mail: enforce single shared header-height token for pixel-perfect separator alignment.
3. Media: finalize thin-card ratio token set (artwork height, content padding, footer spacing).
4. Media: document final card size system (`default`, `thin`) in component comments.
5. Run full checks:
- `bunx biome check src/app/mail/components src/app/media-player/components`
- `bun run typecheck`

## Primary Files Touched (Recent)
- `src/app/mail/components/mail.tsx`
- `src/app/mail/components/mail-nav.tsx`
- `src/app/mail/components/mail-list.tsx`
- `src/app/mail/components/mail-display.tsx`
- `src/app/mail/components/mail-user-nav.tsx`
- `src/components/layouts/mode-toggle.tsx`
- `src/app/media-player/components/media-player-demo.tsx`
- `src/app/media-player/components/audio-showcase.tsx`
