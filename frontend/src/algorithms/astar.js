function heuristic(a, b) {
  const [lat1, lng1] = a.split(",").map(Number);
  const [lat2, lng2] = b.split(",").map(Number);

  return Math.sqrt(
    Math.pow(lat1 - lat2, 2) +
    Math.pow(lng1 - lng2, 2)
  );
}

export function aStar(graph, start, goal) {
  const openSet = [start];

  const cameFrom = {};

  const gScore = {};
  const fScore = {};

  Object.keys(graph).forEach((node) => {
    gScore[node] = Infinity;
    fScore[node] = Infinity;
  });

  gScore[start] = 0;
  fScore[start] = heuristic(start, goal);

  while (openSet.length > 0) {

    let current = openSet.reduce((best, node) =>
      fScore[node] < fScore[best] ? node : best
    );

    if (current === goal) {
      const path = [current];

      while (cameFrom[current]) {
        current = cameFrom[current];
        path.unshift(current);
      }

      return path;
    }

    openSet.splice(openSet.indexOf(current), 1);

    graph[current].forEach((neighbor) => {

      const tentative =
        gScore[current] + neighbor.cost;

      if (tentative < gScore[neighbor.node]) {

        cameFrom[neighbor.node] = current;

        gScore[neighbor.node] = tentative;

        fScore[neighbor.node] =
          tentative +
          heuristic(neighbor.node, goal);

        if (!openSet.includes(neighbor.node))
          openSet.push(neighbor.node);
      }
    });
  }

  return [];
}