import { findNearestNode } from "./findNearestNode";

const stairGraphNodes = {};

export async function connectFloorTransitions(graph) {
  const [gfResponse, ffResponse] = await Promise.all([
    fetch("/data/chemical/ground_floor/stairs.geojson"),
    fetch("/data/chemical/first_floor/stairs.geojson"),
  ]);

  const gf = await gfResponse.json();
  const ff = await ffResponse.json();

  const stairs = [
    ...gf.features,
    ...ff.features,
  ];

  console.log("========== STAIR GRAPH NODES ==========");

  stairs.forEach((stair) => {
    const [lng, lat] = stair.geometry.coordinates;

    const nearestNode = findNearestNode(
      graph,
      lat,
      lng
    );

    stairGraphNodes[stair.properties.id] = nearestNode;

    console.log(
      stair.properties.id,
      "→",
      nearestNode
    );
  });

  console.log("=======================================");

  return graph;
}

export function findConnectedStairNode(stairId) {
  console.log("========== STAIR LOOKUP ==========");
  console.log("Requested Stair:", stairId);
  console.log("Available Stair Nodes:", stairGraphNodes);

  return stairGraphNodes[stairId] ?? null;
}