import { describe, expect, it } from 'vitest';
import { resolveStep, stepBack, stepForward } from './legendSteps';

describe('legend steps', () => {
  it('always has a current chord when there is a legend', () => {
    expect(resolveStep(0, 3)).toBe(0);
    expect(resolveStep(2, 3)).toBe(2);
    expect(resolveStep(null, 3)).toBe(0);
    expect(resolveStep(5, 3)).toBe(0); // out of range, e.g. after switching to a shorter progression
  });

  it('has no step without a legend', () => {
    expect(resolveStep(0, 0)).toBeNull();
    expect(resolveStep(0, 1)).toBeNull();
    expect(stepForward(0, 1)).toBeNull();
    expect(stepBack(0, 0)).toBeNull();
  });

  it('▶ wraps from the last chord to the first', () => {
    expect(stepForward(0, 3)).toBe(1);
    expect(stepForward(1, 3)).toBe(2);
    expect(stepForward(2, 3)).toBe(0);
  });

  it('◀ wraps from the first chord to the last', () => {
    expect(stepBack(2, 3)).toBe(1);
    expect(stepBack(1, 3)).toBe(0);
    expect(stepBack(0, 3)).toBe(2);
    expect(stepBack(0, 4)).toBe(3);
  });
});
