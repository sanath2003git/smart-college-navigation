export function getFloorFolder(building, floor) {
  const buildingMap = {
    "Chemical Block": "chemical",
    "Mechanical Block": "mechanical",
  };

  const floorMap = {
  0: "ground_floor",
  1: "first_floor",
  2: "second_floor",
  3: "top_floor",
};

  return `/data/${buildingMap[building]}/${floorMap[floor]}`;
}

export function getRoomsPath(building, floor) {
  return `${getFloorFolder(building, floor)}/doors.geojson`;
}

export function getStairsPath(building, floor) {
  return `${getFloorFolder(building, floor)}/stairs.geojson`;
}

export function getPathsPath(building, floor) {
  return `${getFloorFolder(building, floor)}/paths.geojson`;
}

export function getFloorRoomsPath(building, floor) {
  return `${getFloorFolder(building, floor)}/rooms.geojson`;
}