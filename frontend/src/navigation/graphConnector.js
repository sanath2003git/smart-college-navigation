import { findNearestNode } from "./findNearestNode";

// Transition nodes stored separately for each building.
const transitionGraphNodes = {};

export async function connectFloorTransitions(
  building,
  firstFloorGraph
) {
  if (!building || !firstFloorGraph) {
    console.error(
      "connectFloorTransitions: building or graph missing."
    );
    return;
  }

  const folder =
    building === "Chemical Block"
      ? "chemical"
      : building === "Mechanical Block"
        ? "mechanical"
        : null;

  if (!folder) {
    console.error(
      "Unsupported building:",
      building
    );
    return;
  }

  const [gfResponse, ffResponse] = await Promise.all([
    fetch(`/data/${folder}/ground_floor/stairs.geojson`),
    fetch(`/data/${folder}/first_floor/stairs.geojson`),
  ]);

  if (!gfResponse.ok || !ffResponse.ok) {
    console.error(
      `Failed to load transition data for ${building}`
    );
    return;
  }

  const gf = await gfResponse.json();
  const ff = await ffResponse.json();

  transitionGraphNodes[building] = {};

  console.log(
    `========== ${building} TRANSITION NODES ==========`
  );

  // Register every First Floor transition against
  // its nearest node in the building's FF graph.
  ff.features.forEach((transition) => {
    const [lng, lat] =
      transition.geometry.coordinates;

    const nearestNode = findNearestNode(
      firstFloorGraph,
      lat,
      lng
    );

    const id = transition.properties.id;

    transitionGraphNodes[building][id] =
      nearestNode;

    console.log(id, "→", nearestNode);
  });

  console.log(
    "=========================================="
  );

  return {
    groundFloorTransitions: gf.features,
    firstFloorTransitions: ff.features,
  };
}

// ------------------------------------------------------
// Get registered FF graph node
// ------------------------------------------------------

export function findConnectedStairNode(
  building,
  transitionId
) {
  console.log(
    "========== TRANSITION LOOKUP =========="
  );
  console.log("Building:", building);
  console.log("Transition:", transitionId);

  return (
    transitionGraphNodes[building]?.[
      transitionId
    ] ?? null
  );
}

// ------------------------------------------------------
// Get registered FF transition as { lat, lng }
// ------------------------------------------------------

export function getTransitionLocation(
  building,
  transitionId
) {
  const nodeId = findConnectedStairNode(
    building,
    transitionId
  );

  if (!nodeId) {
    console.error(
      "Transition graph node not found:",
      building,
      transitionId
    );

    return null;
  }

  // Graph node IDs use:
  // "latitude,longitude"
  const [latString, lngString] =
    nodeId.split(",");

  const lat = Number(latString);
  const lng = Number(lngString);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    console.error(
      "Invalid transition graph node:",
      nodeId
    );

    return null;
  }

  return {
    lat,
    lng,
  };
}