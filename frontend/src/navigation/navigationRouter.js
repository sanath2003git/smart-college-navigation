import {
  getOutdoorGraph,
  getGroundFloorGraph,
  getFirstFloorGraph,
  getSecondFloorGraph,
  getThirdFloorGraph,
} from "./graphManager";

import { NAVIGATION_STAGE } from "../constants/navigationStages";

import { aStar } from "./astar";
import { findNearestNode } from "./findNearestNode";

import { findRooms } from "../services/roomService";

import {
  findStairs,
  findStairById,
} from "../services/stairService";

import { findNearestEntrance } from "../services/entranceService";

import { getBuildingFromRoom } from "../services/buildingRoomLookup";

// ======================================================
// MAIN NAVIGATION ENTRY
// ======================================================

export async function navigate(options) {
  const { stage } = options;

  switch (stage) {
    case NAVIGATION_STAGE.OUTDOOR:
      return navigateOutdoor(options);

    case NAVIGATION_STAGE.GROUND_FLOOR:
      return navigateGroundFloor(options);

    case NAVIGATION_STAGE.FIRST_FLOOR:
      return navigateFirstFloor(options);

    case NAVIGATION_STAGE.SECOND_FLOOR:
      return navigateSecondFloor(options);

    case NAVIGATION_STAGE.THIRD_FLOOR:
      return navigateThirdFloor(options);

    default:
      console.error(
        "Unknown navigation stage:",
        stage
      );

      return null;
  }
}

// ======================================================
// OUTDOOR NAVIGATION
// ======================================================

async function navigateOutdoor(options) {
  const {
    start,
    destination: destinationName,
  } = options;

  const building =
    getBuildingFromRoom(destinationName);

  console.log(
    "========== BUILDING LOOKUP =========="
  );

  console.log(
    "Search:",
    destinationName
  );

  console.log(
    "Detected Building:",
    building
  );

  console.log(
    "===================================="
  );

  if (!building) {
    console.error(
      "Unable to determine destination building."
    );

    return null;
  }

  const graph =
    getOutdoorGraph();

  if (!graph) {
    console.error(
      "Outdoor graph not loaded."
    );

    return null;
  }

  // -----------------------------------
  // Find actual destination
  // -----------------------------------

  let destinations =
    await findRooms(
      building,
      destinationName
    );

  console.log(
    "Rooms Found:",
    destinations.length
  );

  if (
    destinations.length === 0
  ) {
    destinations =
      await findStairs(
        destinationName
      );
  }

  if (
    destinations.length === 0
  ) {
    console.error(
      "Destination not found."
    );

    return null;
  }

  /*
   * Outdoor navigation ends at the
   * destination building entrance.
   *
   * The actual room is handled by
   * indoor navigation.
   */
  const destination =
    destinations[0];

  // -----------------------------------
  // Find building entrance
  // -----------------------------------

  const entrance =
    await findNearestEntrance(
      building,
      start.lat,
      start.lng
    );

  console.log(
    "========== OUTDOOR ROUTING =========="
  );

  console.log(
    "Destination:",
    destination.properties?.room_no ||
      destination.properties?.name
  );

  console.log(
    "Building:",
    building
  );

  console.log(
    "Target Entrance:",
    entrance
  );

  if (!entrance) {
    console.error(
      "No entrance found for:",
      building
    );

    return null;
  }

  // -----------------------------------
  // Find outdoor start node
  // -----------------------------------

  const startNode =
    findNearestNode(
      graph,
      start.lat,
      start.lng
    );

  console.log(
    "Outdoor Start Node:",
    startNode
  );

  if (!startNode) {
    console.error(
      "Unable to locate outdoor start node."
    );

    return null;
  }

  // -----------------------------------
  // Entrance → outdoor graph node
  // -----------------------------------

  const [
    entranceLng,
    entranceLat,
  ] = entrance.geometry.coordinates;

  const goalNode =
    findNearestNode(
      graph,
      entranceLat,
      entranceLng
    );

  console.log(
    "Outdoor Goal Node:",
    goalNode
  );

  if (!goalNode) {
    console.error(
      "Unable to locate entrance on outdoor graph."
    );

    return null;
  }

  // -----------------------------------
  // Outdoor A*
  // -----------------------------------

  const route =
    aStar(
      graph,
      startNode,
      goalNode
    );

  console.log(
    "Outdoor Route:",
    route
  );

  if (
    !route ||
    route.length === 0
  ) {
    console.error(
      "No outdoor route found."
    );

    return null;
  }

  console.log(
    "Outdoor routing successful."
  );

  return {
    route,
    destination,
    entrance,
  };
}

