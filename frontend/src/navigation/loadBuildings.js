let buildings = null;

export async function loadBuildings() {
  if (buildings) {
    return buildings;
  }

  const response = await fetch("/data/buildings.geojson");

  buildings = await response.json();

  console.log(
    "Buildings Loaded:",
    buildings.features.length
  );

  return buildings;
}