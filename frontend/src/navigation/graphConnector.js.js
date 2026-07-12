import { findNearestNode } from "./findNearestNode";

export async function connectFloorTransitions(graph) {
  const [gfResponse, ffResponse] = await Promise.all([
    fetch("/data/stairs.geojson"),
    fetch("/data/stairs_ff.geojson"),
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

    console.log(
      stair.properties.id,
      "→",
      nearestNode
    );
  });

  console.log("=======================================");

  return graph;
}