// ======================================================
// SMART TRANSITION ROUTE
// ======================================================

async function findBestTransitionRoute({
  graph,
  startNode,
  candidateIds,
}) {
  let best = null;

  if (
    !candidateIds ||
    candidateIds.length === 0
  ) {
    return null;
  }

  for (
    const candidateId of candidateIds
  ) {
    const feature =
      await findStairById(
        candidateId
      );

    if (!feature) {
      console.warn(
        "Transition feature not found:",
        candidateId
      );

      continue;
    }

    const [
      lng,
      lat,
    ] = feature.geometry.coordinates;

    const goalNode =
      findNearestNode(
        graph,
        lat,
        lng
      );

    if (!goalNode) {
      console.warn(
        "Transition has no graph node:",
        candidateId
      );

      continue;
    }

    const route =
      aStar(
        graph,
        startNode,
        goalNode
      );

    if (
      !route ||
      route.length === 0
    ) {
      console.warn(
        "No route to transition:",
        candidateId
      );

      continue;
    }

    console.log(
      `${candidateId} → ${route.length} nodes`
    );

    if (
      !best ||
      route.length <
        best.route.length
    ) {
      best = {
        id: candidateId,
        feature,
        route,
      };
    }
  }

  return best;
}

// ======================================================
// GROUND FLOOR NAVIGATION
// ======================================================

async function navigateGroundFloor(
  options
) {
  const {
    start,
    stairId,
    transitionCandidates,
    transitionStrategy,
    destination,
    building,
  } = options;

  console.log(
    "========== GROUND FLOOR ROUTING =========="
  );

  console.log(
    "Building:",
    building
  );

  const graph =
    getGroundFloorGraph(
      building
    );

  if (!graph) {
    console.error(
      "Ground Floor graph not loaded."
    );

    return null;
  }

  if (!start) {
    console.error(
      "Ground Floor start missing."
    );

    return null;
  }

  const startNode =
    findNearestNode(
      graph,
      start.lat,
      start.lng
    );

  console.log(
    "Start Node:",
    startNode
  );

  if (!startNode) {
    console.error(
      "Unable to locate start node."
    );

    return null;
  }

  let targetFeature = null;

  // -----------------------------------
  // Room navigation
  // -----------------------------------

  if (destination) {
    console.log(
      "Routing to Ground Floor room..."
    );

    targetFeature =
      destination;
  }

  // -----------------------------------
  // Stair / Lift navigation
  // -----------------------------------

  else {
    console.log(
      "Routing to Transition:",
      stairId
    );

    if (
      transitionCandidates &&
      transitionCandidates.length > 0
    ) {
      console.log(
        "========== SMART TRANSITION =========="
      );

      console.log(
        "Strategy:",
        transitionStrategy
      );

      console.log(
        "Candidates:",
        transitionCandidates
      );

      const best =
        await findBestTransitionRoute({
          graph,
          startNode,
          candidateIds:
            transitionCandidates,
        });

      if (!best) {
        console.error(
          "No valid transition route found."
        );

        return null;
      }

      console.log(
        "Best Transition:",
        best.id
      );

      console.log(
        "======================================"
      );

      targetFeature =
        best.feature;
    }

    // -----------------------------------
    // Backward compatibility
    // -----------------------------------

    else {
      targetFeature =
        await findStairById(
          stairId
        );

      if (!targetFeature) {
        console.error(
          "Target transition not found."
        );

        return null;
      }
    }
  }

  if (!targetFeature) {
    console.error(
      "Ground Floor target missing."
    );

    return null;
  }

  console.log(
    "Target:",
    targetFeature
  );

  const [
    goalLng,
    goalLat,
  ] =
    targetFeature.geometry.coordinates;

  const goalNode =
    findNearestNode(
      graph,
      goalLat,
      goalLng
    );

  console.log(
    "Goal Node:",
    goalNode
  );

  if (!goalNode) {
    console.error(
      "Unable to locate destination node."
    );

    return null;
  }

  const route =
    aStar(
      graph,
      startNode,
      goalNode
    );

  console.log(
    "Ground Floor Route:",
    route
  );

  if (
    !route ||
    route.length === 0
  ) {
    console.error(
      "No Ground Floor route found."
    );

    return null;
  }

  console.log(
    "Ground Floor routing successful."
  );

  return {
    route,

    destination:
      targetFeature,

    selectedTransitionId:
      targetFeature.properties.id,

    selectedTransition:
      targetFeature,
  };
}

