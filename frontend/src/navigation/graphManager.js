let graphs = {
  outdoor: null,

  groundFloor: {},

  firstFloor: {},

  secondFloor: {},

  thirdFloor: {},
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

export function getGroundFloorGraph(building) {
  return graphs.groundFloor[building] ?? null;
}

export function getFirstFloorGraph(building) {
  return graphs.firstFloor[building] ?? null;
}

export function getSecondFloorGraph(building) {
  return graphs.secondFloor[building] ?? null;
}

export function getThirdFloorGraph(building) {
  return graphs.thirdFloor[building] ?? null;
}