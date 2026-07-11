export function findNearestNode(graph, lat, lng) {
  let nearest = null;
  let minDistance = Infinity;

  Object.keys(graph).forEach((node) => {
    const [nodeLat, nodeLng] = node.split(",").map(Number);

    const distance =
      (nodeLat - lat) ** 2 +
      (nodeLng - lng) ** 2;

    if (distance < minDistance) {
      minDistance = distance;
      nearest = node;
    }
  });

  return nearest;
}