/**
 * Convert WGS84 (lon, lat) to 3D position on unit sphere (Y-up).
 * lon, lat in degrees; result suitable for Three.js.
 */
export function lonLatToPosition(lon: number, lat: number, radius = 1): [number, number, number] {
  const rad = Math.PI / 180;
  const phi = (90 - lat) * rad;
  const theta = lon * rad;
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return [x, y, z];
}

/** North America view: camera position and target (for lookAt) on unit sphere. */
export const NA_CENTER_LON = -95;
export const NA_CENTER_LAT = 40;
export const CAMERA_DISTANCE = 2.4;

export function getNorthAmericaCamera(): { position: [number, number, number]; target: [number, number, number] } {
  const [dx, dy, dz] = lonLatToPosition(NA_CENTER_LON, NA_CENTER_LAT, 1);
  const position: [number, number, number] = [
    dx * CAMERA_DISTANCE,
    dy * CAMERA_DISTANCE,
    dz * CAMERA_DISTANCE,
  ];
  return { position, target: [0, 0, 0] };
}
