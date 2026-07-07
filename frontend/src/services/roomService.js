export async function findRoom(roomNo) {
  const response = await fetch("/data/doors.geojson");

  const geojson = await response.json();

  const room = geojson.features.find(
    (feature) =>
      feature.properties.room_no.toUpperCase() ===
      roomNo.toUpperCase()
  );

  return room || null;
}