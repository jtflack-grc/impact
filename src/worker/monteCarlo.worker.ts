import { runOneIteration, percentile } from "../model/engine";
import type { InputValue } from "../store/types";

const SENSITIVITY_VARS = ["P_IFSReachable", "P_WriteAccess", "T_DetectDays", "P_Secondary", "TEF"] as const;

function cloneInputs(inputs: Record<string, InputValue>): Record<string, InputValue> {
  const out: Record<string, InputValue> = {};
  for (const [k, v] of Object.entries(inputs)) {
    out[k] = { ...v, min: v.min, max: v.max, mode: v.mode };
  }
  return out;
}

function perturb(inputs: Record<string, InputValue>, varId: string, factor: number): Record<string, InputValue> {
  const next = cloneInputs(inputs);
  const v = next[varId];
  if (v) {
    next[varId] = {
      min: v.min != null ? v.min * factor : undefined,
      mode: v.mode * factor,
      max: v.max != null ? v.max * factor : undefined,
    };
  }
  return next;
}

self.onmessage = (e: MessageEvent<{
  effective: Record<string, InputValue>;
  deductible: number;
  coverageLimit: number;
  iterationCount: number;
  runSensitivity?: boolean;
}>) => {
  const { effective, deductible, coverageLimit, iterationCount, runSensitivity } = e.data;
  const grosses: number[] = [];
  const nets: number[] = [];

  for (let i = 0; i < iterationCount; i++) {
    const { gross, net } = runOneIteration(effective, deductible, coverageLimit);
    grosses.push(gross);
    nets.push(net);
  }

  grosses.sort((a, b) => a - b);
  nets.sort((a, b) => a - b);

  const meanNet = nets.reduce((a, b) => a + b, 0) / nets.length;
  const medianNet = percentile(nets, 0.5);
  const p90g = percentile(grosses, 0.9);
  const p50n = percentile(nets, 0.5);
  const p90n = percentile(nets, 0.9);
  const p95n = percentile(nets, 0.95);

  let topDriver: string | undefined;
  if (runSensitivity && iterationCount >= 1000) {
    const baselineP90 = p90n;
    let maxDelta = 0;
    for (const varId of SENSITIVITY_VARS) {
      const perturbed = perturb(effective, varId, 1.1);
      const perturbedNets: number[] = [];
      for (let i = 0; i < Math.min(2000, iterationCount); i++) {
        const { net } = runOneIteration(perturbed, deductible, coverageLimit);
        perturbedNets.push(net);
      }
      perturbedNets.sort((a, b) => a - b);
      const perturbP90 = percentile(perturbedNets, 0.9);
      const delta = perturbP90 - baselineP90;
      if (delta > maxDelta) {
        maxDelta = delta;
        topDriver = varId;
      }
    }
    if (!topDriver) topDriver = SENSITIVITY_VARS[0];
  } else {
    topDriver = "P_WriteAccess";
  }

  self.postMessage({
    mean: meanNet,
    median: medianNet,
    p50: p50n,
    p90: p90n,
    p95: p95n,
    grossP90: p90g,
    netP90: p90n,
    topDriver,
    iterationCount,
    lossSamples: nets.slice(0, 5000),
  });
};
