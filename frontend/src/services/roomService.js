let rooms = [];

export async function findRooms(roomNo) {
  if (rooms.length === 0) {
    const [gfResponse, ffResponse] = await Promise.all([
      fetch("/data/chemical/ground_floor/doors.geojson"),
      fetch("/data/chemical/first_floor/doors.geojson"),
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