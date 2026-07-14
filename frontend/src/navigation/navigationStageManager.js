import { NAVIGATION_STAGE } from "../constants/navigationStages";

function distanceInMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function shouldEnterBuilding(
  currentLocation,
  entranceLocation,
  threshold = 5
) {
  const distance = distanceInMeters(
    currentLocation.lat,
    currentLocation.lng,
    entranceLocation.lat,
    entranceLocation.lng
  );

  return distance <= threshold;
}

export function getNextStage(currentFloor) {
  if (currentFloor === 0) {
    return NAVIGATION_STAGE.GROUND_FLOOR;
  }

  if (currentFloor === 1) {
    return NAVIGATION_STAGE.FIRST_FLOOR;
  }

  return NAVIGATION_STAGE.OUTDOOR;
}