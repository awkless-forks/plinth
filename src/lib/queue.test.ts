// @ts-expect-error bun's built-in test module; run with `bun test src/lib` (no @types/bun installed)
import { expect, test } from "bun:test";
import { moveItem, shuffleAfter } from "./queue";

test("moveItem keeps the playing track current", () => {
  const q = ["a", "b", "c", "d", "e"]; // "c" playing, at = 2
  const at = (r: [string[], number]) => r[0][r[1]];
  expect(moveItem(q, 2, 4, 3)).toEqual([["a", "b", "c", "e", "d"], 2]); // both after current
  expect(at(moveItem(q, 2, 0, 4))).toBe("c"); // from before to after
  expect(at(moveItem(q, 2, 4, 0))).toBe("c"); // from after to before
  expect(moveItem(q, 2, 2, 4)).toEqual([["a", "b", "d", "e", "c"], 4]); // the current one itself
  expect(at(moveItem(q, 2, 3, 2))).toBe("c"); // onto the current slot
  expect(q).toEqual(["a", "b", "c", "d", "e"]); // input not changed
});

test("shuffleAfter keeps the head in place and the same items", () => {
  const q = ["a", "b", "c", "d", "e", "f"];
  for (let n = 0; n < 50; n++) {
    const s = shuffleAfter(q, 1);
    expect(s.slice(0, 2)).toEqual(["a", "b"]);
    expect([...s].sort()).toEqual(q);
  }
  expect(q).toEqual(["a", "b", "c", "d", "e", "f"]); // input not changed
});

test("shuffleAfter moves items", () => {
  // rand() = 0 always swaps with the first shufflable slot, so the order must change
  expect(shuffleAfter(["a", "b", "c", "d"], -1, () => 0)).not.toEqual(["a", "b", "c", "d"]);
});

test("shuffleAfter handles empty and short lists", () => {
  expect(shuffleAfter([], -1)).toEqual([]);
  expect(shuffleAfter(["a"], 0)).toEqual(["a"]);
});
