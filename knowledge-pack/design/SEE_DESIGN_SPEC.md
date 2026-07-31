# SEE — Design Spec

A reusable UI/UX specification for SEE apps, derived from the stack-model network explorer. Direction: **Apple-neutral surfaces with the SEEL brand spectrum as the only accent.** Copy the token block in §11 into any new app to start consistent.

Last updated: 2026-07-17.

---

## 1. Principles

- **Neutral first, colour with intent.** Surfaces and text are neutral greys/near-black (Apple-adjacent). Colour is reserved for meaning (accent, state, data).
- **One accent family: the SEEL spectrum.** Grey → blue → green. Blue is the default interactive accent; green is the positive/secondary accent; the full gradient appears in exactly one signature element per screen (e.g. a top strip).
- **Restraint & clarity.** Generous whitespace, few weights, soft depth, no decorative chrome. If a border or shadow isn't earning its place, remove it.
- **Sentence case everywhere** (buttons, tabs, headings, labels). Not Title Case, not ALL CAPS.
- **Content over container.** Panels float and get out of the way; the data is the hero.

## 2. Brand foundation — the SEEL spectrum

| Role | Hex | Notes |
|---|---|---|
| Spectrum grey | `#545655` | start of the gradient |
| Spectrum blue | `#0091d4` | **primary accent** (interactive, links, active) |
| Spectrum green | `#00c29d` | secondary/positive accent |
| Signature gradient | `linear-gradient(90deg,#545655 0%,#0091d4 55%,#00c29d 100%)` | one per screen, e.g. a 3px top strip |

## 3. Colour tokens

Neutral system (Apple-adjacent) + the accent. Use tokens, never raw hex, in components.

| Token | Value | Use |
|---|---|---|
| `--bg` | `#f5f5f7` | app background |
| `--surface` | `#ffffff` | solid cards, active segments |
| `--panel` | `rgba(255,255,255,0.82)` | floating translucent panels (with blur) |
| `--track` | `#ececee` | segmented-control track, chips |
| `--ink` | `#1d1d1f` | primary text |
| `--ink-2` | `#6e6e73` | secondary text / inactive controls |
| `--ink-3` | `#8a8a8e` | tertiary/meta text |
| `--line` | `#d7d7dc` | hairline borders (use 0.5px) |
| `--accent` | `#0091d4` | primary interactive accent (spectrum blue) |
| `--accent-2` | `#00c29d` | positive/secondary accent (spectrum green) |
| `--accent-tint` | `rgba(0,145,212,0.12)` | selected-row / hover wash |
| `--seel-gradient` | grey→blue→green | the one signature gradient |

Dark mode is not part of this baseline (the app keeps light chrome and offers a light/dark *basemap* only). If added later, mirror these as a `[data-theme="dark"]` set.

## 4. Typography

- **Font:** system stack — `-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, Roboto, Arial, sans-serif`. (SF on Apple, Segoe on Windows.) No brand display font in-product; keep it neutral.
- **Weights:** 400 body, 500 controls/labels, 600 emphasis/headings, 700 sparingly for small strong labels.
- **Scale (px):** meta 10–11, small 12–13, body 13–14, section title 15, screen title 15–17. Keep the set small.
- **Numbers:** prefer tabular alignment for data/metrics; keep units subdued (`--ink-3`).

## 5. Spacing, radii, elevation

- **Spacing:** 4-based (4, 6, 8, 12, 16, 20). Control padding ~5–7px vertical / 11–14px horizontal.
- **Radii:** `--radius: 10px` (controls, inputs, buttons), `--radius-lg: 16px` (cards/panels), `999px` (pills), `50%` (FABs/avatars).
- **Elevation (soft, low-contrast):**
  - resting card: `--shadow: 0 1px 2px rgba(0,0,0,.05), 0 10px 30px rgba(0,0,0,.08)`
  - small pop (active segment, small button): `0 1px 2px rgba(0,0,0,.12)`
  - FAB: `0 2px 8px rgba(0,0,0,.18)`
- **Borders:** hairlines at **0.5px** `--line`; avoid heavy 1px+ frames.

## 6. Materials

- **Floating panel / card (`.card`):** translucent `--panel` + `backdrop-filter: saturate(180%) blur(20px)`, 0.5px border, `--radius-lg`, `--shadow`. Use for map overlays, docked controls, popovers.
- **Solid surface:** `--surface` for content that shouldn't show-through (tables, expanded side panels).
- Prefer translucency for controls that overlay content (maps, media); prefer solid for dense reading (tables, forms).

## 7. Components

**Segmented control** (primary tab/toggle pattern) — track `--track`, radius 12, 3px padding; items 500-weight, `--ink-2`; **active** = `--surface` pill + `--accent` text + small pop shadow. Use for top-level tabs, sub-tabs, and small mode switches (e.g. weather Off/Wind/Solar/Temp).

**Top bar** — light translucent (`--panel` + blur), hairline bottom border, dark text; app title 600; a segmented control for primary tabs; right-aligned pill `<select>`s and muted meta text (`--ink-3`).

**Buttons**
- Primary: `--accent` fill, white text, `--radius`, 500–600 weight. Positive/confirm actions may use `--accent-2` (green) — but keep one accent per context.
- Secondary/ghost: transparent, `--ink-2` text/icon, hover to `--track`.
- Icon button: ghost, 6–8px padding, icon in `currentColor`.
- **FAB:** `--accent` circle (~36–40px), white icon, FAB shadow; use for an always-available primary action (e.g. open Assistant) when its panel is collapsed.