// ======================================================
// GENERIC UPPER FLOOR NAVIGATION
// ======================================================

async function navigateFloor({
  floorName,
  graph,
  start,
  destination,
  building,
}) {
  console.log(
    `========== ${floorName.toUpperCase()} ROUTING ==========`
  );

  console.log(
    "Building:",
    building
  );

  console.log(
    "Start:",
    start
  );

  console.log(
    "Destination:",
    destination
  );

  // -----------------------------------
  // Graph
  // -----------------------------------

  if (!graph) {
    console.error(
      `${floorName} graph not loaded for:`,
      building
    );

    return null;
  }

  // -----------------------------------
  // Start
  // -----------------------------------

  if (!start) {
    console.error(
      `${floorName} start location missing.`
    );

    return null;
  }

  // -----------------------------------
  // Destination
  // -----------------------------------

  if (!destination) {
    console.error(
      `${floorName} destination missing.`
    );

    return null;
  }

  // -----------------------------------
  // Start node
  // -----------------------------------

  const startNode =
    findNearestNode(
      graph,
      start.lat,
      start.lng
    );

  console.log(
    `${floorName} Start Node:`,
    startNode
  );

  if (!startNode) {
    console.error(
      `Unable to locate ${floorName} start node.`
    );

    return null;
  }

  // -----------------------------------
  // Destination node
  // -----------------------------------

  if (
    !destination.geometry ||
    !destination.geometry.coordinates
  ) {
    console.error(
      `${floorName} destination geometry missing.`
    );

    return null;
  }

  const [
    goalLng,
    goalLat,
  ] =
    destination.geometry.coordinates;

  const goalNode =
    findNearestNode(
      graph,
      goalLat,
      goalLng
    );

  console.log(
    `${floorName} Goal Node:`,
    goalNode
  );

  if (!goalNode) {
    console.error(
      `Unable to locate ${floorName} destination node.`
    );

    return null;
  }

  // -----------------------------------
  // A*
  // -----------------------------------

  const route =
    aStar(
      graph,
      startNode,
      goalNode
    );

  console.log(
    `${floorName} Route:`,
    route
  );

  if (
    !route ||
    route.length === 0
  ) {
    console.error(
      `No ${floorName} route found.`
    );

    return null;
  }

  console.log(
    `${floorName} routing successful.`
  );

  return {
    route,
    destination,
  };
}

// ======================================================
// FIRST FLOOR NAVIGATION
// ======================================================

async function navigateFirstFloor(
  options
) {
  const {
    start,
    destination,
    building,
  } = options;

  const graph =
    getFirstFloorGraph(
      building
    );

  return navigateFloor({
    floorName:
      "First Floor",

    graph,

    start,

    destination,

    building,
  });
}

// ======================================================
// SECOND FLOOR NAVIGATION
// ======================================================

async function navigateSecondFloor(
  options
) {
  const {
    start,
    destination,
    building,
  } = options;

  const graph =
    getSecondFloorGraph(
      building
    );

  return navigateFloor({
    floorName:
      "Second Floor",

    graph,

    start,

    destination,

    building,
  });
}

// ======================================================
// THIRD FLOOR NAVIGATION
// ======================================================

async function navigateThirdFloor(
  options
) {
  const {
    start,
    destination,
    building,
  } = options;

  const graph =
    getThirdFloorGraph(
      building
    );

  return navigateFloor({
    floorName:
      "Third Floor",

    graph,

    start,

    destination,

    building,
  });
}