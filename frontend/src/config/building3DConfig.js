/**
 * 3D Building Configuration for SmartNav MapLibre Outdoor Map
 *
 * Decoupled from GeoJSON source datasets and indoor floor routing configurations.
 * All building heights are visual estimates for 3D extrusion representation, NOT surveyed architectural data.
 *
 * Confirmed Height Rule:
 * 3D building height = number of identified floors * 5 metres.
 * Ground Floor (GF) counts as one floor. No separate roof or parapet allowance.
 */

export const HEIGHT_PER_FLOOR_METRES = 5;
export const DEFAULT_FALLBACK_FLOORS = 1;
export const DEFAULT_FALLBACK_HEIGHT_METRES = DEFAULT_FALLBACK_FLOORS * HEIGHT_PER_FLOOR_METRES; // 5m

/**
 * Calculate extrusion height from floor count using the standard 5m-per-floor rule.
 *
 * @param {number} floorCount - Total number of floors (including Ground Floor)
 * @returns {number} Extrusion height in metres
 */
export function calculateExtrusionHeight(floorCount) {
  if (typeof floorCount !== "number" || isNaN(floorCount) || floorCount < 0) {
    return DEFAULT_FALLBACK_HEIGHT_METRES;
  }
  return floorCount * HEIGHT_PER_FLOOR_METRES;
}

/**
 * 3D Building Configuration Dictionary.
 * Keys match source feature names in frontend/public/data/campus/buildings.geojson
 */
export const BUILDING_3D_CONFIG = {
  "Mechanical Block": {
    id: 1,
    name: "Mechanical Block",
    floorCount: 4,
    height: calculateExtrusionHeight(4), // 20m
    baseHeight: 0,
    wallColor: "#5A948B",
    roofColor: "#82B8AE",
    hoverColor: "#0E4F63",
    description: "Visual estimate (4 floors x 5m = 20m; verified from floor plans GF, FF, SF, TF)",
    sourceNote: "Verified from floor-plan datasets (GF, FF, SF, TF)",
  },
  "Chemical Block": {
    id: 2,
    name: "Chemical Block",
    floorCount: 4,
    height: calculateExtrusionHeight(4), // 20m
    baseHeight: 0,
    wallColor: "#4E8D84",
    roofColor: "#78B2A9",
    hoverColor: "#0E4F63",
    description: "Visual estimate (4 floors x 5m = 20m; verified from floor plans GF, FF, SF, TF)",
    sourceNote: "Verified from floor-plan datasets (GF, FF, SF, TF)",
  },
  "Main Block": {
    id: 7,
    name: "Main Block",
    floorCount: 3,
    height: calculateExtrusionHeight(3), // 15m
    baseHeight: 0,
    wallColor: "#618F95",
    roofColor: "#8EB6BC",
    hoverColor: "#0E4F63",
    description: "Visual estimate (3 floors x 5m = 15m; estimated from administrative complex data)",
    sourceNote: "Estimated height (3 floors x 5m = 15m)",
  },
  "Workshop Block": {
    id: 38,
    name: "Workshop Block",
    alias: "Workshop",
    floorCount: 3,
    height: calculateExtrusionHeight(3), // 15m
    baseHeight: 0,
    wallColor: "#5F948A",
    roofColor: "#88BCB2",
    hoverColor: "#0E4F63",
    description: "Visual estimate (3 floors x 5m = 15m; estimated from mechanical workshop facility)",
    sourceNote: "Estimated height (3 floors x 5m = 15m)",
  },
  "Architecture Block": {
    id: 5,
    name: "Architecture Block",
    floorCount: 4,
    height: calculateExtrusionHeight(4), // 20m
    baseHeight: 0,
    wallColor: "#569B91",
    roofColor: "#80C1B7",
    hoverColor: "#0E4F63",
    description: "Visual estimate (4 floors x 5m = 20m; 4 main floor levels excluding mezzanines)",
    sourceNote: "Estimated height (4 main floors x 5m = 20m; mezzanine levels excluded)",
  },
  "Central Library": {
    id: 8,
    name: "Central Library",
    alias: "Library",
    floorCount: 2,
    height: calculateExtrusionHeight(2), // 10m
    baseHeight: 0,
    wallColor: "#52867E",
    roofColor: "#79ABA3",
    hoverColor: "#0E4F63",
    description: "Visual estimate (2 floors x 5m = 10m; reading hall GF + stacks FF)",
    sourceNote: "Estimated height (2 floors x 5m = 10m)",
  },
  "Interdisciplinary Research Block (RUSA)": {
    id: 6,
    name: "Interdisciplinary Research Block (RUSA)",
    alias: "RUSA Block",
    floorCount: 3,
    height: calculateExtrusionHeight(3), // 15m (matched to Workshop Block height)
    baseHeight: 0,
    wallColor: "#5F948A",
    roofColor: "#88BCB2",
    hoverColor: "#0E4F63",
    description: "Visual estimate (3 floors x 5m = 15m; research facility)",
    sourceNote: "Estimated height (3 floors x 5m = 15m; matched to Workshop Block height)",
  },
  "Workshop (Electrical)": {
    id: 3,
    name: "Workshop (Electrical)",
    alias: "Electrical Workshop",
    floorCount: 4,
    height: calculateExtrusionHeight(4), // 20m (matched to Mechanical Block height)
    baseHeight: 0,
    wallColor: "#5A948B",
    roofColor: "#82B8AE",
    hoverColor: "#0E4F63",
    description: "Visual estimate (4 floors x 5m = 20m; electrical workshop facility)",
    sourceNote: "Estimated height (4 floors x 5m = 20m; matched to Mechanical Block height)",
  },
};

