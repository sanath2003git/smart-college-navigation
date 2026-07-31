let entrances = null;

async function loadEntrances() {
  if (entrances) return entrances;

  const response = await fetch("/data/campus/entrances.geojson");
  const data = await response.json();

  entrances = data.features;

  return entrances;
}

function distance(lat1, lng1, lat2, lng2) {
  return Math.sqrt(
    (lat2 - lat1) ** 2 +
    (lng2 - lng1) ** 2
  );
}

export async function findNearestEntrance(
  building,
  currentLat,
  currentLng
) {
  const allEntrances = await loadEntrances();

  const buildingEntrances = allEntrances.filter(
    (entrance) =>
      entrance.properties.building === building
  );

  if (buildingEntrances.length === 0) {
    return null;
  }

  let nearest = null;
  let shortestDistance = Infinity;

  for (const entrance of buildingEntrances) {
    const [lng, lat] = entrance.geometry.coordinates;

    const d = distance(
      currentLat,
      currentLng,
      lat,
      lng
    );

    if (d < shortestDistance) {
      shortestDistance = d;
      nearest = entrance;
    }
  }

  return nearest;
}