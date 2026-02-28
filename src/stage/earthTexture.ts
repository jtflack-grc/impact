/**
 * Generate a realistic-style Earth equirectangular texture (canvas).
 * Ocean + land with simple noise-based continents. No external assets.
 */
import * as THREE from "three";

const W = 2048;
const H = 1024;

// Equirectangular: u = lon, v = lat (0 at top = north pole)

// Simple 2D hash for deterministic noise
function hash2(p: [number, number]): number {
  const n = Math.sin(p[0] * 12.9898 + p[1] * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

function smoothNoise(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const aa = hash2([xi, yi]);
  const ab = hash2([xi, yi + 1]);
  const ba = hash2([xi + 1, yi]);
  const bb = hash2([xi + 1, yi + 1]);
  return (aa * (1 - u) + ba * u) * (1 - v) + (ab * (1 - u) + bb * u) * v;
}

function fbm(x: number, y: number, octaves: number): number {
  let v = 0;
  let f = 1;
  let a = 1;
  let sumA = 0;
  for (let i = 0; i < octaves; i++) {
    v += a * smoothNoise(x * f, y * f);
    sumA += a;
    a *= 0.5;
    f *= 2;
  }
  return v / sumA;
}

export function createEarthTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const imageData = ctx.createImageData(W, H);
  const data = imageData.data;

  const oceanDark = { r: 18, g: 48, b: 88 };
  const oceanMid = { r: 28, g: 72, b: 132 };
  const landGreen = { r: 52, g: 98, b: 58 };
  const landBrown = { r: 82, g: 70, b: 55 };

  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      const u = px / W;
      const v = py / H;
      const lon = u * 2 * Math.PI - Math.PI;
      const lat = Math.PI * 0.5 - v * Math.PI;
      const x = (lon / (2 * Math.PI) + 0.5) * 6;
      const y = (lat / Math.PI + 0.5) * 3;
      const n = fbm(x, y, 6);
      const n2 = fbm(x * 1.2 + 7, y * 1.2, 4);
      const isLand = n > 0.5 + 0.06 * Math.sin(lat * 2) + 0.02 * Math.sin(lon * 2);
      const i = (py * W + px) * 4;
      if (isLand) {
        const t = n2 * 0.5 + 0.5;
        data[i] = landGreen.r * (1 - t) + landBrown.r * t;
        data[i + 1] = landGreen.g * (1 - t) + landBrown.g * t;
        data[i + 2] = landGreen.b * (1 - t) + landBrown.b * t;
      } else {
        const t = Math.sin(lat) * 0.5 + 0.5;
        data[i] = oceanDark.r * (1 - t) + oceanMid.r * t;
        data[i + 1] = oceanDark.g * (1 - t) + oceanMid.g * t;
        data[i + 2] = oceanDark.b * (1 - t) + oceanMid.b * t;
      }
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