/**
 * Alias mapping to resolve alternative building names to configured keys.
 */
export const BUILDING_3D_ALIASES = {
  "Workshop": "Workshop Block",
  "Library": "Central Library",
  "RUSA Block": "Interdisciplinary Research Block (RUSA)",
  "Electrical Workshop": "Workshop (Electrical)",
};

/**
 * Fallback configuration for unconfigured buildings without dedicated floor data.
 */
export const DEFAULT_3D_BUILDING = {
  floorCount: DEFAULT_FALLBACK_FLOORS,
  height: DEFAULT_FALLBACK_HEIGHT_METRES, // 5m
  baseHeight: 0,
  wallColor: "#8CB8AF",
  roofColor: "#A9CEC6",
  hoverColor: "#0E4F63",
  description: "Default fallback (1 floor x 5m = 5m visual estimate)",
  sourceNote: "Fallback assumption (1 floor x 5m = 5m default)",
};

/**
 * Structures that explicitly remain 2D (0m height) due to being open-air ground surfaces.
 */
export const NON_EXTRUDED_SURFACES = [
  "Badminton Court",
];

/**
 * Helper to retrieve 3D configuration by building name (with alias support and fallback).
 *
 * @param {string} buildingName - Building name
 * @returns {object|null} Building 3D config
 */
export function getBuilding3DConfig(buildingName) {
  if (!buildingName) return null;

  const resolvedName = BUILDING_3D_ALIASES[buildingName] || buildingName;

  if (NON_EXTRUDED_SURFACES.includes(resolvedName)) {
    return {
      name: resolvedName,
      floorCount: 0,
      height: 0,
      baseHeight: 0,
      wallColor: "#A9CEC6",
      roofColor: "#A9CEC6",
      hoverColor: "#0E4F63",
      description: "Open-air ground surface (retained as 2D footprint, 0m height)",
      sourceNote: "Open-air sports court (floors: 0, 0m height)",
    };
  }

  if (BUILDING_3D_CONFIG[resolvedName]) {
    return BUILDING_3D_CONFIG[resolvedName];
  }

  return {
    ...DEFAULT_3D_BUILDING,
    name: buildingName,
  };
}

/**
 * Generates a MapLibre match expression for building extrusion heights.
 *
 * Target heights:
 * - Mechanical Block: 20m
 * - Chemical Block: 20m
 * - Architecture Block: 20m
 * - Main Block: 15m
 * - Workshop Block / Workshop: 15m
 * - Central Library / Library: 10m
 * - Non-extruded surfaces (Badminton Court): 0m
 * - All other unconfigured buildings: 5m fallback
 */
export function buildBuildingHeightExpression() {
  const matchArgs = ["match", ["get", "name"]];

  // Configured buildings
  Object.entries(BUILDING_3D_CONFIG).forEach(([name, config]) => {
    matchArgs.push(name, config.height);
    if (config.alias) {
      matchArgs.push(config.alias, config.height);
    }
  });

  // Non-extruded surfaces (height 0)
  NON_EXTRUDED_SURFACES.forEach((surfaceName) => {
    matchArgs.push(surfaceName, 0);
  });

  // Default fallback for any other building
  matchArgs.push(DEFAULT_FALLBACK_HEIGHT_METRES);

  return matchArgs;
}

/**
 * Generates a MapLibre expression for building extrusion wall colors,
 * dynamically highlighting the active/selected building if provided.
 *
 * @param {string|null} activeBuildingName - Currently selected/detected building name
 */
export function buildBuildingColorExpression(activeBuildingName = null) {
  const matchArgs = ["match", ["get", "name"]];

  Object.entries(BUILDING_3D_CONFIG).forEach(([name, config]) => {
    matchArgs.push(name, config.wallColor);
    if (config.alias) {
      matchArgs.push(config.alias, config.wallColor);
    }
  });

  // Default fallback wall color
  matchArgs.push(DEFAULT_3D_BUILDING.wallColor);

  if (activeBuildingName) {
    const resolvedActive = BUILDING_3D_ALIASES[activeBuildingName] || activeBuildingName;
    return [
      "case",
      [
        "any",
        ["==", ["get", "name"], activeBuildingName],
        ["==", ["get", "name"], resolvedActive],
      ],
      "#0E4F63", // Active highlight color
      matchArgs,
    ];
  }

  return matchArgs;
}
