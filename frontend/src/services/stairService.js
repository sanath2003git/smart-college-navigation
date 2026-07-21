let stairs = [];

async function loadStairs() {
  if (stairs.length === 0) {
    const [gfResponse, ffResponse] = await Promise.all([
      fetch("/data/chemical/ground_floor/stairs.geojson"),
      fetch("/data/chemical/first_floor/stairs.geojson"),
    ]);

    const gfData = await gfResponse.json();
    const ffData = await ffResponse.json();

    stairs = [
      ...gfData.features,
      ...ffData.features,
    ];
  }

  return stairs;
}

// Existing function used by navigationService.js
export async function findStairs(search) {
  const allStairs = await loadStairs();

  const query = search.trim().toUpperCase();

  return allStairs.filter((stair) => {
    const p = stair.properties;

    return (
      p.id.toUpperCase() === query ||
      p.name.toUpperCase().includes(query)
    );
  });
}

// New function for floor-transition logic
const STAIR_MAPPING = {
  "Chemical Block": {
    1: "CHEM_STAIR_02_GF",
  },
};

export function getTargetStair(building, floor) {
  return STAIR_MAPPING[building]?.[floor] ?? null;
}

// Helper to retrieve a stair feature by ID
export async function findStairById(id) {
  const allStairs = await loadStairs();

  return (
    allStairs.find(
      (stair) => stair.properties.id === id
    ) || null
  );
}