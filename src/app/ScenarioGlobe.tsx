import { useEffect, useMemo, useRef, useState } from "react";
import Globe from "react-globe.gl";
import { Canvas } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import {
  Color,
  MeshPhongMaterial,
  NoColorSpace,
  SRGBColorSpace,
  TextureLoader,
} from "three";
import { useScenarioStore } from "../store/scenarioStore";

interface CountryFeature {
  type: "Feature";
  properties: { name: string };
  geometry: {
    type: string;
    coordinates: unknown;
  };
}

const WORLD_GEOJSON_URL =
  "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson";

const EARTH_IMAGE_URL =
  "https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg";
const EARTH_TOPOLOGY_URL =
  "https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png";
const EARTH_WATER_URL =
  "https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-water.png";

const COUNTRY_ALIASES: Record<string, string[]> = {
  US: ["United States of America", "United States", "USA"],
  GB: ["United Kingdom", "UK", "United Kingdom of Great Britain and Northern Ireland"],
};

function isScenarioCountry(feature: CountryFeature, code: string, canonicalName: string): boolean {
  const name = feature.properties.name;
  const aliases = COUNTRY_ALIASES[code] ?? [canonicalName];
  return aliases.some(
    (alias) => alias === name || name.includes(alias) || alias.includes(name)
  );
}

