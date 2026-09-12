from pathlib import Path

p = Path("src/app/ScenarioGlobe.tsx")
text = p.read_text()

old = '''      // ArcGIS World Imagery uses Web Mercator and stops short of the poles.\n      // A small neutral cap closes that projection gap without replacing streamed terrain.\n      const polarCaps = new Cesium.CustomDataSource("impact-polar-caps");\n      const polarCapMaterial = Cesium.Color.fromCssColorString("#7f9097").withAlpha(0.94);\n      const polarCapRadius = 575_000;\n      for (const latitude of [89.999, -89.999]) {\n        polarCaps.entities.add({\n          position: Cesium.Cartesian3.fromDegrees(0, latitude),\n          ellipse: {\n            semiMajorAxis: polarCapRadius,\n            semiMinorAxis: polarCapRadius,\n            material: polarCapMaterial,\n            height: 4_000,\n          },\n        });\n      }\n      viewer.dataSources.add(polarCaps);\n'''

new = '''      // ArcGIS elevation is Web Mercator-based and does not provide terrain mesh at the poles.\n      // Keep a slightly shrunken WGS84 ellipsoid beneath streamed terrain so missing terrain\n      // geometry reveals a closed globe instead of empty space.\n      const wgs84 = Cesium.Ellipsoid.WGS84.radii;\n      const terrainUnderlayRadii = new Cesium.Cartesian3(\n        wgs84.x - 1_500,\n        wgs84.y - 1_500,\n        wgs84.z - 1_500\n      );\n      const terrainUnderlay = new Cesium.Primitive({\n        geometryInstances: new Cesium.GeometryInstance({\n          geometry: new Cesium.EllipsoidGeometry({\n            radii: terrainUnderlayRadii,\n            vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,\n          }),\n          attributes: {\n            color: Cesium.ColorGeometryInstanceAttribute.fromColor(\n              Cesium.Color.fromCssColorString("#24343c")\n            ),\n          },\n        }),\n        appearance: new Cesium.PerInstanceColorAppearance({\n          flat: true,\n          translucent: false,\n          closed: true,\n        }),\n        asynchronous: false,\n        allowPicking: false,\n      });\n      viewer.scene.primitives.add(terrainUnderlay);\n'''

if old not in text:
    raise SystemExit("polar-cap block not found")

p.write_text(text.replace(old, new, 1))
