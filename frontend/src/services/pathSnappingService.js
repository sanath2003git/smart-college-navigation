import {
  point,
  nearestPointOnLine,
  distance,
} from "@turf/turf";

const WALKWAYS_URL = "/data/campus/walkways.geojson";

let walkwaysCache = null;

/**
 * Load campus walkways.
 */
async function loadWalkways() {
  if (walkwaysCache) {
    return walkwaysCache;
  }

  const response = await fetch(WALKWAYS_URL);

  if (!response.ok) {
    throw new Error("Failed to load campus walkways.");
  }

  walkwaysCache = await response.json();

  return walkwaysCache;
}

/**
 * Find the nearest point on any campus walkway.
 *
 * Returns:
 * {
 *   lat,
 *   lng,
 *   distance,
 *   walkway
 * }
 */
export async function findNearestWalkway(lat, lng) {
  const walkways = await loadWalkways();

  const userPoint = point([lng, lat]);

  let nearestResult = null;

  for (const walkway of walkways.features) {
    if (
      !walkway.geometry ||
      walkway.geometry.type !== "LineString"
    ) {
      continue;
    }

    const snappedPoint = nearestPointOnLine(
      walkway,
      userPoint
    );

    const distanceToWalkway = distance(
      userPoint,
      snappedPoint,
      {
        units: "meters",
      }
    );

    if (
      !nearestResult ||
      distanceToWalkway < nearestResult.distance
    ) {
      const [snappedLng, snappedLat] =
        snappedPoint.geometry.coordinates;

      nearestResult = {
        lat: snappedLat,
        lng: snappedLng,
        distance: distanceToWalkway,
        walkway: walkway.properties,
      };
    }
  }

  return nearestResult;
}

/**
 * Snap a location to a campus walkway only when
 * the user is sufficiently close to that walkway.
 */
export async function snapToWalkway(
  lat,
  lng,
  maxDistance = 6
) {
  const nearestWalkway =
    await findNearestWalkway(lat, lng);

  if (!nearestWalkway) {
    return null;
  }

  if (nearestWalkway.distance > maxDistance) {
    return null;
  }

  return nearestWalkway;
}