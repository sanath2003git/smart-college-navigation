import { findNearestNode } from "./findNearestNode";

// Transition nodes stored separately for each building.
//
// Structure:
//
// transitionGraphNodes[building][transitionId] = graphNodeId
//
// Example:
//
// transitionGraphNodes["Mechanical Block"][
//   "MECH_STAIR_01_F2_END"
// ]
//
// → "8.9129852,76.6317045"
const transitionGraphNodes = {};

/**
 * Get the public-data folder for a building.
 */
function getBuildingFolder(building) {
  if (building === "Chemical Block") {
    return "chemical";
  }

  if (building === "Mechanical Block") {
    return "mechanical";
  }

  return null;
}

/**
 * Return the floor configuration for a building.
 *
 * Chemical currently has:
 *   GF + FF
 *
 * Mechanical currently has:
 *   GF + FF + SF + TF
 */
function getFloorConfiguration(building) {
  if (building === "Chemical Block") {
    return [
      {
        floor: 0,
        key: "groundFloor",
        folder: "ground_floor",
      },
      {
        floor: 1,
        key: "firstFloor",
        folder: "first_floor",
      },
    ];
  }

  if (building === "Mechanical Block") {
    return [
      {
        floor: 0,
        key: "groundFloor",
        folder: "ground_floor",
      },
      {
        floor: 1,
        key: "firstFloor",
        folder: "first_floor",
      },
      {
        floor: 2,
        key: "secondFloor",
        folder: "second_floor",
      },
      {
        floor: 3,
        key: "thirdFloor",
        folder: "top_floor",
      },
    ];
  }

  return [];
}

/**
 * Load stairs.geojson for every floor of a building.
 */
async function loadTransitionFeatures(
  building
) {
  const folder =
    getBuildingFolder(building);

  if (!folder) {
    console.error(
      "Unsupported building:",
      building
    );

    return null;
  }

  const floorConfig =
    getFloorConfiguration(building);

  const responses =
    await Promise.all(
      floorConfig.map(
        async ({
          floor,
          key,
          folder: floorFolder,
        }) => {
          const response =
            await fetch(
              `/data/${folder}/${floorFolder}/stairs.geojson`
            );

          if (!response.ok) {
            throw new Error(
              `Failed to load ${building} floor ${floor} stairs.geojson`
            );
          }

          const data =
            await response.json();

          return {
            floor,
            key,
            folder: floorFolder,
            data,
          };
        }
      )
    );

  return responses;
}

/**
 * Connect every stair/lift transition feature
 * to the nearest node in its own floor graph.
 *
 * IMPORTANT:
 *
 * We do NOT connect an F2 transition to the F1 graph.
 *
 * Each transition is connected to the graph
 * belonging to the same floor.
 *
 * Example:
 *
 * MECH_STAIR_01_F2_END
 *       ↓
 * Second Floor Graph
 *
 * MECH_STAIR_02_F2_START
 *       ↓
 * Second Floor Graph
 *
 * MECH_STAIR_02_F3_END
 *       ↓
 * Top Floor Graph
 */
export async function connectFloorTransitions(
  building,
  floorGraphs
) {
  if (!building || !floorGraphs) {
    console.error(
      "connectFloorTransitions: building or floor graphs missing."
    );

    return;
  }

  const floorConfig =
    getFloorConfiguration(building);

  if (floorConfig.length === 0) {
    console.error(
      "No floor configuration found for:",
      building
    );

    return;
  }

  let transitionData;

  try {
    transitionData =
      await loadTransitionFeatures(
        building
      );
  } catch (error) {
    console.error(
      "Failed to load transition data:",
      error
    );

    return;
  }

  // Reset existing nodes for this building.
  transitionGraphNodes[building] = {};

  console.log(
    `========== ${building} TRANSITION NODES ==========`
  );

  for (const floorInfo of transitionData) {
    const {
      floor,
      key,
      folder,
      data,
    } = floorInfo;

    const graph =
      floorGraphs[key];

    console.log(
      `--- Floor ${floor} (${folder}) ---`
    );

    if (!graph) {
      console.warn(
        `No graph supplied for ${building} floor ${floor}.`
      );

      continue;
    }

    if (
      !data ||
      !Array.isArray(data.features)
    ) {
      console.warn(
        `No transition features found for ${building} floor ${floor}.`
      );

      continue;
    }

    for (const transition of data.features) {
      const coordinates =
        transition.geometry?.coordinates;

      const id =
        transition.properties?.id;

      if (
        !id ||
        !Array.isArray(coordinates) ||
        coordinates.length < 2
      ) {
        console.warn(
          "Skipping invalid transition feature:",
          transition
        );

        continue;
      }

      const [lng, lat] =
        coordinates;

      const nearestNode =
        findNearestNode(
          graph,
          lat,
          lng
        );

      if (!nearestNode) {
        console.warn(
          `Unable to connect transition ${id} to floor ${floor} graph.`
        );

        continue;
      }

      transitionGraphNodes[
        building
      ][id] = nearestNode;

      console.log(
        `${id} → ${nearestNode}`
      );
    }
  }

  console.log(
    "=========================================="
  );

  return transitionGraphNodes[
    building
  ];
}

/**
 * Get the graph node connected to a transition.
 */
export function findConnectedStairNode(
  building,
  transitionId
) {
  console.log(
    "========== TRANSITION LOOKUP =========="
  );

  console.log(
    "Building:",
    building
  );

  console.log(
    "Transition:",
    transitionId
  );

  const node =
    transitionGraphNodes[
      building
    ]?.[transitionId] ?? null;

  console.log(
    "Connected Graph Node:",
    node
  );

  return node;
}

/**
 * Get the graph-connected location of a
 * transition.
 *
 * Returns:
 *
 * {
 *   lat,
 *   lng
 * }
 */
export function getTransitionLocation(
  building,
  transitionId
) {
  const nodeId =
    findConnectedStairNode(
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
  //
  // "latitude,longitude"
  //
  const [
    latString,
    lngString,
  ] = nodeId.split(",");

  const lat =
    Number(latString);

  const lng =
    Number(lngString);

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