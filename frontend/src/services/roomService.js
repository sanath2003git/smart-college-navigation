let rooms = [];

export async function findRooms(roomNo) {
  if (rooms.length === 0) {
    const [gfResponse, ffResponse] = await Promise.all([
      fetch("/data/doors.geojson"),
      fetch("/data/doors_ff.geojson"),
    ]);

    const gfData = await gfResponse.json();
    const ffData = await ffResponse.json();

    rooms = [
      ...gfData.features,
      ...ffData.features,
    ];
  }

  const query = roomNo.trim().toUpperCase();

  return rooms.filter(
    (feature) =>
      feature.properties.room_no.toUpperCase() === query
  );
}