import { aStar } from "../algorithms/astar";
import { findNearestNode } from "./findNearestNode";

export function testGraph(graph) {

  // Chemical Main Entrance
  // const startLat = 8.912525104666102;
  // const startLng = 76.631489511535989;

  // // Chemical Back Entrance
  // const goalLat = 8.912412762684593;
  // const goalLng = 76.631837011277696;

  // Mechanical Main Entrance
  // const startLat = 8.912952142010484;
  // const startLng = 76.631631641809747;

  // Chemical Back Entrance
  // const goalLat = 8.912412762684593;
  // const goalLng = 76.631837011277696;

   // Chemical Main Entrance
  // const startLat = 8.912525104666102;
  // const startLng = 76.631489511535989;

  // // Chemical H107
  // const goalLat = 8.912358256558074;
  // const goalLng = 76.631575599956975; 

  // Chemical H111
  // const startLng  = 76.631731020734321;
  // const startLat = 8.912335614848757;

  // // Chemical H107
  // const goalLat = 8.912358256558074;
  // const goalLng = 76.631575599956975;

  // Chemical H108
   const startLng  = 76.631659574002342;
   const startLat =  8.912329812248661;

  // Chemical H107
 const goalLat = 8.912358256558074;
 const goalLng = 76.631575599956975;

  const start = findNearestNode(graph, startLat, startLng);
  const goal = findNearestNode(graph, goalLat, goalLng);

  console.log("Nearest Start:", start);
  console.log("Nearest Goal:", goal);

  const path = aStar(graph, start, goal);

  console.log("Shortest Path:");
  console.log(path);

  return path;
}