export function nearestNode(graph, latlng) {
  let nearest = null;
  let shortest = Infinity;

  Object.keys(graph).forEach((node) => {
    const [lat, lng] = node.split(",").map(Number);

    const d = Math.sqrt(
      (lat - latlng.lat) ** 2 +
      (lng - latlng.lng) ** 2
    );

    if (d < shortest) {
      shortest = d;
      nearest = node;
    }
  });

  return nearest;
}