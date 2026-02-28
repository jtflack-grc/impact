export type ScenarioMetricKey =
  | "controlAdoption"
  | "incidentRate"
  | "successIndex"
  | "welfareDebt"
  | "systemReversibility"
  | "debtIndex";

export interface ScenarioMetrics {
  controlAdoption: number;
  incidentRate: number;
  successIndex: number;
  welfareDebt: number;
  systemReversibility: number;
  debtIndex: number;
}

export type ScenarioSeverity = "low" | "medium" | "high";

export interface ScenarioResource {
  id: string;
  label: string;
  url: string;
}

export interface ScenarioCompany {
  name: string;
  sector: string;
  description: string;
  annualRevenueMillions: number;
  ebitdaMarginPercent: number;
  region: string;
  headquarters: string;
  employeeCount: number;
  foundedYear: number;
  infrastructure: string;
  history: string;
}

export interface ScenarioLossProfile {
  grossP90Millions: number;
  netP90Millions: number;
  meanLossMillions: number;
  frequencyPerYear: number;
  topDriver: string;
}

export interface ScenarioChoice {
  id: string;
  label: string;
  summary?: string;
  metricDeltas?: Partial<ScenarioMetrics>;
}

export interface ScenarioStep {
  id: string;
  title: string;
  /** Array of messages that BreachGuard LLM will type out sequentially */
  messages: string[];
  prompt?: string;
  choices?: ScenarioChoice[];
}

export interface SecurityScenario {
  id: string;
  index: number;
  title: string;
  shortTitle: string;
  category: string;
  severity: ScenarioSeverity;
  /** ISO 3166-1 alpha-2 code, e.g. US, GB, DE */
  countryCode: string;
  countryName: string;
  /** Center point for the globe marker. */
  latitude: number;
  longitude: number;
  company: ScenarioCompany;
  lossProfile: ScenarioLossProfile;
  metrics: ScenarioMetrics;
  steps: ScenarioStep[];
  resources?: ScenarioResource[];
  /** Optional one-liner for FAIR learning focus in this scenario */
  fairFocus?: string;
}

