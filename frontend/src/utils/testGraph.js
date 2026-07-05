import { aStar } from "../algorithms/astar";

export function testGraph(graph) {
  const nodes = Object.keys(graph);

  console.log("TOTAL NODES:", nodes.length);

  nodes.forEach((node) => {
    console.log(node, "→", graph[node]);
  });

  if (nodes.length < 2) return;

  const start = nodes[0];
  const goal = nodes[nodes.length - 1];

  console.log("Start:", start);
  console.log("Goal:", goal);

  const path = aStar(graph, start, goal);

  console.log("Shortest Path:");
  console.log(path);
}