import { BUILDING_CONFIG } from "../config/buildingConfig";
import { getRoomsPath } from "../utils/dataPaths";

const roomCache = {};

export async function findRooms(building, roomNo) {
  // Defensive check
  if (!BUILDING_CONFIG[building]) {
    console.warn(`Unknown building: ${building}`);
    return [];
  }

  if (!roomCache[building]) {
    const floors = Object.keys(BUILDING_CONFIG[building].floors)
      .map(Number);

    const responses = await Promise.all(
      floors.map((floor) =>
        fetch(getRoomsPath(building, floor))
      )
    );

    const datasets = await Promise.all(
      responses.map((response) => response.json())
    );

    roomCache[building] = datasets.flatMap(
      (data) => data.features
    );
  }

  const query = roomNo.trim().toUpperCase();

  return roomCache[building].filter(
    (feature) =>
      feature.properties.room_no.toUpperCase() === query
  );
}