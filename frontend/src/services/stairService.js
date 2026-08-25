let stairs = [];

// ======================================================
// LOAD STAIRS
// ======================================================

async function loadStairs() {
  if (stairs.length === 0) {
    const [
      chemicalGfResponse,
      chemicalFfResponse,
      mechanicalGfResponse,
      mechanicalFfResponse,
      mechanicalSfResponse,
      mechanicalTfResponse,
    ] = await Promise.all([
      fetch(
        "/data/chemical/ground_floor/stairs.geojson"
      ),

      fetch(
        "/data/chemical/first_floor/stairs.geojson"
      ),

      fetch(
        "/data/mechanical/ground_floor/stairs.geojson"
      ),

      fetch(
        "/data/mechanical/first_floor/stairs.geojson"
      ),

      fetch(
        "/data/mechanical/second_floor/stairs.geojson"
      ),

      fetch(
        "/data/mechanical/top_floor/stairs.geojson"
      ),
    ]);

    // -----------------------------------
    // Validate responses
    // -----------------------------------

    if (
      !chemicalGfResponse.ok ||
      !chemicalFfResponse.ok ||
      !mechanicalGfResponse.ok ||
      !mechanicalFfResponse.ok ||
      !mechanicalSfResponse.ok ||
      !mechanicalTfResponse.ok
    ) {
      throw new Error(
        "Failed to load stair GeoJSON data."
      );
    }

    // -----------------------------------
    // Convert to JSON
    // -----------------------------------

    const [
      chemicalGfData,
      chemicalFfData,
      mechanicalGfData,
      mechanicalFfData,
      mechanicalSfData,
      mechanicalTfData,
    ] = await Promise.all([
      chemicalGfResponse.json(),
      chemicalFfResponse.json(),
      mechanicalGfResponse.json(),
      mechanicalFfResponse.json(),
      mechanicalSfResponse.json(),
      mechanicalTfResponse.json(),
    ]);

    // -----------------------------------
    // Merge all stair/lift features
    // -----------------------------------

    stairs = [
      ...chemicalGfData.features,
      ...chemicalFfData.features,

      ...mechanicalGfData.features,
      ...mechanicalFfData.features,
      ...mechanicalSfData.features,
      ...mechanicalTfData.features,
    ];

    console.log(
      "========== STAIRS LOADED =========="
    );

    console.log(
      "Total Stair/Lift Features:",
      stairs.length
    );

    console.log(
      "Chemical GF:",
      chemicalGfData.features.length
    );

    console.log(
      "Chemical FF:",
      chemicalFfData.features.length
    );

    console.log(
      "Mechanical GF:",
      mechanicalGfData.features.length
    );

    console.log(
      "Mechanical FF:",
      mechanicalFfData.features.length
    );

    console.log(
      "Mechanical SF:",
      mechanicalSfData.features.length
    );

    console.log(
      "Mechanical TF:",
      mechanicalTfData.features.length
    );

    console.log(
      "==================================="
    );
  }

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
// DEFAULT FLOOR TRANSITION
// ======================================================

const STAIR_MAPPING = {
  "Chemical Block": {
    1: "CHEM_STAIR_02_GF",
  },

  "Mechanical Block": {
    1: "MECH_STAIR_01_GF",
  },
};

// ======================================================
// GET TARGET STAIR
// ======================================================

export function getTargetStair(
  building,
  floor
) {
  const stairId =
    STAIR_MAPPING[building]?.[floor] ??
    null;

  console.log(
    "========== TARGET STAIR LOOKUP =========="
  );

  console.log(
    "Building:",
    building
  );

  console.log(
    "Destination Floor:",
    floor
  );

  console.log(
    "Target Stair ID:",
    stairId
  );

  console.log(
    "========================================="
  );

  return stairId;
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