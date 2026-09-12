export interface LossHistogramBin {
  index: number;
  low: number;
  high: number;
  midpoint: number;
  count: number;
  share: number;
}

const P90_QUANTILE = 0.9;
const TAIL_POWER = 2;

function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Build a deterministic Monte Carlo cloud from the scenario's published mean and P90 anchors.
 *
 * The quantile curve is intentionally simple and auditable:
 * - 0-90th percentile: power curve ending exactly at P90
 * - 90-100th percentile: bounded heavy-tail extension above P90
 *
 * The body exponent is solved from the target mean, so the reconstructed distribution
 * preserves both scenario anchors without pretending we have the original factor-level samples.
 */
export function buildCalibratedLossSamples(
  meanMillions: number,
  p90Millions: number,
  seedKey: string,
  sampleCount = 8000
): number[] {
  if (meanMillions <= 0 || p90Millions <= 0 || sampleCount <= 0) return [];

  const targetMeanRatio = Math.max(0.102, Math.min(0.92, meanMillions / p90Millions));
  const maximumTailFactor = Math.max(
    0.05,
    ((targetMeanRatio - 0.102) * (TAIL_POWER + 1)) / 0.1
  );
  const tailFactor = Math.min(1.2, Math.max(0.05, maximumTailFactor * 0.72));
  const tailMeanRatio = 0.1 * (1 + tailFactor / (TAIL_POWER + 1));
  const bodyMeanRatio = Math.max(0.0025, targetMeanRatio - tailMeanRatio);
  const bodyExponent = Math.max(0.08, 0.9 / bodyMeanRatio - 1);
  const random = mulberry32(hashSeed(seedKey));

  const samples: number[] = [];
  for (let index = 0; index < sampleCount; index += 1) {
    const u = Math.min(0.999999, Math.max(0.000001, random()));
    if (u <= P90_QUANTILE) {
      samples.push(
        p90Millions * Math.pow(u / P90_QUANTILE, bodyExponent)
      );
      continue;
    }

    const tailPosition = (u - P90_QUANTILE) / (1 - P90_QUANTILE);
    samples.push(
      p90Millions *
        (1 + tailFactor * Math.pow(tailPosition, TAIL_POWER))
    );
  }

  return samples;
}

export function percentileValue(samples: number[], percentile: number): number {
  if (samples.length === 0) return 0;
  const sorted = [...samples].sort((a, b) => a - b);
  const position = Math.max(0, Math.min(1, percentile)) * (sorted.length - 1);
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  const weight = position - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

export function buildLossHistogram(
  samples: number[],
  binCount = 28
): LossHistogramBin[] {
  if (samples.length === 0 || binCount <= 0) return [];
  const maximum = Math.max(...samples);
  const width = maximum > 0 ? maximum / binCount : 1;
  const bins = Array.from({ length: binCount }, (_, index) => {
    const low = index * width;
    const high = index === binCount - 1 ? maximum + Number.EPSILON : (index + 1) * width;
    return {
      index,
      low,
      high,
      midpoint: low + (high - low) / 2,
      count: 0,
      share: 0,
    };
  });

  for (const sample of samples) {
    const index = Math.min(
      binCount - 1,
      Math.max(0, Math.floor(sample / Math.max(width, Number.EPSILON)))
    );
    bins[index].count += 1;
  }

  return bins.map((bin) => ({
    ...bin,
    share: bin.count / samples.length,
  }));
}
