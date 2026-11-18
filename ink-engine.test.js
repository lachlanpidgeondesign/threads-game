// Run with: node --test ink-engine.test.js
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const E = require("./ink-engine.js");

const sheet = rows => E.fromRows(rows);
const V = at => ({ axis: "v", at }), H = at => ({ axis: "h", at });

test("colours mix like paint: ink adds up", () => {
  assert.equal(E.mix("R", "Y"), "O");
  assert.equal(E.mix("R", "B"), "P");
  assert.equal(E.mix("Y", "B"), "G");
  assert.equal(E.mix("O", "B"), "K");
  assert.equal(E.mix("R", "R"), "R");
  assert.equal(E.mix(".", "B"), "B");
  assert.equal(E.missing("R", "O"), "Y");
  assert.equal(E.missing("O", "O"), ".");
});

test("a press prints both ways across the crease", () => {
  const s = sheet(["R.Y.", "....", "....", "...."]);
  assert.deepEqual(E.toRows(E.press(s, V(2))), ["RYYR", "....", "....", "...."]);
  assert.deepEqual(E.toRows(E.press(sheet(["R...", "....", "....", "...B"]), H(2))), ["R..B", "....", "....", "R..B"]);
});

test("touching inks mix on both sides", () => {
  const s = sheet(["RY", ".."]);
  assert.deepEqual(E.toRows(E.press(s, V(1))), ["OO", ".."]);
});

test("cells past the shorter half are untouched", () => {
  const s = sheet(["R...B"]);
  // crease after column 1: only columns 0 and 1 touch; column 4 has no partner
  assert.deepEqual(E.toRows(E.press(s, V(1))), ["RR..B"]);
});

test("which half you fold doesn't matter", () => {
  const s = sheet(["R..Y.", ".B...", "....."]);
  for (const c of E.creases(5, 3)) {
    const lo = E.press(s, Object.assign({ side: "lo" }, c)), hi = E.press(s, Object.assign({ side: "hi" }, c));
    assert.equal(lo.cells, hi.cells);
  }
});

test("changes lists exactly the cells that will change", () => {
  const s = sheet(["R...", "....", "....", "...."]);
  assert.deepEqual(E.changes(s, V(2)), [{ i: 3, colour: "R" }]);
  assert.deepEqual(E.changes(s, V(3)), []);
});

test("smudges: ink the target doesn't want can never be fixed", () => {
  const t = sheet(["O..O"]);
  assert.deepEqual(E.smudges(sheet(["OR.O"]), t), [1]);       // ink on blank
  assert.deepEqual(E.smudges(sheet(["P..O"]), t), [0]);       // blue in an orange cell
  assert.deepEqual(E.smudges(sheet(["R..Y"]), t), []);        // still on the way to orange
});

test("solve finds the shortest route, analyse counts routes by length", () => {
  const start = sheet(["R...", "....", "....", "...Y"]), t = sheet(["O..O", "....", "....", "O..O"]);
  const sol = E.solve(start, t);
  assert.equal(sol.length, 2);
  assert.ok(E.isSolved(sol.reduce(E.press, start), t));
  const a = E.analyse(start, t);
  assert.equal(a.par, 2);
  assert.equal(a.routes[0], 2);                                // either order
});

// every press sequence shorter than par, with no pruning at all: none may solve
function beatsPar(start, target, par) {
  const moves = E.creases(start.w, start.h);
  const go = (s, d) => {
    if (E.isSolved(s, target)) return true;
    if (d === 0) return false;
    return moves.some(c => go(E.press(s, c), d - 1));
  };
  return go(start, par - 1);
}

// tier: "tutorial" | "warm-up" | "easy" | "medium" | "hard" (keep in step with LEVELS in fold.html)
const LEVELS = [
  { name: "tutorial", tier: "tutorial", par: 2, start: ["R...", "....", "....", "...Y"], rows: ["O..O", "....", "....", "O..O"] },
  { name: "ring", tier: "warm-up", par: 1, start: [".R..", "R...", "R...", ".R.."], rows: [".RR.", "R..R", "R..R", ".RR."] },
  { name: "kiss", tier: "warm-up", par: 2, start: ["R...", ".R..", "....", "...."], rows: ["R..R", ".RR.", ".RR.", "R..R"] },
  { name: "flower", tier: "warm-up", par: 1, start: [".Y..", "YRY.", "YRY.", ".Y.."], rows: [".YY.", "YOOY", "YOOY", ".YY."] },
  { name: "sunset", tier: "warm-up", par: 2, start: ["....", ".YR.", "..B.", "...."], rows: ["....", "ROOR", "BBBB", "...."] },
  { name: "lantern", tier: "easy", par: 3,
    start: ["......", "......", "......", "......", "...R..", ".BY..."],
    rows: [".BYYB.", "..RR..", ".BOOB.", ".BOOB.", "..RR..", ".BYYB."] },
  { name: "sweet", tier: "easy", par: 3,
    start: ["......", ".....Y", "....BR", "......", "......", "......"],
    rows: ["......", "Y.YY.Y", "RBPPBR", "RBPPBR", "Y.YY.Y", "......"] },
  { name: "blanket", tier: "easy", par: 4,
    start: ["...R..", "......", "......", "......", "BY....", "......"],
    rows: ["RRRRRR", "BYGGYB", "......", "......", "BYGGYB", "RRRRRR"] },
  { name: "present", tier: "medium", par: 4,
    start: ["......", ".R....", "...Y..", "..B...", "......", "......"],
    rows: ["..YY..", "RRBBRR", "..GG..", "..GG..", "RRBBRR", "..YY.."] },
  { name: "railway", tier: "medium", par: 3,
    start: ["....B", ".R...", ".....", ".....", "....Y"],
    rows: [".R..G", ".R..G", ".R..G", ".R..G", ".R..Y"] },
  { name: "flag", tier: "medium", par: 4,
    start: ["......", "......", "YR....", ".....B", "......", "......"],
    rows: ["BBBBBB", "YROORY", "YROORY", "BBBBBB", "......", "......"] },
  { name: "frame", tier: "hard", par: 5,
    start: [".....R", "......", "......", "......", "......", "BY...."],
    rows: ["PORROP", "BY..YB", "......", "......", "BY..YB", "PORROP"] },
  { name: "gate", tier: "hard", par: 5,
    start: ["......", "...Y..", "....R.", "......", "......", ".....B"],
    rows: ["B....B", "GYYYYG", ".R..R.", ".R..R.", "GYYYYG", "B....B"] }
];
for (const L of LEVELS) {
  test("level " + L.name + ": par " + L.par + " is reachable and can't be beaten", () => {
    const lv = E.makeLevel(L.rows, L.start);
    assert.equal(lv.par, L.par);
    assert.ok(E.isSolved(lv.solution.reduce(E.press, lv.start), lv.target));
    assert.equal(beatsPar(lv.start, lv.target, L.par), false);
  });
}

test("from Easy up, finishing over par is possible, so the score means something", () => {
  for (const L of LEVELS.filter(l => ["easy", "medium", "hard"].includes(l.tier))) {
    const lv = E.makeLevel(L.rows, L.start), a = E.analyse(lv.start, lv.target);
    assert.ok(a.routes.slice(1).some(n => n > 0), L.name + " has no over-par finish");
  }
});

test("from Medium up, the obvious route doesn't hit par", () => {
  for (const L of LEVELS.filter(l => ["medium", "hard"].includes(l.tier))) {
    const lv = E.makeLevel(L.rows, L.start), g = E.greedy(lv.start, lv.target);
    assert.ok(g == null || g > L.par, L.name + " greedy " + g);
  }
});
