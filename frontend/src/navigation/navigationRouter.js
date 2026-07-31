import {
  getOutdoorGraph,
  getGroundFloorGraph,
  getFirstFloorGraph,
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

export async function navigate(options) {
  const { stage } = options;

  switch (stage) {
    case NAVIGATION_STAGE.OUTDOOR:
      return navigateOutdoor(options);

    case NAVIGATION_STAGE.GROUND_FLOOR:
      return navigateGroundFloor(options);

    case NAVIGATION_STAGE.FIRST_FLOOR:
      return navigateFirstFloor(options);

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

  const graph = getOutdoorGraph();

  if (!graph) {
    console.error(
      "Outdoor graph not loaded."
    );

    return null;
  }

  // -----------------------------------
  // Find actual destination
  // -----------------------------------

  let destinations = await findRooms(
    building,
    destinationName
  );

  console.log(
    "Rooms Found:",
    destinations.length
  );

  if (destinations.length === 0) {
    destinations =
      await findStairs(destinationName);
  }

  if (destinations.length === 0) {
    console.error(
      "Destination not found."
    );

    return null;
  }

  /*
   * For now select the first matching destination.
   *
   * The outdoor route should NOT route to the
   * room coordinate because that room may be
   * inside the building or on another floor.
   *
   * Outdoor navigation ends at the entrance
   * of the destination building.
   */
  const destination = destinations[0];

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

  const [entranceLng, entranceLat] =
    entrance.geometry.coordinates;

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

  if (!route || route.length === 0) {
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
// GROUND FLOOR NAVIGATION
// ======================================================

async function navigateGroundFloor(options) {
  const {
    start,
    stairId,
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
    getGroundFloorGraph(building);

  if (!graph) {
    console.error(
      "Ground Floor graph not loaded."
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
  // Ground Floor Room Navigation
  // -----------------------------------

  if (destination) {
    console.log(
      "Routing to Ground Floor room..."
    );

    targetFeature = destination;
  }

  // -----------------------------------
  // Stair Navigation
  // -----------------------------------

  else {
    console.log(
      "Routing to Stair:",
      stairId
    );

    targetFeature =
      await findStairById(stairId);

    if (!targetFeature) {
      console.error(
        "Target stair not found."
      );

      return null;
    }
  }

  console.log(
    "Target:",
    targetFeature
  );

  const [goalLng, goalLat] =
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

  if (!route || route.length === 0) {
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
    destination: targetFeature,
  };
}

// ======================================================
// FIRST FLOOR NAVIGATION
// ======================================================

async function navigateFirstFloor(options) {
  const {
    start,
    destination,
    building,
  } = options;

  console.log(
    "========== FIRST FLOOR ROUTING =========="
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

  const graph =
    getFirstFloorGraph(building);

  if (!graph) {
    console.error(
      "First Floor graph not loaded for:",
      building
    );

    return null;
  }

  if (!start) {
    console.error(
      "First Floor start location missing."
    );

    return null;
  }

  if (!destination) {
    console.error(
      "First Floor destination missing."
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
    "Start Node:",
    startNode
  );

  if (!startNode) {
    console.error(
      "Unable to locate First Floor start node."
    );

    return null;
  }

  // -----------------------------------
  // Destination node
  // -----------------------------------

  const [goalLng, goalLat] =
    destination.geometry.coordinates;

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
      "Unable to locate First Floor destination node."
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
    "First Floor Route:",
    route
  );

  if (!route || route.length === 0) {
    console.error(
      "No First Floor route found."
    );

    return null;
  }

  console.log(
    "First Floor routing successful."
  );

  return {
    route,
    destination,
  };
}