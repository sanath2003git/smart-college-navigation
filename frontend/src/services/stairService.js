import { BUILDING_CONFIG } from "../config/buildingConfig";
import { getStairsPath } from "../utils/dataPaths";

let stairs = [];

// ======================================================
// LOAD STAIRS
// ======================================================

async function loadStairs() {
  if (stairs.length > 0) {
    return stairs;
  }

  const stairSources = [];

  // -----------------------------------
  // Build stair data sources dynamically
  // -----------------------------------

  for (const [building, buildingConfig] of Object.entries(
    BUILDING_CONFIG
  )) {
    const floors = Object.keys(buildingConfig.floors)
      .map(Number);

    for (const floor of floors) {
      stairSources.push({
        building,
        floor,
        path: getStairsPath(building, floor),
      });
    }
  }

  // -----------------------------------
  // Load all configured stair files
  // -----------------------------------

  const responses = await Promise.all(
    stairSources.map(async (source) => {
      const response = await fetch(source.path);

      if (!response.ok) {
        throw new Error(
          `Failed to load stair GeoJSON: ${source.path}`
        );
      }

      const data = await response.json();

      return {
        ...source,
        data,
      };
    })
  );

  // -----------------------------------
  // Merge all stair/lift features
  // -----------------------------------

  stairs = responses.flatMap(
    ({ data }) => data.features ?? []
  );

  // -----------------------------------
  // Debug information
  // -----------------------------------

  console.log(
    "========== STAIRS LOADED =========="
  );

  console.log(
    "Total Stair/Lift Features:",
    stairs.length
  );

  responses.forEach(({ building, floor, data }) => {
    console.log(
      `${building} - Floor ${floor}:`,
      data.features?.length ?? 0
    );
  });

  console.log(
    "==================================="
  );

  return stairs;
}

// ======================================================
// SEARCH STAIRS
// ======================================================

export async function findStairs(search) {
  const allStairs =
    await loadStairs();

  const query =
    search.trim().toUpperCase();

  return allStairs.filter((stair) => {
    const p = stair.properties;

    const id =
      p.id?.toUpperCase() ?? "";

    const name =
      p.name?.toUpperCase() ?? "";

    return (
      id === query ||
      name.includes(query)
    );
  });
}

// ======================================================
// FIND STAIR BY ID
// ======================================================

export async function findStairById(id) {
  if (!id) {
    console.error(
      "findStairById: stair ID missing."
    );

    return null;
  }

  const allStairs =
    await loadStairs();

  const stair =
    allStairs.find(
      (feature) =>
        feature.properties.id === id
    ) ?? null;

  if (!stair) {
    console.error(
      "Stair not found:",
      id
    );
  }

  return stair;
}