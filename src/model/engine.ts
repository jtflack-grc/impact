import { sampleTriangular, samplePoisson, sampleBernoulli } from "./distributions";
import { netLoss } from "./insurance";
import type { InputValue } from "../store/types";

/** Secondary loss components (fixed for simplicity; could come from archetype) */
const COST_LEGAL = 200000;
const COST_NOTIFICATION = 150000;
const COST_CHURN = 400000;

/** One Monte Carlo iteration: returns gross and net annual loss */
export function runOneIteration(
  effective: Record<string, InputValue>,
  deductible: number,
  coverageLimit: number
): { gross: number; net: number } {
  const sample = (key: string): number => {
    const v = effective[key];
    if (!v) return 0;
    const min = v.min ?? v.mode * 0.5;
    const max = v.max ?? v.mode * 1.5;
    return sampleTriangular(min, v.mode, max);
  };

  const TEF = sample("TEF");
  const P_IA = sample("P_InitialAccess");
  const P_IFS = sample("P_IFSReachable");
  const P_Write = sample("P_WriteAccess");
  const lambda = TEF * P_IA * P_IFS * P_Write;
  const eventCount = samplePoisson(lambda);

  let gross = 0;
  for (let i = 0; i < eventCount; i++) {
    const ir = sample("Cost_IR");
    const recovery = sample("Cost_Recovery");
    const tDetect = sample("T_DetectDays");
    const tRecover = sample("T_RecoveryDays");
    const costPerDay = sample("Cost_DowntimePerDay");
    const downtime = (tDetect + tRecover) * costPerDay;
    const primary = ir + recovery + downtime;
    const pSec = sample("P_Secondary");
    const secondary = sampleBernoulli(pSec) * (COST_LEGAL + COST_NOTIFICATION + COST_CHURN);
    gross += primary + secondary;
  }

  const net = netLoss(gross, deductible, coverageLimit);
  return { gross, net };
}

/** Percentile from sorted array (0-1) */
export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const i = p * (sorted.length - 1);
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  if (lo === hi) return sorted[lo];
  return sorted[lo] * (1 - (i - lo)) + sorted[hi] * (i - lo);
}
