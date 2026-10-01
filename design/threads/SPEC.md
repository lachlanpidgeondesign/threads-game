# Threads — Interaction & Visual Upgrade Spec

Source of truth for this round of work. Figma exports live alongside this file in `/design/threads/`. Where this spec and the Figma frames disagree on *visuals*, Figma wins. Where they disagree on *behaviour*, this spec wins.

The codebase is a single file, `threads.html` (vanilla HTML/CSS/JS, global state `S`, no build step). Keep it that way: no frameworks, no bundler, no npm dependencies. Splitting into `threads.css` / `threads.js` is allowed if the file becomes unwieldy, but not required.

**Work one phase at a time.** Each phase must leave the game fully playable. After each phase, stop and summarise what changed, what was tested, and anything that deviates from this spec.

---

## Phase 0 — Foundations

Nothing visible changes in this phase. It removes the structural blockers identified in the codebase audit.

### 0.1 Keyed rendering
`renderGrid()` currently wipes `#tgrid.innerHTML` on every change, which destroys nodes mid-animation. Replace with keyed reconciliation:

- Keep a `Map` of block id → DOM node. Create nodes once; on render, update classes/position and reuse existing nodes. Remove nodes only after their exit animation finishes.
- Found-word rows are likewise keyed (by word) and created once.
- Grid position changes (blocks "falling up" after a removal) should animate with FLIP: measure before, apply new grid position, measure after, animate the delta with a short spring-ish ease (~250ms, `cubic-bezier(.34,1.56,.64,1)` or similar, subtle overshoot).

### 0.2 Animation helper
Replace the scattered `setTimeout(400/650/800)` choreography with a small promise-based helper built on the Web Animations API:

```js
// anim(el, keyframes, options) -> Promise that resolves on finish
// seq / stagger helpers as needed
```

Validation flows become `async` sequences (`await anim(...)`). `S.checking` must still block input for the whole sequence.

### 0.3 Motion preferences
Remove the global `* { animation:none!important; transition:none!important }` rule. Instead the helper checks `prefers-reduced-motion` and, when set, swaps movement for short opacity/colour changes. Every feature below defines its reduced-motion fallback.

### 0.4 Thread redraw on resize
Add a `ResizeObserver` on the grid wrapper (plus `orientationchange`) that redraws the thread for the current selection.

### 0.5 Colour tokens out of JS
Move `WORD_COLORS` out of JS into CSS custom properties. Found rows get classes (`.found--member`, `.found--theme`), not inline colours. Also tokenise the hard-coded values the audit listed: near-black start button and toast, block greys and shadows, green valid thread, shimmer gold, and dark-mode block overrides.

### 0.6 Settings / dev panel
Extend the existing settings sheet with a **Prototype** section. All values persist in `localStorage` under `threads-settings`:

| Setting | Options | Default |
|---|---|---|
| Colour scheme | Brand contrast / Rainbow members / Ultramarine members | Brand contrast |
| Theme celebration | Stitch / Wind / Tie | Stitch |
| Haptics | On / Off | On |
| Dark mode | On / Off (now persisted) | Off |

Also persist dark mode in the same object.

### 0.7 Haptics helper
```js
haptic('select' | 'deselect' | 'found' | 'wrong' | 'hint' | 'theme')
```
- If `navigator.vibrate` exists (Android WebViews), use short patterns: select `8`, deselect `5`, found `[12,40,12]`, wrong `[25,40,25,40,25]`, hint `15`, theme `[10,30,10,30,40]`.
- iOS WebKit has no `vibrate`. As an experiment, implement the iOS 18 switch-checkbox technique: a hidden `<input type="checkbox" switch>` whose associated `<label>` is clicked programmatically to produce a system haptic tick. Wrap in feature detection and fail silently. It may not work inside the app's WebView; that's what the prototype is for.
- No-op when the Haptics setting is off.

---

## Phase 1 — Colour

Problem: too much orange, and the theme word doesn't stand out. Threads belongs to the **Word – Orange** family; the masthead uses **Games – Ultramarine**. Orange becomes an accent, not the default fill.

