import { describe, expect, it } from 'vitest';
import {
  allocateStrokesByHole,
  calculateCourseHandicap,
  calculatePlayingHandicap,
  stablefordPoints
} from './handicap';

describe('WHS calculations', () => {
  it('calculates course handicap with WHS rounding', () => {
    expect(calculateCourseHandicap(12.4, 132, 72.6, 71)).toBe(15);
  });

  it('calculates playing handicap with allowance', () => {
    expect(calculatePlayingHandicap(15, 0.95)).toBe(14);
  });

  it('allocates strokes by stroke index order', () => {
    const si = Array.from({ length: 18 }, (_, i) => i + 1);
    const allocations = allocateStrokesByHole(20, si);
    expect(allocations[0]).toBe(2);
    expect(allocations[1]).toBe(2);
    expect(allocations[17]).toBe(1);
  });

  it('calculates stableford points', () => {
    expect(stablefordPoints(4, 5, 1)).toBe(2);
    expect(stablefordPoints(4, 8, 0)).toBe(0);
  });
});
