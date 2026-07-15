let graphs = {
  outdoor: null,
  groundFloor: null,
  firstFloor: null,
};

export function setGraphs(newGraphs) {
  graphs = newGraphs;
}

export function getGraphs() {
  return graphs;
}

export function getOutdoorGraph() {
  return graphs.outdoor;
}

export function getGroundFloorGraph() {
  return graphs.groundFloor;
}

export function getFirstFloorGraph() {
  return graphs.firstFloor;
}