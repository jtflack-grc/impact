/**
 * Control maturity 0-5 maps to a multiplier per affected variable.
 * Maturity 0 = no reduction (1.0), 5 = strong reduction (e.g. 0.2).
 * Smooth curve: mult = 1 - (maturity/5) * strength; strength ~ 0.8 for most.
 */
const DEFAULT_STRENGTH = 0.8;

function multiplier(maturity: number, strength: number = DEFAULT_STRENGTH): number {
  return Math.max(0.05, 1 - (maturity / 5) * strength);
}

/** For probability variables: higher maturity = lower value (mult < 1) */
export function probabilityMultiplier(maturity: number): number {
  return multiplier(maturity, 0.85);
}

/** For time variables (T_DetectDays, T_RecoveryDays): higher maturity = lower days */
export function timeMultiplier(maturity: number): number {
  return multiplier(maturity, 0.8);
}

/** For cost variables: higher maturity = lower cost */
export function costMultiplier(maturity: number): number {
  return multiplier(maturity, 0.7);
}
