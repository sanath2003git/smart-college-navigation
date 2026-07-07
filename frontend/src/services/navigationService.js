import { aStar } from "../algorithms/astar";
import { findNearestNode } from "../utils/findNearestNode";
import { findRoom } from "./roomService";

/**
 * Navigate from a coordinate to a room.
 *
 * @param {Object} graph Navigation graph
 * @param {number} startLat Current latitude
 * @param {number} startLng Current longitude
 * @param {string} roomNo Destination room number (e.g. H107)
 *
 * @returns {Array} Shortest path
 */
export async function navigateToRoom(
  graph,
  startLat,
  startLng,
  roomNo
) {
  // Find destination room
  const room = await findRoom(roomNo);

  if (!room) {
    console.error("Room not found:", roomNo);
    return [];
  }

  // Door coordinates
  const goalLng = room.geometry.coordinates[0];
  const goalLat = room.geometry.coordinates[1];

  // Find nearest graph nodes
  const startNode = findNearestNode(graph, startLat, startLng);
  const goalNode = findNearestNode(graph, goalLat, goalLng);

  console.log("Start Node:", startNode);
  console.log("Goal Node:", goalNode);

  // Calculate shortest path
  return aStar(graph, startNode, goalNode);
}