**Pills / selects** — `--surface`, 0.5px `--line`, radius 999, 500 weight; used for run/scenario pickers and filters.

**Inputs** — `--surface`, 0.5px `--line`, `--radius`, no heavy focus ring; focus via subtle accent border/tint.

**Chips** — `--track` background, `--ink` text, radius 14; for suggestions/presets.

**Collapsible side panels** — a panel collapses to a ~44px rail with a chevron to expand; width transitions ~0.18s. A collapsed rail may host a FAB for its key action. Left rail for filters, right rail for detail/assistant.

**Rows/tables** — light header (`--bg` fill, `--ink-2` text, hairline under), row hover/selection = `--accent-tint`. No zebra striping needed.

## 8. Iconography

- Line icons, ~16–18px, `stroke: currentColor`, 2px stroke, round caps/joins (Feather/Lucide style). Inherit colour from context.
- Established in-product: sun/moon (theme toggle), chat bubble (assistant), chevrons (expand/collapse), triangle/square/arrow (map assets). Keep new icons in the same weight/family.

## 9. Semantic & data-viz colour

- **Flow direction:** green `rgb(0,194,157)` = export / outbound / positive; blue `rgb(0,145,212)` = import / inbound. (Reuses the spectrum for meaning.)
- **Generation/fuel palette (RGB):** Gas `214,96,77` · Nuclear `123,80,160` · Wind `40,160,180` · Solar `240,190,50` · Biomass `90,150,80` · Coal `80,80,80` · Oil `150,90,60` · CHP `200,120,160` · Storage/Hydro `60,130,200` · Other `150,150,150`. Reuse across any SEE app that shows generation by fuel.
- **Diverging scale (e.g. price):** blue (low) → pale → amber → orange → red (high). Use for choropleths/heat where a midpoint matters.
- **Sequential scales (weather):** wind pale-blue→blue→purple→magenta; solar dark→amber→pale-yellow; temperature blue→neutral→red. Keep overlay alpha ~0.65 so the basemap reads through.
- Never rely on colour alone — pair with a legend and, where possible, a second cue (direction, label).

## 10. Motion & accessibility

- **Motion:** short and functional — 0.15s ease for state/colour, ~0.18s for panel width. Animated data (e.g. wind particles) is subtle and pauseable. Avoid gratuitous animation.
- **Accessibility:** body text and `--ink`/`--ink-2` on `--bg`/`--surface` meet WCAG AA; don't drop below `--ink-3` for anything a user must read. Every control has an `aria-label`/`title`; active segments use `aria-selected`. Provide a visible focus state. Sentence case aids scanning.

## 11. Drop-in CSS tokens

Paste into a global stylesheet to inherit the system:

```css
:root {
  /* SEEL spectrum — the single accent */
  --seel-blue: #0091d4;
  --seel-green: #00c29d;
  --seel-gradient: linear-gradient(90deg, #545655 0%, #0091d4 55%, #00c29d 100%);
  --accent: #0091d4;
  --accent-2: #00c29d;
  --accent-tint: rgba(0, 145, 212, 0.12);

  /* Apple-neutral surfaces + ink */
  --bg: #f5f5f7;
  --surface: #ffffff;
  --panel: rgba(255, 255, 255, 0.82);
  --track: #ececee;
  --ink: #1d1d1f;
  --ink-2: #6e6e73;
  --ink-3: #8a8a8e;
  --line: #d7d7dc;

  --radius: 10px;
  --radius-lg: 16px;
  --shadow: 0 1px 2px rgba(0, 0, 0, 0.05), 0 10px 30px rgba(0, 0, 0, 0.08);
}

html, body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, Roboto, Arial, sans-serif;
  color: var(--ink);
  background: var(--bg);
  -webkit-font-smoothing: antialiased;
}
a { color: var(--accent); text-decoration: none; }
a:hover { opacity: .8; }

/* Floating translucent panel */
.card {
  background: var(--panel);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  backdrop-filter: saturate(180%) blur(20px);
  border: 0.5px solid rgba(0, 0, 0, 0.08);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
}

/* Segmented control */
.seg { display: inline-flex; background: var(--track); border-radius: 12px; padding: 3px; gap: 2px; }
.seg > button {
  border: none; cursor: pointer; font: inherit; font-size: 13px; font-weight: 500;
  padding: 6px 14px; border-radius: 9px; background: transparent; color: var(--ink-2);
  transition: background .15s ease, color .15s ease;
}
.seg > button[aria-selected="true"] {
  background: var(--surface); color: var(--accent); box-shadow: 0 1px 2px rgba(0,0,0,.12);
}
input[type="range"] { accent-color: var(--accent); }
```

## 12. Do / don't

- **Do** keep one accent per context; use the gradient once per screen; use sentence case; prefer hairlines and soft shadows.
- **Don't** introduce a second brand colour, use Title Case, add heavy borders/drop-shadows, or colour large areas with the accent (it's for emphasis, not fills of content).

---

*Source of truth for the reference implementation: `see-network-explorer/app/globals.css`. When the system evolves, update this spec (see the knowledge-pack maintenance rule).*
