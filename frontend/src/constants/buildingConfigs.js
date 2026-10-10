/**
 * Building configuration metadata derived from frontend/public/data/campus/buildings.geojson
 *
 * Each building has:
 * - center: [lat, lng]
 * - bounds: [[minLat, minLng], [maxLat, maxLng]] strictly bounding the viewing area
 *   with ~10m margin so the building is not clipped while preventing viewing neighboring buildings.
 * - zoom: default zoom level for building exploration
 * - minZoom: building-specific minimum zoom preventing zooming out to neighboring buildings or the wider campus
 * - maxZoom: maximum zoom level (up to 22) for close room inspection
 * - availableFloors: array of floor numbers mapped in GeoJSON datasets
 * - hasFloorData: boolean indicating whether indoor floor plans exist
 */
export const BUILDING_CONFIGS = {
  "Mechanical Block": {
    name: "Mechanical Block",
    route: "/mechanical",
    center: [8.912886, 76.631817],
    bounds: [
      [8.912476, 76.631443],
      [8.913296, 76.632191],
    ],
    zoom: 19.5,
    minZoom: 19,
    maxZoom: 22,
    availableFloors: [0, 1, 2, 3],
    defaultFloor: 0,
    hasFloorData: true,
  },
  "Chemical Block": {
    name: "Chemical Block",
    route: "/chemical",
    center: [8.912439, 76.63167],
    bounds: [
      [8.912115, 76.631324],
      [8.912763, 76.632017],
    ],
    zoom: 20,
    minZoom: 19.5,
    maxZoom: 22,
    availableFloors: [0, 1],
    defaultFloor: 0,
    hasFloorData: true,
  },
  "Main Block": {
    name: "Main Block",
    route: "/main",
    center: [8.91412, 76.632101],
    bounds: [
      [8.913163, 76.63156],
      [8.915077, 76.632642],
    ],
    zoom: 18.5,
    minZoom: 18,
    maxZoom: 22,
    availableFloors: [],
    defaultFloor: 0,
    hasFloorData: false,
  },
  "Central Library": {
    name: "Central Library",
    route: "/library",
    center: [8.91435, 76.632936],
    bounds: [
      [8.91415, 76.632688],
      [8.914551, 76.633184],
    ],
    zoom: 20.5,
    minZoom: 20,
    maxZoom: 22,
    availableFloors: [],
    defaultFloor: 0,
    hasFloorData: false,
  },
  "Workshop Block": {
    name: "Workshop Block",
    route: "/workshop",
    center: [8.913766, 76.632987],
    bounds: [
      [8.913381, 76.632609],
      [8.91415, 76.633365],
    ],
    zoom: 19.5,
    minZoom: 19,
    maxZoom: 22,
    availableFloors: [],
    defaultFloor: 0,
    hasFloorData: false,
  },
  "Workshop (Electrical)": {
    name: "Workshop (Electrical)",
    route: "/electrical-workshop",
    center: [8.912939, 76.632135],
    bounds: [
      [8.912718, 76.631933],
      [8.91316, 76.632337],
    ],
    zoom: 20.5,
    minZoom: 20,
    maxZoom: 22,
    availableFloors: [],
    defaultFloor: 0,
    hasFloorData: false,
  },
  "Architecture Block": {
    name: "Architecture Block",
    route: "/architecture",
    center: [8.913343, 76.63227],
    bounds: [
      [8.912963, 76.632028],
      [8.913722, 76.632512],
    ],
    zoom: 19.5,
    minZoom: 19,
    maxZoom: 22,
    availableFloors: [],
    defaultFloor: 0,
    hasFloorData: false,
  },
  "Interdisciplinary Research Block (RUSA)": {
    name: "Interdisciplinary Research Block (RUSA)",
    route: "/research",
    center: [8.9135, 76.633049],
    bounds: [
      [8.913319, 76.632821],
      [8.913681, 76.633277],
    ],
    zoom: 20.5,
    minZoom: 20,
    maxZoom: 22,
    availableFloors: [],
    defaultFloor: 0,
    hasFloorData: false,
  },
};
