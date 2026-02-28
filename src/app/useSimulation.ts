import { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "../store";
import { getEffectiveInputs } from "../model/effectiveInputs";
import { scenario } from "../data/scenario";
import { runOneIteration, percentile } from "../model/engine";

const DEFAULT_DEDUCTIBLE = 250000;
const DEFAULT_COVERAGE = 10000000;

function runSync(
  effective: Record<string, { min?: number; mode: number; max?: number }>,
  deductible: number,
  coverageLimit: number,
  iterations: number
) {
  const nets: number[] = [];
  const grosses: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const { gross, net } = runOneIteration(effective, deductible, coverageLimit);
    grosses.push(gross);
    nets.push(net);
  }
  grosses.sort((a, b) => a - b);
  nets.sort((a, b) => a - b);
  return {
    mean: nets.reduce((a, b) => a + b, 0) / nets.length,
    median: percentile(nets, 0.5),
    p50: percentile(nets, 0.5),
    p90: percentile(nets, 0.9),
    p95: percentile(nets, 0.95),
    grossP90: percentile(grosses, 0.9),
    netP90: percentile(nets, 0.9),
    topDriver: "P_WriteAccess",
    iterationCount: iterations,
    lossSamples: nets.slice(0, 1000),
  };
}

function useDebounce<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export function useSimulation() {
  const inputs = useStore((s) => s.inputs);
  const controls = useStore((s) => s.controls);
  const archetype = useStore((s) => s.archetype);
  const setSimulationResults = useStore((s) => s.setSimulationResults);
  const [isRunning, setIsRunning] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  const effective = getEffectiveInputs(inputs, controls, scenario.controls);
  const debouncedInputs = useDebounce(inputs, 500);
  const debouncedControls = useDebounce(controls, 500);

  const runSimulation = useCallback(
    (iterationCount: number, runSensitivity = false) => {
      const eff = getEffectiveInputs(
        iterationCount >= 5000 ? inputs : debouncedInputs,
        iterationCount >= 5000 ? controls : debouncedControls,
        scenario.controls
      );
      const deductible = archetype?.modeledInsurance?.deductible ?? DEFAULT_DEDUCTIBLE;
      const coverageLimit = archetype?.modeledInsurance?.coverageLimit ?? DEFAULT_COVERAGE;

      if (iterationCount <= 3000) {
        setIsRunning(true);
        try {
          const result = runSync(eff, deductible, coverageLimit, iterationCount);
          setSimulationResults(result);
        } finally {
          setIsRunning(false);
        }
        return;
      }

      if (workerRef.current) workerRef.current.terminate();
      const worker = new Worker(
        new URL("../worker/monteCarlo.worker.ts", import.meta.url),
        { type: "module" }
      );
      workerRef.current = worker;
      setIsRunning(true);
      worker.postMessage({
        effective: eff,
        deductible,
        coverageLimit,
        iterationCount,
        runSensitivity: runSensitivity || iterationCount >= 10000,
      });
      worker.onmessage = (e: MessageEvent) => {
        setSimulationResults(e.data);
        setIsRunning(false);
        worker.terminate();
        workerRef.current = null;
      };
      worker.onerror = () => {
        const result = runSync(eff, deductible, coverageLimit, Math.min(iterationCount, 5000));
        setSimulationResults(result);
        setIsRunning(false);
        workerRef.current = null;
      };
    },
    [inputs, controls, debouncedInputs, debouncedControls, archetype, setSimulationResults]
  );

  useEffect(() => {
    runSimulation(2000, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [archetype?.id, debouncedInputs, debouncedControls]);

  return { runSimulation, isRunning, effective };
}
