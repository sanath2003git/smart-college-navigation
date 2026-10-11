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

/**
 * Finds the nearest graph node to a GeoJSON feature (Point, Polygon, or MultiPolygon).
 * Handles room polygons and point transitions by measuring minimum distance to the
 * feature vertices and centroid, properly connecting corridor nodes to room boundaries.
 */
export function findGoalNodeForFeature(graph, feature, floor = null) {
  if (!graph || !feature || !feature.geometry) {
    return null;
  }

  const { type, coordinates } = feature.geometry;
  if (!coordinates) {
    return null;
  }

  if (type === "Point") {
    const [lng, lat] = coordinates;
    return findNearestNode(graph, Number(lat), Number(lng), floor);
  }

  const points = [];

  if (type === "Polygon") {
    if (Array.isArray(coordinates[0])) {
      coordinates[0].forEach((pt) => {
        if (Array.isArray(pt) && pt.length >= 2) {
          points.push({ lng: Number(pt[0]), lat: Number(pt[1]) });
        }
      });
    }
  } else if (type === "MultiPolygon") {
    coordinates.forEach((poly) => {
      if (Array.isArray(poly) && Array.isArray(poly[0])) {
        poly[0].forEach((pt) => {
          if (Array.isArray(pt) && pt.length >= 2) {
            points.push({ lng: Number(pt[0]), lat: Number(pt[1]) });
          }
        });
      }
    });
  }

  if (points.length > 1) {
    let sumLat = 0;
    let sumLng = 0;
    points.forEach((p) => {
      sumLat += p.lat;
      sumLng += p.lng;
    });
    points.push({
      lat: sumLat / points.length,
      lng: sumLng / points.length,
    });
  }

  if (points.length === 0) {
    return null;
  }

  let nearestNodeId = null;
  let minDistance = Infinity;

  Object.entries(graph).forEach(([nodeId, node]) => {
    if (floor !== null && node.floor !== floor) {
      return;
    }

    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      const dist = (node.lat - pt.lat) ** 2 + (node.lng - pt.lng) ** 2;
      if (dist < minDistance) {
        minDistance = dist;
        nearestNodeId = nodeId;
      }
    }
  });

  return nearestNodeId;
}