### Palette tokens (add as CSS custom properties)
```
Ultramarine: 900 #12102E · 800 #24205C · 700 #352F8A · 600 #473FB8 · 500 #594FE6 · 400 #7A72EB · 300 #9B95F0 · 200 #BDB9F5 · 100 #DEDCFA · 50 #EEEDFC
Orange:      900 #31220C · 800 #614518 · 700 #926725 · 600 #C28A31 · 500 #F3AC3D · 400 #F5BD64 · 300 #F8CD8B · 200 #FADEB1 · 100 #FDEED8 · 50 #FEF7EC
Green:       900 #00291F · 800 #00523F · 700 #007A5E · 600 #00A37E · 500 #00CC9D · 400 #33D6B1 · 300 #66E0C4 · 200 #99EBD8 · 100 #CCF5EB · 50 #E5FAF5
Purple:      900 #111433 · 800 #222866 · 700 #343D99 · 600 #4551CC · 500 #5665FF · 400 #7884FF · 300 #9AA3FF · 200 #BBC1FF · 100 #DDE0FF · 50 #EEF0FF
Blue:        900 #0B2427 · 800 #16484E · 700 #216B76 · 600 #2C8F9D · 500 #37B3C4 · 400 #5FC2D0 · 300 #87D1DC · 200 #AFE1E7 · 100 #D7F0F3 · 50 #EBF7F9
Pink:        900 #2A0A19 · 800 #541332 · 700 #7F1D4B · 600 #A92664 · 500 #D3307D · 400 #DC5997 · 300 #E583B1 · 200 #EDACCB · 100 #F6D6E5 · 50 #FBEAF2
```

### Dark mode conversion rule (from the palette sheet)
- Masthead uses **800** instead of 500.
- Primary/accent fills use **300** instead of 500.
- The **50 / Pale** surface becomes `#242424`.

### Schemes (switchable in the Prototype panel)

| Element | A. Brand contrast | B. Rainbow members | C. Ultramarine members |
|---|---|---|---|
| Member found rows | Orange 100 bg, Orange 800 text | Each member uses a different family's 100 bg with its 800 text (Green, Purple, Blue, Pink, in discovery order) | Ultramarine 100 bg, Ultramarine 800 text |
| Theme found row | Ultramarine 500 bg, white text | Orange 500 bg, Orange 900 text | Orange 500 bg, Orange 900 text |
| Tutorial prompt pills | Orange 500 | Orange 500 | Orange 500 |
| Selected tiles / thread | Near-black (`#242424`) | same | same |

The theme row also gets a small persistent marker: a 2px inset ring in its own 700 shade and a subtle spool glyph at the left edge. This keeps it identifiable even after the celebration, in every scheme, and for colour-blind players.

Reduced motion: n/a.

---

## Phase 2 — Tile press & tray rise

The grid and the tray are opposites: tiles go **down** when chosen, tray slots come **up** when filled.

- **Grid tile, pointerdown:** translateY(3px), bottom shadow collapses to ~0 (≈80ms, ease-out). If the tile becomes selected it stays depressed and dark. On deselect it springs back up (≈160ms, slight overshoot).
- **Tray slot, filled:** the letter block rises from slightly below (translateY(6px) → 0), its shadow grows from 0 to full, with a tiny overshoot (≈200ms). Empty slots look recessed (inset shadow) to sell the "lifted out of a socket" read.
- **Tray slot, emptied:** reverse, block sinks back into the socket (≈140ms).
- Haptics: `select` on add, `deselect` on remove.
- Reduced motion: instant state changes, no translate.

---

## Phase 3 — The thread

### Look
- Replace the straight `<polyline>` with an SVG `<path>` passing through tile centres, using a Catmull-Rom → cubic Bézier conversion (tension ≈0.5) so it curves smoothly between tiles.
- Make it read as real thread: a base stroke (~4px, round caps and joins, near-black) plus a lighter overlay stroke (~1.5px, dashed `3 4`, ~35% opacity) for a twisted-fibre texture. Optional: a faint drop shadow (`filter` or a duplicate offset path at low opacity).
- Valid / invalid states tint the thread (valid: Green 600; invalid: existing destructive red) briefly before it clears.

### Input — tap **and** drag
Move from `click` to Pointer Events on `#tgrid` and set `touch-action: none` on the grid.

- **pointerdown** on a tile: same rules as the current click logic (left-to-right enforcement, re-tap truncates, same-column swap).
- **pointermove** while down: hit-test with `document.elementFromPoint`. Use a hit area of the inner ~70% of each tile so diagonal drags don't clip neighbours.
  - Entering a tile in the next column extends the selection.
  - Entering the second-to-last selected tile **backtracks** (pops the last).
  - Anything else is ignored.
- **Live end:** while dragging, the thread has a loose end that follows the pointer. The end chases the pointer with a lerp (≈0.35 per frame) and the final segment sags slightly (a control point offset downwards proportional to segment length), so it feels like slack thread. When the finger snaps onto a tile, the slack pulls taut over ~120ms.
- **pointerup:** removes the loose end. A pointerdown + pointerup without crossing into another tile counts as a tap, preserving current tap behaviour.
- Auto-check at 5 is unchanged.
- Reduced motion: no slack or lerp. The thread draws straight to the pointer.

---

## Phase 4 — Correct-word success

Sequence (all via the animation helper, input blocked throughout):

