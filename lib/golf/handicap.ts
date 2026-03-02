export function roundWHS(value: number): number {
  // WHS recommends standard rounding to nearest integer, .5 rounds up.
  return Math.round(value);
}

export function calculateCourseHandicap(
  handicapIndex: number,
  slopeRating: number,
  courseRating: number,
  par: number,
  pcc = 0
): number {
  const raw = handicapIndex * (slopeRating / 113) + (courseRating - par) + pcc;
  return roundWHS(raw);
}

export function calculatePlayingHandicap(courseHandicap: number, allowanceMultiplier: number): number {
  return roundWHS(courseHandicap * allowanceMultiplier);
}

export function allocateStrokesByHole(playingHandicap: number, strokeIndexes: number[]): number[] {
  const allocations = strokeIndexes.map(() => 0);
  const positiveHandicap = Math.max(0, playingHandicap);
  const base = Math.floor(positiveHandicap / 18);
  let remainder = positiveHandicap % 18;

  for (let i = 0; i < allocations.length; i++) allocations[i] = base;

  const sorted = strokeIndexes
    .map((si, idx) => ({ si, idx }))
    .sort((a, b) => a.si - b.si);

  for (const hole of sorted) {
    if (!remainder) break;
    allocations[hole.idx] += 1;
    remainder -= 1;
  }

  return allocations;
}

export function stablefordPoints(par: number, grossStrokes: number, strokesReceived: number): number {
  const netStrokes = grossStrokes - strokesReceived;
  return Math.max(0, 2 + (par - netStrokes));
}
