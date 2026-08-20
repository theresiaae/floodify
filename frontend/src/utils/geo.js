/**
 * Ray-casting point-in-polygon test.
 * @param {number} lat
 * @param {number} lng
 * @param {Array<[number, number]>} polygon - array of [lat, lng] pairs
 * @returns {boolean}
 */
export function isPointInPolygon(lat, lng, polygon) {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [latI, lngI] = polygon[i]
    const [latJ, lngJ] = polygon[j]
    const intersects =
      lngI > lng !== lngJ > lng &&
      lat < ((latJ - latI) * (lng - lngI)) / (lngJ - lngI) + latI
    if (intersects) inside = !inside
  }
  return inside
}

/**
 * Big rectangle enclosing all of Indonesia, used as the outer ring
 * of the "mask" polygon so everything outside Denpasar is dimmed.
 */
export const WORLD_RING = [
  [-30, 70],
  [-30, 160],
  [15, 160],
  [15, 70],
]
