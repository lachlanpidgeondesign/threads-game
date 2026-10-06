# Threads

Daily 5×5 word game. Players connect one tile per column, left to right, to spell words. There are five words per puzzle: four members and one theme word that names their category. It's a prototype that runs in a web view.

## Codebase
- The game is `threads.html` at the repo root: vanilla HTML/CSS/JS, global state `S`, no build step.
- No frameworks, bundlers, npm dependencies or animation libraries. Splitting out `threads.css` / `threads.js` is allowed but not required.
- The spec lives at `design/threads/SPEC.md`. Where the spec and the Figma PNGs disagree on visuals, the Figma PNGs (also in `design/threads/`) win. On behaviour, the spec wins.
- `PLAN.md` at the repo root tracks progress through the spec's phases.
- Pushing to `main` is fine. It's my own repo.

## Things that must stay true
- Rendering is keyed: tiles and found bars are created once and reused. Never wipe `#tgrid.innerHTML`.
- All choreography goes through the WAAPI `anim()` helper. Don't add new `setTimeout` chains.
- `S.checking` blocks input for every animated sequence. Nothing double-fires.
- Input lock for a member word stays at about 800ms or less, because the game is timed against a 180s par.
- Every feature works by tap and by drag, in light and dark, in all three colour schemes, and with reduced motion.
- The theme word can be found first, so anything involving member bars must work with zero of them.
- Persistence keys: `threads-hints` (keyed by level date) and `threads-how-seen`.

## Reporting to me
Anything you report to me uses short one-line items tagged with emoji (🔴 🟠 ⚪ ❓ ✅), with no paragraphs.
