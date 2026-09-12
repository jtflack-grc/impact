import { useEffect, useRef, useState } from "react";
import { useScenarioStore } from "../store/scenarioStore";

declare global {
  interface Window {
    Cesium: any;
    CESIUM_BASE_URL?: string;
  }
}

const WORLD_GEOJSON_URL =
  "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson";
const ARCGIS_TERRAIN_URL =
  "https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer";
const ARCGIS_IMAGERY_URL =
  "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer";

const COUNTRY_ALIASES: Record<string, string[]> = {
  US: ["United States of America", "United States", "USA"],
  GB: ["United Kingdom", "UK", "United Kingdom of Great Britain and Northern Ireland"],
};

function isScenarioCountryName(name: string, code: string, canonicalName: string): boolean {
  const aliases = COUNTRY_ALIASES[code] ?? [canonicalName];
  return aliases.some(
    (alias) => alias === name || name.includes(alias) || alias.includes(name)
  );
}

function getEntityCountryName(entity: any): string {
  const property = entity?.properties?.name;
  const value = property?.getValue ? property.getValue() : property;
  return String(value ?? entity?.name ?? "");
}

export function ScenarioGlobe() {
  const scenario = useScenarioStore((s) => s.scenarios[s.currentScenarioIndex]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<any>(null);
  const countrySourceRef = useRef<any>(null);
  const clickHandlerRef = useRef<any>(null);
  const [showPopup, setShowPopup] = useState(true);
  const [ready, setReady] = useState(false);
  const [terrainState, setTerrainState] = useState<"loading" | "streaming" | "fallback" | "error">("loading");

  useEffect(() => {
    let disposed = false;
    let viewer: any = null;

    const initialize = async () => {
      const Cesium = window.Cesium;
      if (!Cesium || !containerRef.current) {
        setTerrainState("error");
        return;
      }

      let terrainProvider: any;
      try {
        terrainProvider = await Cesium.ArcGISTiledElevationTerrainProvider.fromUrl(
          ARCGIS_TERRAIN_URL
        );
        if (!disposed) setTerrainState("streaming");
      } catch (error) {
        console.warn("Cesium terrain unavailable; using ellipsoid fallback.", error);
        terrainProvider = new Cesium.EllipsoidTerrainProvider();
        if (!disposed) setTerrainState("fallback");
      }

      if (disposed || !containerRef.current) return;

      viewer = new Cesium.Viewer(containerRef.current, {
        animation: false,
        baseLayer: false,
        baseLayerPicker: false,
        fullscreenButton: false,
        geocoder: false,
        homeButton: false,
        infoBox: false,
        navigationHelpButton: false,
        sceneModePicker: false,
        selectionIndicator: false,
        timeline: false,
        terrainProvider,
      });
      viewerRef.current = viewer;

      viewer.scene.globe.enableLighting = true;
      viewer.scene.globe.depthTestAgainstTerrain = true;
      viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString("#07111b");
      viewer.scene.highDynamicRange = true;
      viewer.scene.screenSpaceCameraController.minimumZoomDistance = 100;
      viewer.scene.screenSpaceCameraController.maximumZoomDistance = 30_000_000;
      viewer.resolutionScale = Math.min(window.devicePixelRatio || 1, 1.5);

      try {
        const imageryProvider = await Cesium.ArcGisMapServerImageryProvider.fromUrl(
          ARCGIS_IMAGERY_URL
        );
        if (!disposed && viewer && !viewer.isDestroyed()) {
          const layer = viewer.imageryLayers.addImageryProvider(imageryProvider);
          layer.brightness = 0.78;
          layer.contrast = 1.08;
          layer.saturation = 0.78;
        }
      } catch (error) {
        console.warn("ArcGIS World Imagery could not be loaded.", error);
      }

      try {
        const countries = await Cesium.GeoJsonDataSource.load(WORLD_GEOJSON_URL, {
          clampToGround: true,
        });
        if (!disposed && viewer && !viewer.isDestroyed()) {
          viewer.dataSources.add(countries);
          countrySourceRef.current = countries;
        }
      } catch (error) {
        console.warn("Country overlay could not be loaded.", error);
      }

      if (disposed || !viewer || viewer.isDestroyed()) return;

      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      handler.setInputAction((movement: any) => {
        const picked = viewer.scene.pick(movement.position);
        const entity = picked?.id;
        if (entity?.__impactScenarioCountry || entity?.__impactHq) {
          setShowPopup((previous) => !previous);
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
      clickHandlerRef.current = handler;

      setReady(true);
    };

    void initialize();

    return () => {
      disposed = true;
      if (clickHandlerRef.current && !clickHandlerRef.current.isDestroyed()) {
        clickHandlerRef.current.destroy();
      }
      clickHandlerRef.current = null;
      countrySourceRef.current = null;
      viewerRef.current = null;
      if (viewer && !viewer.isDestroyed()) viewer.destroy();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;

    const Cesium = window.Cesium;
    const viewer = viewerRef.current;
    if (!Cesium || !viewer || viewer.isDestroyed()) return;

    setShowPopup(true);
    viewer.entities.removeAll();

    const hq = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(
        scenario.longitude,
        scenario.latitude,
        1200
      ),
      point: {
        pixelSize: 11,
        color: Cesium.Color.fromCssColorString("#7dd3fc"),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        text: scenario.company.name,
        font: "600 13px IBM Plex Sans, sans-serif",
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 4,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -24),
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      ellipse: {
        semiMajorAxis: 32_000,
        semiMinorAxis: 32_000,
        material: Cesium.Color.fromCssColorString("#38bdf8").withAlpha(0.16),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString("#7dd3fc").withAlpha(0.8),
        height: 0,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
    });
    hq.__impactHq = true;

    const countrySource = countrySourceRef.current;
    if (countrySource) {
      for (const entity of countrySource.entities.values) {
        const name = getEntityCountryName(entity);
        const selected = isScenarioCountryName(
          name,
          scenario.countryCode,
          scenario.countryName
        );
        entity.__impactScenarioCountry = selected;
        if (entity.polygon) {
          entity.polygon.material = selected
            ? Cesium.Color.fromCssColorString("#ef4444").withAlpha(0.22)
            : Cesium.Color.TRANSPARENT;
          entity.polygon.outline = selected;
          entity.polygon.outlineColor = selected
            ? Cesium.Color.fromCssColorString("#fca5a5")
            : Cesium.Color.TRANSPARENT;
        }
      }
    }

    // Keep the active hemisphere centered, but let Earth dominate the visual rail.
    // About 10,500 km gives the globe the near-full-frame presence of the target
    // composition without returning to the cropped regional flyover look.
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        scenario.longitude,
        scenario.latitude,
        10_500_000
      ),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-90),
        roll: 0,
      },
      duration: 1.6,
    });
  }, [
    ready,
    scenario.countryCode,
    scenario.countryName,
    scenario.latitude,
    scenario.longitude,
    scenario.company.name,
  ]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      <div ref={containerRef} className="absolute inset-0" />

      <div className="absolute right-3 top-3 z-10 rounded border border-white/15 bg-black/65 px-2 py-1 text-[9px] uppercase tracking-[0.16em] text-slate-300 backdrop-blur">
        {terrainState === "streaming" && "Cesium terrain · streamed"}
        {terrainState === "loading" && "Cesium terrain · loading"}
        {terrainState === "fallback" && "Cesium terrain · fallback"}
        {terrainState === "error" && "Cesium · unavailable"}
      </div>

      {showPopup && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-lg w-[90%] rounded-2xl bg-gradient-to-b from-black/95 to-[#020617]/95 border-2 border-war-border/80 px-6 py-5 backdrop-blur-xl shadow-2xl z-20">
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
