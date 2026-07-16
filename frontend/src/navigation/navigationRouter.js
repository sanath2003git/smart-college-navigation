import {
  getOutdoorGraph,
  getGroundFloorGraph,
  getFirstFloorGraph,
} from "./graphManager";

import { NAVIGATION_STAGE } from "../constants/navigationStages";

import { aStar } from "./astar";
import { findNearestNode } from "./findNearestNode";

import { findRooms } from "../services/roomService";
import { findStairs } from "../services/stairService";

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

async function navigateOutdoor(options) {
  const { start, destination: destinationName } = options;

  const graph = getOutdoorGraph();

  if (!graph) {
    console.error("Outdoor graph not loaded.");
    return null;
  }

  let destinations = await findRooms(destinationName);

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
    start.lng,
    null
  );

  let bestRoute = [];
  let bestDestination = null;
  let shortestDistance = Infinity;

  for (const destination of destinations) {
    const [goalLng, goalLat] = destination.geometry.coordinates;

    const goalNode = findNearestNode(
      graph,
      goalLat,
      goalLng,
      null
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

async function navigateGroundFloor(options) {
  console.warn(
    "Ground Floor routing not implemented yet.",
    options
  );

  return null;
}

async function navigateFirstFloor(options) {
  console.warn(
    "First Floor routing not implemented yet.",
    options
  );

  return null;
}