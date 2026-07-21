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
      console.error("Unknown navigation stage:", stage);
      return null;
  }
}

// ======================================================
// OUTDOOR NAVIGATION
// ======================================================

async function navigateOutdoor(options) {
  const { start, destination: destinationName } = options;

  const building = getBuildingFromRoom(destinationName);

  console.log("========== BUILDING LOOKUP ==========");
  console.log("Search:", destinationName);
  console.log("Detected Building:", building);
  console.log("====================================");

  if (!building) {
    console.error("Unable to determine destination building.");
    return null;
  }

  const graph = getOutdoorGraph();

  if (!graph) {
    console.error("Outdoor graph not loaded.");
    return null;
  }

  let destinations = await findRooms(
    building,
    destinationName
  );

  console.log("Rooms Found:", destinations.length);

  if (destinations.length === 0) {
    destinations = await findStairs(destinationName);
  }

  if (destinations.length === 0) {
    console.error("Destination not found.");
    return null;
  }

  const startNode = findNearestNode(
    graph,
    start.lat,
    start.lng
  );

  let bestRoute = [];
  let bestDestination = null;
  let shortestDistance = Infinity;

  for (const destination of destinations) {
    const [goalLng, goalLat] =
      destination.geometry.coordinates;

    const goalNode = findNearestNode(
      graph,
      goalLat,
      goalLng
    );

    const route = aStar(
      graph,
      startNode,
      goalNode
    );

    if (
      route.length > 0 &&
      route.length < shortestDistance
    ) {
      shortestDistance = route.length;
      bestRoute = route;
      bestDestination = destination;
    }
  }

  return {
    route: bestRoute,
    destination: bestDestination,
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

  console.log("========== GROUND FLOOR ROUTING ==========");
  console.log("Building:", building);

  const graph = getGroundFloorGraph(building);

  if (!graph) {
    console.error(
      "Ground Floor graph not loaded."
    );
    return null;
  }

  const startNode = findNearestNode(
    graph,
    start.lat,
    start.lng
  );

  console.log("Start Node:", startNode);

  if (!startNode) {
    console.error("Unable to locate start node.");
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

    targetFeature = await findStairById(
      stairId
    );

    if (!targetFeature) {
      console.error(
        "Target stair not found."
      );
      return null;
    }
  }

  console.log("Target:", targetFeature);

  const [goalLng, goalLat] =
    targetFeature.geometry.coordinates;

  const goalNode = findNearestNode(
    graph,
    goalLat,
    goalLng
  );

  console.log("Goal Node:", goalNode);

  if (!goalNode) {
    console.error(
      "Unable to locate destination node."
    );
    return null;
  }

  const route = aStar(
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
  const { building } = options;

  const graph =
    getFirstFloorGraph(building);

  console.warn(
    "First Floor routing not implemented yet.",
    options
  );

  return null;
}