export function buildGraph(geojson) {
  const graph = {};

  geojson.features.forEach((feature) => {
    if (feature.geometry.type !== "LineString") return;

    const coords = feature.geometry.coordinates;

    // Floor metadata
    const floor =
      feature.properties?.floor ??
      feature.properties?.level ??
      0;

    for (let i = 0; i < coords.length - 1; i++) {
      const a = coords[i];
      const b = coords[i + 1];

      const nodeA = `${a[1].toFixed(7)},${a[0].toFixed(7)}`;
      const nodeB = `${b[1].toFixed(7)},${b[0].toFixed(7)}`;

      const distance = Math.sqrt(
        (a[0] - b[0]) ** 2 +
        (a[1] - b[1]) ** 2
      );

      // --------------------
      // Create node objects
      // --------------------

      if (!graph[nodeA]) {
        graph[nodeA] = {
          lat: a[1],
          lng: a[0],
          floor,
          neighbors: [],
        };
      }

      if (!graph[nodeB]) {
        graph[nodeB] = {
          lat: b[1],
          lng: b[0],
          floor,
          neighbors: [],
        };
      }

      // --------------------
      // Add neighbors
      // --------------------

      if (
        !graph[nodeA].neighbors.some(
          (edge) => edge.node === nodeB
        )
      ) {
        graph[nodeA].neighbors.push({
          node: nodeB,
          cost: distance,
        });
      }

      if (
        !graph[nodeB].neighbors.some(
          (edge) => edge.node === nodeA
        )
      ) {
        graph[nodeB].neighbors.push({
          node: nodeA,
          cost: distance,
        });
      }
    }
  });

  return graph;
}