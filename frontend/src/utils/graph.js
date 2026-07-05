export function buildGraph(geojson) {
  const graph = {};

  geojson.features.forEach((feature) => {
    const coords = feature.geometry.coordinates;

    for (let i = 0; i < coords.length - 1; i++) {
      const a = coords[i];
      const b = coords[i + 1];

      const nodeA = `${a[1]},${a[0]}`;
      const nodeB = `${b[1]},${b[0]}`;

      const distance = Math.sqrt(
        Math.pow(a[0] - b[0], 2) +
        Math.pow(a[1] - b[1], 2)
      );

      if (!graph[nodeA]) graph[nodeA] = [];
      if (!graph[nodeB]) graph[nodeB] = [];

      graph[nodeA].push({
        node: nodeB,
        cost: distance,
      });

      graph[nodeB].push({
        node: nodeA,
        cost: distance,
      });
    }
  });

  return graph;
}