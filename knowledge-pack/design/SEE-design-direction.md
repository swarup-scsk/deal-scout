# SEE design direction — reuse across SEE apps

A portable UI/UX direction derived from the stack-model network explorer, packaged so **any other SEE app can adopt it with zero prior context**. Hand this file + `seel-theme.css` to the other app's team or agent.

**The direction in one line:** *Apple-neutral surfaces with the SEEL brand spectrum (grey → blue → green) as the only accent.*

Last updated: 2026-07-28. Canonical source of truth: `see-network-explorer/docs/SEE_DESIGN_SPEC.md` + `see-network-explorer/app/globals.css`.

---

## Adopt it in a new app — 5 steps

1. **Import the theme.** Drop `seel-theme.css` into the app and import it once globally (e.g. in the root layout / `globals`). It sets the tokens, base typography, and ready-made component classes.
2. **Use tokens, never raw hex.** Reference `var(--ink)`, `var(--accent)`, `var(--surface)`, etc. in every component.
3. **Use the component classes** it ships: `.card`, `.seg`, `.btn` / `.btn--ghost` / `.btn--positive`, `.fab`, `.pill`, `.chip`, `.input`, `.tbl`, `.seel-strip`.
4. **Follow the five rules** below (they matter more than any single token).
5. **Check against the adoption checklist** at the bottom before shipping a screen.

## The five rules (the essence)

1. **Neutral first, colour with intent.** Surfaces and text are neutral greys / near-black. Colour is reserved for meaning — accent, state, data.
2. **One accent family: the SEEL spectrum.** Blue `#0091d4` is the default interactive accent; green `#00c29d` is the positive/secondary accent. Never introduce a second brand colour. Don't fill large areas with the accent — it's for emphasis.
3. **The gradient appears once per screen.** `linear-gradient(90deg,#545655,#0091d4,#00c29d)` as a single signature element (e.g. a 3px top strip) — not repeated as chrome.
4. **Sentence case everywhere.** Buttons, tabs, headings, labels. Not Title Case, not ALL CAPS.
5. **Content over container.** Panels float, use hairlines (0.5px) and soft shadows, and get out of the way. If a border or shadow isn't earning its place, remove it.

## Tokens (also in `seel-theme.css`)

| Token | Value | Use |
|---|---|---|
| `--bg` | `#f5f5f7` | app background |
| `--surface` | `#ffffff` | solid cards, active segments |
| `--panel` | `rgba(255,255,255,0.82)` | floating translucent panels (with blur) |
| `--track` | `#ececee` | segmented-control track, chips |
| `--ink` | `#1d1d1f` | primary text |
| `--ink-2` | `#6e6e73` | secondary text / inactive controls |
| `--ink-3` | `#8a8a8e` | tertiary / meta text |
| `--line` | `#d7d7dc` | hairline borders (use 0.5px) |
| `--accent` | `#0091d4` | primary interactive accent (spectrum blue) |
| `--accent-2` | `#00c29d` | positive / secondary accent (spectrum green) |
| `--accent-tint` | `rgba(0,145,212,0.12)` | selected-row / hover wash |
| `--radius` / `--radius-lg` | `10px` / `16px` | controls / cards |
| `--shadow` | soft two-layer | resting card elevation |

## Typography

- **Font:** system stack — `-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, Roboto, Arial, sans-serif`. No brand display font in-product.
- **Weights:** 400 body · 500 controls/labels · 600 emphasis/headings · 700 sparingly.
- **Scale (px):** meta 10–11 · small 12–13 · body 13–14 · section title 15 · screen title 15–17. Keep the set small.
- **Numbers:** tabular alignment for data/metrics; keep units subdued (`--ink-3`).

## Components (recipes shipped in the CSS)

- **Segmented control (`.seg`)** — the primary tab/toggle. Track `--track`, active item = white pill + `--accent` text + small pop shadow. Use for top tabs, sub-tabs, and small mode switches.
- **Top bar** — translucent `.card` style, hairline bottom border, title 600, a `.seg` for primary tabs, right-aligned `.pill` selects + muted meta.
- **Buttons (`.btn`)** — primary = accent fill/white; `.btn--positive` for confirm only; `.btn--ghost` for secondary.
- **FAB (`.fab`)** — accent circle for an always-available action (e.g. open assistant) when its panel is collapsed.
- **Collapsible side panels** — collapse to a ~44px rail with a chevron; width transitions ~0.18s. Left rail = filters, right rail = detail/assistant.
- **Tables (`.tbl`)** — light header, row hover/selection = `--accent-tint`, no zebra striping.
- **Cards (`.card`)** — translucent + blur for overlays; use `.surface` (solid) for dense reading.

## Semantic & data-viz colour (reuse for any SEE app)

- **Flow direction:** green `rgb(0,194,157)` = export/outbound/positive; blue `rgb(0,145,212)` = import/inbound.
- **Generation/fuel palette (RGB):** Gas `214,96,77` · Nuclear `123,80,160` · Wind `40,160,180` · Solar `240,190,50` · Biomass `90,150,80` · Coal `80,80,80` · Oil `150,90,60` · CHP `200,120,160` · Storage/Hydro `60,130,200` · Other `150,150,150`.
- **Diverging scale (e.g. price):** blue (low) → pale → amber → orange → red (high).
- **Sequential (weather):** wind pale-blue→blue→purple→magenta; solar dark→amber→pale-yellow; temperature blue→neutral→red; overlay alpha ~0.65 so the basemap reads through.
- Never rely on colour alone — pair with a legend and a second cue (direction, label).

## Motion & accessibility

- **Motion:** short and functional — 0.15s ease for state/colour, ~0.18s for panel width. Subtle, pauseable animated data. No gratuitous motion.
- **Accessibility:** `--ink`/`--ink-2` on `--bg`/`--surface` meet WCAG AA; don't drop below `--ink-3` for anything a user must read. Every control has `aria-label`/`title`; active segments use `aria-selected`; provide a visible focus state.

## Adoption checklist (before shipping a screen)

- [ ] `seel-theme.css` imported; components reference tokens, not raw hex.
- [ ] Exactly one accent family used; no second brand colour; accent used for emphasis, not large fills.
- [ ] The signature gradient appears at most once on the screen.
- [ ] All text is sentence case.
- [ ] Borders are 0.5px hairlines; shadows are soft; no heavy chrome.
- [ ] Primary tabs/toggles use the segmented control.
- [ ] Data-viz reuses the semantic/fuel palette + a legend and a non-colour cue.
- [ ] Controls have `aria-label`/`title` and a visible focus state; contrast meets AA.

## Do / don't

- **Do** keep one accent per context; use the gradient once per screen; sentence case; hairlines and soft shadows.
- **Don't** introduce a second brand colour, use Title Case, add heavy borders/drop-shadows, or colour large areas with the accent.

---

*When the system evolves, update the canonical spec (`see-network-explorer/docs/SEE_DESIGN_SPEC.md`) and re-export this pair.*