export function ScenarioGlobe() {
  const scenario = useScenarioStore((s) => s.scenarios[s.currentScenarioIndex]);
  const [countries, setCountries] = useState<CountryFeature[]>([]);
  const globeRef = useRef<ReturnType<typeof Globe> | null>(null);
  const [showPopup, setShowPopup] = useState(true);

  const terrainMaterial = useMemo(() => {
    const loader = new TextureLoader();
    const earthTexture = loader.load(EARTH_IMAGE_URL);
    earthTexture.colorSpace = SRGBColorSpace;

    const elevationTexture = loader.load(EARTH_TOPOLOGY_URL);
    elevationTexture.colorSpace = NoColorSpace;

    const waterTexture = loader.load(EARTH_WATER_URL);
    waterTexture.colorSpace = NoColorSpace;

    return new MeshPhongMaterial({
      map: earthTexture,
      bumpMap: elevationTexture,
      bumpScale: 1.15,
      displacementMap: elevationTexture,
      // Deliberately exaggerated so relief remains legible in the narrow game rail.
      // The underlying elevation pattern is real topography; this is not a to-scale Earth model.
      displacementScale: 1.35,
      specularMap: waterTexture,
      specular: new Color(0x3f6480),
      shininess: 10,
    });
  }, []);

  useEffect(() => {
    return () => {
      terrainMaterial.map?.dispose();
      terrainMaterial.bumpMap?.dispose();
      terrainMaterial.displacementMap?.dispose();
      terrainMaterial.specularMap?.dispose();
      terrainMaterial.dispose();
    };
  }, [terrainMaterial]);

  const canonicalName = useMemo(
    () => scenario.countryName,
    [scenario.countryName]
  );

  const hqPoint = useMemo(
    () => [{ lat: scenario.latitude, lng: scenario.longitude, label: scenario.company.name }],
    [scenario.latitude, scenario.longitude, scenario.company.name]
  );

  const hqRing = useMemo(
    () => [{ lat: scenario.latitude, lng: scenario.longitude, maxRadius: 2, propagationSpeed: 0.5 }],
    [scenario.latitude, scenario.longitude]
  );

  useEffect(() => {
    let cancelled = false;
    if (countries.length === 0) {
      fetch(WORLD_GEOJSON_URL)
        .then((r) => r.json())
        .then((geo) => {
          if (!cancelled) {
            setCountries(geo.features as CountryFeature[]);
          }
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [countries.length]);

  const focusScenario = () => {
    const globe = globeRef.current as unknown as {
      pointOfView: (
        pos: { lat: number; lng: number; altitude: number },
        ms?: number
      ) => void;
    } | null;
    if (!globe?.pointOfView) return;
    globe.pointOfView(
      {
        lat: scenario.latitude,
        lng: scenario.longitude,
        altitude: 1.55,
      },
      1000
    );
  };

  useEffect(() => {
    focusScenario();
  }, [scenario.latitude, scenario.longitude]);

  return (
    <div className="relative w-full h-full bg-black">
      {/* Twinkling starfield background. Kept intentionally lighter to leave GPU headroom for terrain. */}
      <div className="absolute inset-0 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 1], fov: 75 }}>
          <color attach="background" args={["#020617"]} />
          <Stars
            radius={300}
            depth={150}
            count={3500}
            factor={7}
            saturation={0}
            fade
            speed={0.35}
          />
        </Canvas>
      </div>

      {/* Terrain globe overlay */}
      <div className="relative z-10 w-full h-full">
        <Globe
          ref={globeRef as any}
          width={undefined}
          height={undefined}
          backgroundColor="rgba(2,6,23,0)"
          rendererConfig={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          globeMaterial={terrainMaterial}
          globeCurvatureResolution={0.75}
          onGlobeReady={focusScenario}
          polygonsData={countries}
          polygonAltitude={(d: object) =>
            isScenarioCountry(d as CountryFeature, scenario.countryCode, canonicalName) ? 0.032 : 0.019
          }
          polygonCapColor={(d: object) =>
            isScenarioCountry(d as CountryFeature, scenario.countryCode, canonicalName)
              ? "rgba(239,68,68,0.50)"
              : "rgba(15,23,42,0.035)"
          }
          polygonSideColor={() => "rgba(15,23,42,0.12)"}
          polygonStrokeColor={(d: object) =>
            isScenarioCountry(d as CountryFeature, scenario.countryCode, canonicalName)
              ? "rgba(248,113,113,0.95)"
              : "rgba(203,213,225,0.22)"
          }
          atmosphereColor="rgb(125,211,252)"
          atmosphereAltitude={0.13}
          showAtmosphere
          onPolygonClick={(d: object) => {
            if (isScenarioCountry(d as CountryFeature, scenario.countryCode, canonicalName)) {
              setShowPopup((prev) => !prev);
            }
          }}
          hexPolygonsData={undefined}
          pointsData={hqPoint}
          pointLat="lat"
          pointLng="lng"
          pointLabel="label"
          pointColor={() => "rgba(96,165,250,1)"}
          pointAltitude={0.065}
          pointRadius={0.42}
          pointResolution={16}
          ringsData={hqRing}
          ringLat="lat"
          ringLng="lng"
          ringMaxRadius="maxRadius"
          ringPropagationSpeed="propagationSpeed"
          ringColor={() => "rgba(125,211,252,0.7)"}
          ringAltitude={0.055}
        />
      </div>

      {showPopup && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-lg w-[90%] rounded-2xl bg-gradient-to-b from-black/95 to-[#020617]/95 border-2 border-war-border/80 px-6 py-5 backdrop-blur-xl shadow-2xl z-20">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4 pb-4 border-b border-war-border/50">
            <div className="flex-1">
              <div className="text-[10px] tracking-[0.2em] uppercase text-emerald-400 mb-1 font-semibold">
                {scenario.countryName}
              </div>
              <div className="text-xl font-bold text-war-white mb-1">
                {scenario.company.name}
              </div>
              <p className="text-xs text-war-muted">{scenario.company.sector}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowPopup(false)}
              className="text-war-muted hover:text-war-white transition-colors p-1"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Company Overview */}
          <div className="space-y-4 text-xs">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-war-muted mb-2">Company Overview</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-war-muted text-[10px] mb-0.5">Headquarters</div>
                  <div className="text-war-white font-medium">{scenario.company.headquarters}</div>
                </div>
                <div>
                  <div className="text-war-muted text-[10px] mb-0.5">Employees</div>
                  <div className="text-war-white font-medium">{scenario.company.employeeCount.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-war-muted text-[10px] mb-0.5">Founded</div>
                  <div className="text-war-white font-medium">{scenario.company.foundedYear}</div>
                </div>
                <div>
                  <div className="text-war-muted text-[10px] mb-0.5">Sector</div>
                  <div className="text-war-white font-medium">{scenario.company.sector}</div>
                </div>
              </div>
            </div>

            {/* 10K Financials */}
            <div className="pt-3 border-t border-war-border/30">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-war-muted mb-3">Financial Summary (10-K Style)</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-black/40 p-2 border border-war-border/30">
                    <div className="text-war-muted text-[10px] mb-1">Annual Revenue</div>
                    <div className="text-lg font-bold text-war-white">${scenario.company.annualRevenueMillions.toLocaleString()}M</div>
                  </div>
                  <div className="rounded-lg bg-black/40 p-2 border border-war-border/30">
                    <div className="text-war-muted text-[10px] mb-1">EBITDA Margin</div>
                    <div className="text-lg font-bold text-emerald-400">{scenario.company.ebitdaMarginPercent}%</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <div>
                    <div className="text-war-muted mb-0.5">EBITDA</div>
                    <div className="text-war-white font-semibold">
                      ${(scenario.company.annualRevenueMillions * scenario.company.ebitdaMarginPercent / 100).toFixed(0)}M
                    </div>
                  </div>
                  <div>
                    <div className="text-war-muted mb-0.5">Revenue/Employee</div>
                    <div className="text-war-white font-semibold">
                      ${(scenario.company.annualRevenueMillions * 1000000 / scenario.company.employeeCount).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-war-muted mb-0.5">Est. Market Cap</div>
                    <div className="text-war-white font-semibold">
                      ${(scenario.company.annualRevenueMillions * 2.3).toFixed(0)}M
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Infrastructure & History */}
            <div className="pt-3 border-t border-war-border/30 space-y-2">
              <div>
                <div className="text-war-muted text-[10px] mb-1 font-semibold uppercase tracking-wide">Infrastructure</div>
                <div className="text-war-white/90 leading-relaxed">{scenario.company.infrastructure}</div>
              </div>
              <div>
                <div className="text-war-muted text-[10px] mb-1 font-semibold uppercase tracking-wide">Company History</div>
                <div className="text-war-white/90 leading-relaxed">{scenario.company.history}</div>
              </div>
            </div>

            {/* Risk Context — FAIR (red) and FMVA (green) rigor blurbs */}
            <div className="pt-3 border-t border-war-border/30 space-y-3">
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3">
                <div className="text-[10px] text-red-400 font-semibold uppercase tracking-wide mb-1">Current Risk Exposure (FAIR)</div>
                <div className="text-sm font-bold text-war-white">
                  Gross P90: ${scenario.lossProfile.grossP90Millions.toFixed(0)}M · Net P90: ${scenario.lossProfile.netP90Millions.toFixed(0)}M
                </div>
                <div className="text-[10px] text-war-muted mt-1">
                  {scenario.lossProfile.topDriver}. LEF {scenario.lossProfile.frequencyPerYear.toFixed(2)}/yr; EAL ${(scenario.lossProfile.meanLossMillions * scenario.lossProfile.frequencyPerYear).toFixed(1)}M.
                </div>
              </div>
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3">
                <div className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wide mb-1">Financial Impact (FMVA)</div>
                <div className="text-sm font-bold text-war-white">
                  One P90 loss = {scenario.company.annualRevenueMillions * (scenario.company.ebitdaMarginPercent / 100) > 0
                    ? Math.round((scenario.lossProfile.grossP90Millions / (scenario.company.annualRevenueMillions * (scenario.company.ebitdaMarginPercent / 100))) * 100)
                    : "—"}% of annual EBITDA
                </div>
                <div className="text-[10px] text-war-muted mt-1">
                  P90 as % EBITDA — standard FMVA bridge from FAIR loss magnitude to operating profit impact.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
