# Threads — build plan

Full detail for every phase is in `design/threads/SPEC.md`. This file tracks progress and lists the extra requirements decided in review.

## Status
- [x] Phase 0: Foundations
- [x] Phase 1: Colour (incl. 1b single found bars)
- [x] Phase 2: Tile press / tray rise
- [x] Phase 3: Curved thread + drag
- [x] Phase 4: Correct-word success (timing follow-up is in Phase 5)
- [x] Phase 5: Theme celebration — superseded by the Golden Thread (see below)
- [x] Golden Thread: sewn-thread system replacing the Phase 3 thread, Phase 4 collapse and Phase 5 celebration
- [x] Phase 6: Hints
- [x] Phase 7: Tutorial on the real engine (awaiting phone hand-test)

---

## Golden Thread (supersedes Phases 3–5 visuals)

A single sewn-thread system now owns selection, collapse and the ending, ported
from the behaviour of `golden-thread-reference.html` (tassel-knot ending only).
It replaces the old curved selection thread (Phase 3), the scale/fade collapse
and full-width found bars (Phase 4), and the Stitch/Wind/Tie celebration
(Phase 5), which have all been removed.

- Found words render as a compressed 5-tile seam with a persistent thread sewn
  through holes in each tile face (theme = gold, members = linen). An amber
  needle stitches the live selection as you tap/drag and parks at the tip as a
  row-position marker.
- Correct words pull their tiles up into the seam (right tile first, backOut
  landing, slack springing taut); remaining tiles fall up at the same time.
- The theme word gives a "found!" beat — its tiles flush gold and bounce
  left→right — then every found thread ties into a tassel knot that hangs off
  the right edge. Member words found after the theme tie in one at a time. Tap
  the board to skip; the ••• menu has a "Replay ending" button.
- Reduced motion: threads fade/snap, tiles go gold without the bounce, the knot
  appears without travel.

🛑 CHECKPOINT: hand-tested on my phone across the iterations above.

---

## Phase 6: Hints

- A hint replaces any selection in progress.
- After a hint, the player can carry on by tapping or by dragging from the hinted column 2 tile, which counts as the last selected tile.
- Deselecting or truncating the hinted tiles leaves the badges in place. They only go when the word is found.
- The hint button is disabled during checking and after winning, and has a flag the tutorial can use to hide it.

**Done when:** all of these work: hint then tap, hint then drag, hint mid-selection, truncating hinted tiles, every word hinted (the button shakes and shows a toast), shuffle with badges, and reload with badges.

---

## Phase 7: Tutorial on the real engine

- Use the exact grid and copy from the Figma tutorial frames in `design/threads/`. The theme word is ANIMAL.
- No hint button, no timer and no saved progress in the tutorial.
- The celebration uses whichever style is selected in the Prototype panel.
- The final "That's the game." pill hands off to the levels screen (or straight into play if a level was already chosen) and sets `threads-how-seen`.
- Delete the old static How to Play markup (`.how-block`) and its CSS.

**Done when:**
- The full tutorial works by tapping and by dragging.
- Skip works at every step.
- The tutorial can be reopened from the ••• menu.

🛑 CHECKPOINT: final hand test on my phone.

---

## Decisions to confirm

From Phase 5 review:
- ❓ Spool icon added to the HUD toolbar is always visible for all three styles, not just Wind — keep it that way or hide it unless Wind is selected?
- ❓ The Replay celebration button is not gated by `S.checking`, so it can re-trigger a celebration mid-animation — should it be disabled while a celebration/check is running?
