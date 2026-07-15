import { aStar } from "./astar";
import { findNearestNode } from "./findNearestNode";
import { findRooms } from "../services/roomService";
import { findConnectedStairNode } from "./graphConnector";
import { filterGraphByFloor } from "./graphFilter";

export async function navigateOnFloor(
  graph,
  stairId,
  destinationRoom
) {
  // Search destination room
  const rooms = await findRooms(destinationRoom);

  console.log("========== FLOOR NAVIGATION ==========");
  console.log("Searching Room:", destinationRoom);
  console.log("Rooms Found:", rooms);

  if (!rooms || rooms.length === 0) {
    console.error("Destination room not found.");
    return null;
  }

  // First matching room
  const destination = rooms[0];

  console.log("Destination:", destination);

  // First Floor stair node
  const startNode = findConnectedStairNode(
    stairId.replace("_GF", "_F1")
  );

  if (!startNode) {
    console.error("First-floor stair node not found.");
    return null;
  }

  console.log("Start Node:", startNode);

  // Destination graph node
  const [lng, lat] = destination.geometry.coordinates;

  const goalNode = findNearestNode(
  graph,
  lat,
  lng,
  1
);

  if (!goalNode) {
    console.error("Goal node not found.");
    return null;
  }

  console.log("Goal Node:", goalNode);
  const floorGraph = filterGraphByFloor(
  graph,
  1
);

console.log("Filtered First Floor Graph:", floorGraph);

  // Calculate First Floor route
  const route = aStar(
  floorGraph,
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