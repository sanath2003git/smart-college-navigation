export async function findRooms(roomNo) {
  const response = await fetch("/data/doors.geojson");

  const geojson = await response.json();

  return geojson.features.filter(
    (feature) =>
      feature.properties.room_no.toUpperCase() ===
      roomNo.toUpperCase()
  );
}