import type { Perspective } from "../store/types";
import type { SceneId } from "../store/types";

export interface ScribeInputs {
  perspective: Perspective;
  scene: SceneId;
  netP90?: number;
  grossP90?: number;
  p90PctEbitda?: number;
  liquidityStress?: boolean;
  leverageStress?: number;
  archetypeName?: string;
  topDriver?: string;
}

/** Rule-based narrative; no LLM. Different tone per perspective. */
export function generateScribe(inputs: ScribeInputs): string {
  const { perspective, scene, netP90 = 0, grossP90 = 0, p90PctEbitda = 0, liquidityStress, leverageStress, archetypeName, topDriver } = inputs;
  const fmt = (n: number) => (n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${Math.round(n / 1e3)}k`);

  if (perspective === "Finance") {
    const parts: string[] = [];
    parts.push(`Net P90 equals ${fmt(netP90)}`);
    if (p90PctEbitda > 0) parts.push(`${p90PctEbitda.toFixed(1)}% of EBITDA`);
    if (liquidityStress) parts.push("and breaches cash reserves.");
    if (leverageStress != null && leverageStress > 4) parts.push(`Leverage rises to ${leverageStress.toFixed(1)}x under stress.`);
    return parts.join(" ") + (parts.length ? "." : "Select an archetype and run simulation.");
  }

  if (perspective === "Risk") {
    if (scene === "board" || scene === "artifact")
      return `Tail loss is driven by pivot success probability. ${topDriver ?? "Write access"} and time-to-detect dominate P90 sensitivity. Gross P90 ${fmt(grossP90)}; net ${fmt(netP90)}.`;
    return `Scenario: ${scene}. Key drivers: threat event frequency, IFS reachability, write access. P90 reflects primary plus secondary loss potential.`;
  }

  if (perspective === "Infrastructure") {
    if (scene === "pivot" || scene === "exposure")
      return "Service accounts and exit controls determine write authority to production IFS. Segmentation and SMB hardening reduce pivot path.";
    if (scene === "silence")
      return "QAUDJRN coverage and SIEM correlation drive time-to-detect. Gaps extend dwell time and secondary loss risk.";
    if (scene === "recovery")
      return "Immutable backups and restore testing reduce recovery time and cost variance.";
    return `Infrastructure posture for ${scene}: controls map to IFS access, detection, and recovery. ${archetypeName ?? "Archetype"} footprint applies.`;
  }

  return "Select perspective and scene for narrative.";
}
