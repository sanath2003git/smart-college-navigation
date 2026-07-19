import { aStar } from "./astar";
import { findNearestNode } from "./findNearestNode";

import { findRooms } from "../services/roomService";
import { findStairs } from "../services/stairService";

import { getOutdoorGraph } from "./graphManager";

export async function navigateToRoom(
  startLat,
  startLng,
  destinationName
) {
  // Use the Outdoor Graph managed by V2
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
    console.error("Destination not found:", destinationName);
    return null;
  }

  const startNode = findNearestNode(
    graph,
    startLat,
    startLng,
    null
  );

  let bestRoute = [];
  let bestDestination = null;
  let shortestDistance = Infinity;

  for (const destination of destinations) {
    const goalLng = destination.geometry.coordinates[0];
    const goalLat = destination.geometry.coordinates[1];

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