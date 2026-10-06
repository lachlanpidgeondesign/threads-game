# Threads — build plan

Full detail for every phase is in `design/threads/SPEC.md`. This file tracks progress and lists the extra requirements decided in review.

## Status
- [x] Phase 0: Foundations
- [x] Phase 1: Colour (incl. 1b single found bars)
- [x] Phase 2: Tile press / tray rise
- [x] Phase 3: Curved thread + drag
- [x] Phase 4: Correct-word success (timing follow-up is in Phase 5)
- [ ] Phase 5: Theme celebration
- [ ] Phase 6: Hints
- [ ] Phase 7: Tutorial on the real engine

---

## Phase 5: Theme celebration (+ Phase 4 follow-up)

**First,** run `git log --oneline`. If a "Phase 5" commit already exists, don't rebuild it. Send it straight to the reviewer, fix what it finds, and tick it off.

**Phase 4 follow-up (do first):**
- Overlap the success steps. The collapse starts as the last tile lands, and the bar grows while the tiles collapse.
- Release `S.checking` once the remaining tiles finish their FLIP fall-up. The ripple and pulse can finish after input unlocks.
- For the theme word, input stays locked through the celebration.
- Remove the dead `foundPop` render option and the `.block--found-pop` CSS.

**Phase 5:**
- All three styles (Stitch, Wind, Tie), chosen by the Prototype setting. Wind animates the spool in the HUD.
- The celebration plugs into the `onThemeFound` hook and runs after the success sequence.
- Add a "Replay celebration" button in the Prototype section of the ••• menu. It's hidden until the theme word is found and uses whichever member bars exist.
- A member word found straight after the theme word waits until the celebration has fully finished, so nothing overlaps.

**Done when:**
- The measured input lock for a member word is about 800ms or less.
- Each style works with 0, 2 and 4 member bars, in light and dark, and with reduced motion.
- Each style finishes in 1.6s or less.

🛑 CHECKPOINT: I'll try all three styles on my phone and pick one.

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
