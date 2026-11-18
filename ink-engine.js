/* Untitled Fold Game: Ink Press engine (pure, no DOM). Works as a browser
   global (window.FoldEngine) and as a CommonJS module for `node --test`.

   Sheet  = { w, h, cells } where cells is a row-major string, "." = blank paper
            and any other character = a wet ink colour.
   Crease = { axis: "v" | "h", at: k }. A "v" crease at k is the grid line
            between column k-1 and k. An optional `side` ("lo" | "hi") only says
            which half the player physically folded; the result is the same.

   A press folds the sheet along the crease, presses, and opens it again. Every
   pair of cells that touch while folded prints onto each other, both ways, and
   the inks mix. Cells with nothing to touch (past the shorter half) are left
   alone. Ink adds up and never comes off.

   Colours are sets of the three primaries (red, yellow, blue), so mixing is
   just a union: R+Y = O(range), R+B = P(urple), Y+B = G(reen), all three = K
   (brown). Because ink only adds up, a cell holding a primary the target
   doesn't want can never be fixed (a smudge). */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.FoldEngine = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  const BLANK = ".";
  const LETTERS = ".RYOBPGK";                       // index = primary bitmask (R=1, Y=2, B=4)
  const mask = ch => LETTERS.indexOf(ch);
  const mix = (a, b) => LETTERS[mask(a) | mask(b)];
  // the ink a cell still needs to reach `want` ("." if none, or if it can't)
  const missing = (have, want) => LETTERS[mask(want) & ~mask(have)];

  function fromRows(rows) { return { w: rows[0].length, h: rows.length, cells: rows.join("") }; }
  const toRows = s => Array.from({ length: s.h }, (_, y) => s.cells.slice(y * s.w, (y + 1) * s.w));

  function creases(w, h) {
    const out = [];
    for (let k = 1; k < w; k++) out.push({ axis: "v", at: k });
    for (let k = 1; k < h; k++) out.push({ axis: "h", at: k });
    return out;
  }
  // which cells a physical fold lifts (only used to animate it)
  const isMoving = (x, y, c) => {
    const v = c.axis === "v" ? x : y;
    return c.side === "lo" ? v < c.at : v >= c.at;
  };
  const mirror = (x, y, c) => (c.axis === "v" ? [2 * c.at - 1 - x, y] : [x, 2 * c.at - 1 - y]);

  // the pairs of cell indices that touch when folded along c
  function pairs(s, c) {
    const n = c.axis === "v" ? s.w : s.h, span = Math.min(c.at, n - c.at), out = [];
    for (let d = 0; d < span; d++) {
      const a = c.at - 1 - d, b = c.at + d;
      if (c.axis === "v") for (let y = 0; y < s.h; y++) out.push([y * s.w + a, y * s.w + b]);
      else for (let x = 0; x < s.w; x++) out.push([a * s.w + x, b * s.w + x]);
    }
    return out;
  }

  function press(s, c) {
    const out = s.cells.split("");
    for (const [i, j] of pairs(s, c)) out[i] = out[j] = mix(s.cells[i], s.cells[j]);
    return { w: s.w, h: s.h, cells: out.join("") };
  }

  // the cells a press would change: [{ i, colour }]
  function changes(s, c) {
    const n = press(s, c), out = [];
    for (let i = 0; i < s.cells.length; i++) if (n.cells[i] !== s.cells[i]) out.push({ i, colour: n.cells[i] });
    return out;
  }

  const isSolved = (s, target) => s.cells === target.cells;
  const isSmudge = (have, want) => (mask(have) & ~mask(want)) !== 0;
  function smudges(s, target) {
    const out = [];
    for (let i = 0; i < s.cells.length; i++) if (isSmudge(s.cells[i], target.cells[i])) out.push(i);
    return out;
  }
  const isDead = (s, target) => smudges(s, target).length > 0;

  // breadth-first search: the shortest list of presses, or null
  function solve(start, target, opts = {}) {
    const maxDepth = opts.maxDepth || 8;
    if (isSolved(start, target)) return [];
    if (isDead(start, target)) return null;
    const moves = creases(start.w, start.h);
    const seen = new Set([start.cells]);
    let frontier = [{ s: start, path: [] }];
    for (let d = 1; d <= maxDepth && frontier.length; d++) {
      const next = [];
      for (const n of frontier) for (const c of moves) {
        const s = press(n.s, c);
        if (seen.has(s.cells)) continue;
        seen.add(s.cells);
        if (isDead(s, target)) continue;
        const path = n.path.concat([c]);
        if (isSolved(s, target)) return path;
        next.push({ s, path });
      }
      frontier = next;
    }
    return null;
  }

  /* Par analysis. Counts every way to finish (no wasted presses, no smudges)
     by length, up to par + extra. routes[0] = ways to hit par, routes[1] =
     ways to finish one over, and so on. A good level has few ways to hit par
     and plenty of ways to finish over it, so the score means something. */
  function analyse(start, target, opts = {}) {
    const extra = opts.extra == null ? 2 : opts.extra, maxDepth = opts.maxDepth || 10;
    const moves = creases(start.w, start.h);
    let layer = new Map([[start.cells, 1]]);
    let par = null;
    const routes = [];
    for (let d = 1; d <= maxDepth && layer.size; d++) {
      const next = new Map();
      let done = 0;
      for (const [cells, count] of layer) {
        const s = { w: start.w, h: start.h, cells };
        for (const c of moves) {
          const n = press(s, c);
          if (n.cells === cells || isDead(n, target)) continue;
          if (isSolved(n, target)) { done += count; continue; }
          next.set(n.cells, (next.get(n.cells) || 0) + count);
        }
      }
      if (done && par == null) par = d;
      if (par != null) { routes.push(done); if (d >= par + extra) break; }
      layer = next;
    }
    return { par, routes };
  }

  // a naive player: always take the press that matches the most cells without
  // smudging. Returns its press count, or null if it gets stuck.
  function greedy(start, target) {
    const score = s => { let n = 0; for (let i = 0; i < s.cells.length; i++) if (s.cells[i] === target.cells[i]) n++; return n; };
    let s = start;
    for (let i = 0; i < 30; i++) {
      if (isSolved(s, target)) return i;
      let best = null, bestScore = score(s);
      for (const c of creases(s.w, s.h)) {
        const n = press(s, c);
        if (isDead(n, target)) continue;
        const sc = score(n);
        if (sc > bestScore) { best = n; bestScore = sc; }
      }
      if (!best) return null;
      s = best;
    }
    return null;
  }

  // a level = the target picture + the sheet at the start. Par is the
  // shortest solution, so it's always reachable and can't be beaten.
  function makeLevel(picture, startRows) {
    const target = fromRows(picture), start = fromRows(startRows);
    const solution = solve(start, target, { maxDepth: 10 });
    if (!solution) throw new Error("Level has no solution");
    return { w: target.w, h: target.h, start, target, solution, par: solution.length };
  }

  return { BLANK, LETTERS, mask, mix, missing, fromRows, toRows, creases, isMoving, mirror,
    pairs, press, changes, isSolved, isSmudge, smudges, isDead, solve, analyse, greedy, makeLevel };
});
