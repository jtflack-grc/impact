import scenarioData from "./scenario-ifs.json";
import type { ControlDef } from "../store/types";

export const scenario = scenarioData as {
  id: string;
  title: string;
  scenes: Array<{ id: string; label: string; order: number }>;
  variables: Array<{ id: string; label: string; distribution: string }>;
  controls: ControlDef[];
  narrativeKeys: Record<string, string>;
};
