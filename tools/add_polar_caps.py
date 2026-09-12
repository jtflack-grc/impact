from pathlib import Path

p = Path("src/app/ScenarioGlobe.tsx")
text = p.read_text()

anchor = '''      viewer.resolutionScale = Math.min(window.devicePixelRatio || 1, 1.5);\n\n      try {'''
replacement = '''      viewer.resolutionScale = Math.min(window.devicePixelRatio || 1, 1.5);\n\n      // ArcGIS World Imagery uses Web Mercator and stops short of the poles.\n      // A small neutral cap closes that projection gap without replacing streamed terrain.\n      const polarCaps = new Cesium.CustomDataSource("impact-polar-caps");\n      const polarCapMaterial = Cesium.Color.fromCssColorString("#7f9097").withAlpha(0.94);\n      const polarCapRadius = 575_000;\n      for (const latitude of [89.999, -89.999]) {\n        polarCaps.entities.add({\n          position: Cesium.Cartesian3.fromDegrees(0, latitude),\n          ellipse: {\n            semiMajorAxis: polarCapRadius,\n            semiMinorAxis: polarCapRadius,\n            material: polarCapMaterial,\n            height: 4_000,\n          },\n        });\n      }\n      viewer.dataSources.add(polarCaps);\n\n      try {'''

if anchor not in text:
    raise SystemExit("ScenarioGlobe polar-cap insertion anchor not found")

p.write_text(text.replace(anchor, replacement, 1))
