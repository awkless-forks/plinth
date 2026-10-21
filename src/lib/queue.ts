// pure queue helpers: no runes, so `bun test` can import them

// Fisher-Yates on the items after index `at`; items up to `at` keep their place
export function shuffleAfter<T>(items: T[], at: number, rand = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > at + 1; i--) {
    const j = at + 1 + Math.floor(rand() * (i - at));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// move one item; `at` (the playing index) follows so the same track stays current
export function moveItem<T>(items: T[], at: number, from: number, to: number): [T[], number] {
  const out = [...items];
  out.splice(to, 0, ...out.splice(from, 1));
  if (from === at) at = to;
  else if (from < at && to >= at) at--;
  else if (from > at && to <= at) at++;
  return [out, at];
}
