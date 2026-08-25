import { BUILDING_CONFIG } from "../config/buildingConfig";

export function getFloorFolder(building, floor) {
  const buildingConfig = BUILDING_CONFIG[building];

  if (!buildingConfig) {
    throw new Error(`Unknown building: ${building}`);
  }

  const floorConfig = buildingConfig.floors[floor];

  if (!floorConfig) {
    throw new Error(
      `Unknown floor ${floor} for building: ${building}`
    );
  }

  return `/data/${buildingConfig.dataFolder}/${floorConfig.folder}`;
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