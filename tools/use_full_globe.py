from pathlib import Path

p = Path("src/app/ScenarioGlobe.tsx")
text = p.read_text()

text = text.replace(
    '''const ARCGIS_TERRAIN_URL =\n  "https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer";\n''',
    "",
    1,
)

text = text.replace("terrainState", "globeState")
text = text.replace("setTerrainState", "setGlobeState")
text = text.replace(
    '''  const [globeState, setGlobeState] = useState<\n    "loading" | "streaming" | "fallback" | "error"\n  >("loading");''',
    '''  const [globeState, setGlobeState] = useState<\n    "loading" | "global" | "error"\n  >("loading");''',
    1,
)

old_terrain = '''      let terrainProvider: any;\n      try {\n        terrainProvider =\n          await Cesium.ArcGISTiledElevationTerrainProvider.fromUrl(\n            ARCGIS_TERRAIN_URL\n          );\n        if (!disposed) setGlobeState("streaming");\n      } catch (error) {\n        console.warn(\n          "Cesium terrain unavailable; using ellipsoid fallback.",\n          error\n        );\n        terrainProvider = new Cesium.EllipsoidTerrainProvider();\n        if (!disposed) setGlobeState("fallback");\n      }\n'''
new_terrain = '''      // Impact stays at a global analytical camera distance, where streamed elevation\n      // adds little visual value but Web Mercator terrain leaves polar geometry gaps.\n      // Use complete WGS84 geometry instead, then layer imagery for detail.\n      const terrainProvider = new Cesium.EllipsoidTerrainProvider();\n'''
if old_terrain not in text:
    raise SystemExit("terrain provider block not found")
text = text.replace(old_terrain, new_terrain, 1)

old_underlay = '''      // ArcGIS elevation is Web Mercator-based and does not provide terrain mesh at the poles.\n      // Keep a slightly shrunken WGS84 ellipsoid beneath streamed terrain so missing terrain\n      // geometry reveals a closed globe instead of empty space.\n      const wgs84 = Cesium.Ellipsoid.WGS84.radii;\n      const terrainUnderlayRadii = new Cesium.Cartesian3(\n        wgs84.x - 1_500,\n        wgs84.y - 1_500,\n        wgs84.z - 1_500\n      );\n      const terrainUnderlay = new Cesium.Primitive({\n        geometryInstances: new Cesium.GeometryInstance({\n          geometry: new Cesium.EllipsoidGeometry({\n            radii: terrainUnderlayRadii,\n            vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,\n          }),\n          attributes: {\n            color: Cesium.ColorGeometryInstanceAttribute.fromColor(\n              Cesium.Color.fromCssColorString("#24343c")\n            ),\n          },\n        }),\n        appearance: new Cesium.PerInstanceColorAppearance({\n          flat: true,\n          translucent: false,\n          closed: true,\n        }),\n        asynchronous: false,\n        allowPicking: false,\n      });\n      viewer.scene.primitives.add(terrainUnderlay);\n\n'''
if old_underlay not in text:
    raise SystemExit("terrain underlay block not found")
text = text.replace(old_underlay, "", 1)

imagery_anchor = '''      try {\n        const imageryProvider =\n          await Cesium.ArcGisMapServerImageryProvider.fromUrl(\n            ARCGIS_IMAGERY_URL\n          );'''
fallback = '''      // Natural Earth II uses a geographic tiling scheme and covers the full globe.\n      // Keep it underneath ArcGIS imagery so only ArcGIS coverage gaps reveal it.\n      try {\n        const fallbackImagery = new Cesium.UrlTemplateImageryProvider({\n          url: `${Cesium.buildModuleUrl("Assets/Textures/NaturalEarthII")}/{z}/{x}/{reverseY}.jpg`,\n          tilingScheme: new Cesium.GeographicTilingScheme(),\n          maximumLevel: 5,\n        });\n        const fallbackLayer =\n          viewer.imageryLayers.addImageryProvider(fallbackImagery);\n        fallbackLayer.brightness = 0.7;\n        fallbackLayer.contrast = 1.04;\n        fallbackLayer.saturation = 0.68;\n      } catch (error) {\n        console.warn("Natural Earth fallback imagery could not be loaded.", error);\n      }\n\n      try {\n        const imageryProvider =\n          await Cesium.ArcGisMapServerImageryProvider.fromUrl(\n            ARCGIS_IMAGERY_URL\n          );'''
if imagery_anchor not in text:
    raise SystemExit("ArcGIS imagery anchor not found")
text = text.replace(imagery_anchor, fallback, 1)

ready_anchor = '''      clickHandlerRef.current = handler;\n\n      setReady(true);'''
ready_replacement = '''      clickHandlerRef.current = handler;\n\n      if (!disposed) setGlobeState("global");\n      setReady(true);'''
if ready_anchor not in text:
    raise SystemExit("ready anchor not found")
text = text.replace(ready_anchor, ready_replacement, 1)

old_badge = '''        {globeState === "streaming" && "Cesium terrain · streamed"}\n        {globeState === "loading" && "Cesium terrain · loading"}\n        {globeState === "fallback" && "Cesium terrain · fallback"}\n        {globeState === "error" && "Cesium · unavailable"}'''
new_badge = '''        {globeState === "global" && "Cesium globe · global"}\n        {globeState === "loading" && "Cesium globe · loading"}\n        {globeState === "error" && "Cesium · unavailable"}'''
if old_badge not in text:
    raise SystemExit("globe status badge block not found")
text = text.replace(old_badge, new_badge, 1)

p.write_text(text)
