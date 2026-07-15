export function filterGraphByFloor(graph, floor) {
  const filtered = {};

  Object.entries(graph).forEach(([nodeId, node]) => {
    // Keep nodes that belong to this floor
    if (!node.floors.includes(floor)) return;

    filtered[nodeId] = {
      ...node,
      neighbors: node.neighbors.filter((neighbor) => {
        const target = graph[neighbor.node];

        if (!target) return false;

        return target.floors.includes(floor);
      }),
    };
  });

  return filtered;
}