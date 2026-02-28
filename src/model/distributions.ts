/** Triangular sample: min, mode, max. Returns value in [min, max]. */
export function sampleTriangular(min: number, mode: number, max: number): number {
  const u = Math.random();
  const c = (mode - min) / (max - min) || 0;
  if (u <= c) return min + Math.sqrt(u * (max - min) * (mode - min)) || min;
  return max - Math.sqrt((1 - u) * (max - min) * (max - mode)) || max;
}

/** Poisson: number of events with mean lambda. */
export function samplePoisson(lambda: number): number {
  if (lambda <= 0) return 0;
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

/** Bernoulli: 1 with prob p, else 0 */
export function sampleBernoulli(p: number): number {
  return Math.random() < p ? 1 : 0;
}