1. The thread tints green and stays drawn (≈100ms).
2. The five selected tiles **hop**: translateY(0 → −10px → 0) with squash on landing (scaleY .92 → 1). Stagger 40ms left to right, ≈320ms each.
3. The tiles collapse into the new found row: scale down and fade while the row grows in at its place in the found stack (keyed, created once).
4. The found row **ripples**: a light band sweeps left to right across the bar (≈350ms) while the bar does a single soft scale pulse (1 → 1.03 → 1).
5. Remaining tiles fall up into the gaps via FLIP (Phase 0.1).
6. Haptic: `found`.

Target total under ~900ms. Clean, not busy: no confetti for member words.

Reduced motion: tiles fade out, row fades in, no movement.

---

## Phase 5 — Theme-word celebration (three switchable styles)

Runs after the Phase 4 sequence completes for the theme word. Every variant ends with the theme row in its scheme colour (Phase 1), the "They're all {category}!" toast, and haptic `theme`. Each variant must work when **zero or more** member words have been found, because the theme word can be found first.

Feel target: Duolingo-style. Snappy, bouncy, one clear moment, done in ≤1.6s. Build with SVG overlay + WAAPI. No libraries.

### Stitch (default)
1. The theme row pops (scale 1 → 1.06 → 1, back-ease) and its colour floods in from the left.
2. A small needle glyph runs down the left edge from the theme row through each found member row, leaving a running-stitch dashed thread behind it (stroke-dashoffset draw).
3. Each row bounces slightly as the needle passes.
4. The thread **pulls taut**: all found rows nudge 3–4px towards the theme row and spring back.
5. Tiny sparkle at the final stitch.

### Wind
1. The spool icon in the toolbar spins (two full turns, ease-out).
2. A thread arcs from the spool down to the theme row (path draw).
3. Diagonal stripes sweep across the theme row as if thread is being wound around it. The scheme colour is revealed under the stripes.
4. The row pops; found member rows do a quick sequential bounce.

### Tie
1. From each found member row, a curved thread draws towards the centre of the theme row.
2. The threads converge and a knot/bow glyph pops in at the join with overshoot.
3. A small burst of short thread snippets (6–10 tiny curved strokes) flies out and fades.
4. The theme row pulses once. If no members are found yet, the bow ties directly onto the theme row.

Reduced motion (all variants): theme colour fades in, toast shows, no travel or bounce.

---

## Phase 6 — Hints

Greenfield. The lightbulb in the HUD (top right of the play screen) triggers a hint.

- **Cost:** free, unlimited (prototype).
- **What a hint does:** chooses one unfound word and reveals its **column 1 and column 2** tiles. It clears any current selection, then auto-selects those two tiles (with thread and tray, as in the Figma frame), so the player continues from column 3.
- **Persistent badge:** both hinted tiles get a small lightbulb badge in their top-right corner. Badges remain until that word is found, survive shuffles (ids are stable), and survive a reload (persist under `threads-hints` keyed by level date).
- **Which word:** random among unfound **member** words. The theme word is only hintable once it's the last word left. Words that already have an active hint are skipped. If every unfound word already has a hint, the button shakes and toasts "Every word has a hint".
- **Animation:** badges pop in (scale 0 → 1.15 → 1, ≈220ms). The two tiles do the Phase 2 press. Haptic: `hint`.
- The hint button must respect `S.checking` and win state.
- Reduced motion: badges appear instantly.

---

## Phase 7 — Tutorial on the real engine

The current How to Play (`#s-how`) is static markup. Rebuild it as the interactive flow in the Figma frames, **using the real game engine** so it automatically gets thread drawing, press states, hops, celebrations and haptics.

- Run the engine in a tutorial mode with its own puzzle: ELEPHANT, ANIMAL (theme), MEERKAT, GIRAFFE, PANDA, on the 5×5 grid from the Figma frames.
- Tutorial mode doesn't start the timer, doesn't save progress, and hides hint/pause controls.
- Scripted steps change the copy and prompt pill per the Figma frames:
  1. "Try guessing Elephant": only ELEPHANT validates. Other complete words shake as normal.
  2. "Try guessing Animal": theme word explained, triggers the currently selected celebration style.
  3. "Finish the puzzle".
  4. Completion copy and hand-off to the game.
- Skip is available at every step. Keep the `threads-how-seen` gating.
- Delete the old static `.how-block` markup and CSS once replaced.

---

## Acceptance checklist (every phase)
- Game is fully playable start to finish, including dark mode.
- No console errors. No stale thread after resize/rotate.
- Reduced-motion fallback works.
- Input is blocked during every animated sequence, and nothing double-fires.
- Tested on a phone-sized viewport with touch emulation.
