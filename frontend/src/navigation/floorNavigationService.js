import { aStar } from "./astar";
import { findNearestNode } from "./findNearestNode";
import { findRooms } from "../services/roomService";
import { findConnectedStairNode } from "./graphConnector";

import { getFirstFloorGraph } from "./graphManager";

export async function navigateOnFloor(
  stairId,
  destinationRoom
) {
  console.log("========== FLOOR NAVIGATION ==========");

  // Get the dedicated First Floor graph
  const graph = getFirstFloorGraph();

  if (!graph) {
    console.error("First Floor graph not loaded.");
    return null;
  }

  // Search destination room
  const rooms = await findRooms(destinationRoom);

  console.log("Searching Room:", destinationRoom);
  console.log("Rooms Found:", rooms);

  if (!rooms || rooms.length === 0) {
    console.error("Destination room not found.");
    return null;
  }

  const destination = rooms[0];

  console.log("Destination:", destination);

  // Convert GF stair id → F1 stair id
  const startNode = findConnectedStairNode(
    stairId.replace("_GF", "_F1")
  );

  if (!startNode) {
    console.error("First-floor stair node not found.");
    return null;
  }

  console.log("Start Node:", startNode);

  // Destination coordinates
  const [lng, lat] = destination.geometry.coordinates;

  const goalNode = findNearestNode(
    graph,
    lat,
    lng,
    null
  );

  if (!goalNode) {
    console.error("Goal node not found.");
    return null;
  }

  console.log("Goal Node:", goalNode);

  // Calculate First Floor route
  const route = aStar(
    graph,
    startNode,
    goalNode
  );

  console.log("First Floor Route:", route);
  console.log("===================================");

  return {
    route,
    destination,
  };
}