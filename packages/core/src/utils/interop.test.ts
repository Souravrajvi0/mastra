import { describe, expect, it } from 'vitest';
import { interopDefault } from './interop';
import { pMap, pMapSkip } from './p-map';
import { slugify } from './slugify';
import { estimateTokenCount, sliceByTokens } from './token-estimate';

describe('interopDefault', () => {
  it('returns the export when the default import is already the function', () => {
    const fn = () => 'called';

    expect(interopDefault(fn)).toBe(fn);
  });

  it('unwraps a module namespace object', () => {
    const fn = () => 'called';
    const namespace = { default: fn };

    expect(interopDefault(namespace)).toBe(fn);
  });
});

describe('CJS-safe utility wrappers', () => {
  it('exports slugify as a function', () => {
    expect(slugify('My Server Id')).toBe('my-server-id');
  });

  it('exports pMap as a function', async () => {
    await expect(pMap([1, 2], async value => value * 2)).resolves.toEqual([2, 4]);
  });

  it('supports pMapSkip', async () => {
    await expect(
      pMap([1, 2, 3], async value => (value === 2 ? pMapSkip : value)),
    ).resolves.toEqual([1, 3]);
  });

  it('estimates and slices tokens', () => {
    const text = 'hello world from mastra';

    expect(estimateTokenCount(text)).toBeGreaterThan(0);
    expect(sliceByTokens(text, 0, 2)).toBe('hello world');
  });
});
