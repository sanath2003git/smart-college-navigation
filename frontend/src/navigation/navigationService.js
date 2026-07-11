import { aStar } from "../navigation/astar";
import { findNearestNode } from "./findNearestNode";
import { findRooms } from "../services/roomService";

export async function navigateToRoom(
  graph,
  startLat,
  startLng,
  roomNo
) {
  const rooms = await findRooms(roomNo);

  if (rooms.length === 0) {
    console.error("Room not found:", roomNo);
    return [];
  }

  const startNode = findNearestNode(
    graph,
    startLat,
    startLng
  );

  let bestRoute = [];
  let shortestDistance = Infinity;

  for (const room of rooms) {
    const goalLng = room.geometry.coordinates[0];
    const goalLat = room.geometry.coordinates[1];

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
    }
  }

  return bestRoute;
}