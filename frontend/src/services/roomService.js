import { getRoomsPath } from "../utils/dataPaths";

const roomCache = {};

export async function findRooms(building, roomNo) {
  if (!roomCache[building]) {
    const [gfResponse, ffResponse] = await Promise.all([
      fetch(getRoomsPath(building, 0)),
      fetch(getRoomsPath(building, 1)),
    ]);

    const gfData = await gfResponse.json();
    const ffData = await ffResponse.json();

    roomCache[building] = [
      ...gfData.features,
      ...ffData.features,
    ];
  }

  const query = roomNo.trim().toUpperCase();

  return roomCache[building].filter(
    (feature) =>
      feature.properties.room_no.toUpperCase() === query
  );
}