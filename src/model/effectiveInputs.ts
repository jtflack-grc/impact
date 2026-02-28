import type { InputValue } from "../store/types";
import type { ControlDef } from "../store/types";
import { probabilityMultiplier, timeMultiplier, costMultiplier } from "./controlMultipliers";

const PROB_VARS = new Set(["TEF", "P_InitialAccess", "P_IFSReachable", "P_WriteAccess", "P_Secondary"]);
const TIME_VARS = new Set(["T_DetectDays", "T_RecoveryDays"]);
const COST_VARS = new Set(["Cost_IR", "Cost_Recovery", "Cost_DowntimePerDay"]);

function getMultiplierForVariable(
  variableId: string,
  controls: Record<string, number>,
  controlDefs: ControlDef[]
): number {
  let product = 1;
  for (const c of controlDefs) {
    if (!c.variableIds.includes(variableId)) continue;
    const m = controls[c.id] ?? 0;
    if (PROB_VARS.has(variableId)) product *= probabilityMultiplier(m);
    else if (TIME_VARS.has(variableId)) product *= timeMultiplier(m);
    else if (COST_VARS.has(variableId)) product *= costMultiplier(m);
    else product *= probabilityMultiplier(m);
  }
  return product;
}

/** Apply control maturity to baseline inputs; returns effective min/mode/max per variable */
export function getEffectiveInputs(
  inputs: Record<string, InputValue>,
  controls: Record<string, number>,
  controlDefs: ControlDef[]
): Record<string, InputValue> {
  const out: Record<string, InputValue> = {};
  for (const [id, val] of Object.entries(inputs)) {
    const mult = getMultiplierForVariable(id, controls, controlDefs);
    out[id] = {
      min: val.min != null ? val.min * mult : undefined,
      mode: val.mode * mult,
      max: val.max != null ? val.max * mult : undefined,
    };
  }
  return out;
}
