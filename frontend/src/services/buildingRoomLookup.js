const ROOM_PREFIX = {
  H: "Chemical Block",
  M: "Mechanical Block",
};

export function getBuildingFromRoom(roomNo) {
  const prefix = roomNo.trim().toUpperCase()[0];

  return ROOM_PREFIX[prefix] ?? null;
}