import { aStar } from "../navigation/astar";
import { findNearestNode } from "./findNearestNode";

import { findRooms } from "../services/roomService";
import { findStairs } from "../services/stairService";

export async function navigateToRoom(
  graph,
  startLat,
  startLng,
  destinationName
) {
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
    startLng
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