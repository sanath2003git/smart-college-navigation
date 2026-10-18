/**
 * 3D Building Configuration for SmartNav MapLibre Outdoor Map
 *
 * Decoupled from GeoJSON source datasets and indoor floor routing configurations.
 * All building heights are visual estimates for 3D extrusion representation, NOT surveyed architectural data.
 */
export const BUILDING_3D_CONFIG = {
  "Mechanical Block": {
    id: 1,
    name: "Mechanical Block",
    // Visual estimate (~4 stories x 3.6m + 1.2m parapet). Not surveyed.
    height: 15.6,
    baseHeight: 0,
    wallColor: "#5A948B",
    roofColor: "#82B8AE",
    hoverColor: "#0E4F63",
    description: "Visual estimate (~4 stories x 3.6m + 1.2m parapet)",
  },
};

/**
 * Helper to retrieve 3D configuration by building name.
 */
export function getBuilding3DConfig(buildingName) {
  if (!buildingName) return null;
  return BUILDING_3D_CONFIG[buildingName] || null;
}
