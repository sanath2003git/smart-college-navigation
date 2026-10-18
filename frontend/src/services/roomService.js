import { BUILDING_CONFIG } from "../config/buildingConfig";
import { getRoomsPath, getFloorRoomsPath } from "../utils/dataPaths";

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

    const datasets = await Promise.all(
      floors.map(async (floor) => {
        try {
          const res = await fetch(getRoomsPath(building, floor));
          if (res.ok) {
            return await res.json();
          }
          const roomsRes = await fetch(getFloorRoomsPath(building, floor));
          if (roomsRes.ok) {
            return await roomsRes.json();
          }
          return { features: [] };
        } catch {
          return { features: [] };
        }
      })
    );

    roomCache[building] = datasets.flatMap(
      (data) => data.features ?? []
    );
  }

  const query = roomNo.trim().toUpperCase();

  return (roomCache[building] || []).filter(
    (feature) =>
      feature?.properties?.room_no &&
      String(feature.properties.room_no).trim().toUpperCase() === query
  );
}