export function buildGraph(geojson) {
  const graph = {};

  geojson.features.forEach((feature) => {
    if (feature.geometry.type !== "LineString") return;

    const coords = feature.geometry.coordinates;

    for (let i = 0; i < coords.length - 1; i++) {
      const a = coords[i];
      const b = coords[i + 1];

      const nodeA = `${a[1].toFixed(7)},${a[0].toFixed(7)}`;
      const nodeB = `${b[1].toFixed(7)},${b[0].toFixed(7)}`;

      const distance = Math.sqrt(
        (a[0] - b[0]) ** 2 +
        (a[1] - b[1]) ** 2
      );

      if (!graph[nodeA]) graph[nodeA] = [];
      if (!graph[nodeB]) graph[nodeB] = [];

      // Avoid duplicate edges
      if (!graph[nodeA].some(edge => edge.node === nodeB)) {
        graph[nodeA].push({
          node: nodeB,
          cost: distance,
        });
      }

      if (!graph[nodeB].some(edge => edge.node === nodeA)) {
        graph[nodeB].push({
          node: nodeA,
          cost: distance,
        });
      }
    }
  });

  return graph;
}