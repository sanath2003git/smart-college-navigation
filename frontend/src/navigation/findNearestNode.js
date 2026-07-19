export function findNearestNode(graph, lat, lng, floor = null) {
  let nearest = null;
  let minDistance = Infinity;

  Object.entries(graph).forEach(([nodeId, node]) => {
    // Ignore nodes from other floors
    if (floor !== null && node.floor !== floor) {
      return;
    }

    const distance =
      (node.lat - lat) ** 2 +
      (node.lng - lng) ** 2;

    if (distance < minDistance) {
      minDistance = distance;
      nearest = nodeId;
    }
  });

  return nearest;
}