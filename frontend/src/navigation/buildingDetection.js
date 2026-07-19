import { point, booleanPointInPolygon } from "@turf/turf";

export function detectCurrentBuilding(location, buildings) {
  if (!location || !buildings) {
    return null;
  }

  const userPoint = point([
    location.lng,
    location.lat,
  ]);

  for (const building of buildings.features) {
    if (booleanPointInPolygon(userPoint, building)) {
      return building;
    }
  }

  return null;
}