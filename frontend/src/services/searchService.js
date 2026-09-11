const DATA_BASE = "/data";

/**
 * Chemical Block
 * Ground Floor + First Floor
 */
const CHEMICAL_FLOORS = [
  "ground_floor",
  "first_floor",
];

/**
 * Mechanical Block
 * Ground, First, Second and Top floors
 */
const MECHANICAL_FLOORS = [
  "ground_floor",
  "first_floor",
  "second_floor",
  "top_floor",
];

/**
 * Map internal floor folder names to user-friendly labels.
 */
const FLOOR_LABELS = {
  ground_floor: "Ground Floor",
  first_floor: "First Floor",
  second_floor: "Second Floor",
  top_floor: "Top Floor",
};

/**
 * Structural features that should not appear
 * as searchable destinations.
 */
const EXCLUDED_CATEGORIES = new Set([
  "corridor",
  "stair",
  "stairs",
  "staircase",
  "ramp",
  "path",
  "walkway",
  "door",
  "entrance",
  "courtyard",
]);

const EXCLUDED_NAME_KEYWORDS = [
  "corridor",
  "staircase",
  "stair",
  "ramp",
  "walkway",
  "entrance",
  "courtyard",
];

const BUILDINGS = [
  {
    id: "mechanical",
    name: "Mechanical Block",
    path: "mechanical",
    floors: MECHANICAL_FLOORS,
  },
  {
    id: "chemical",
    name: "Chemical Block",
    path: "chemical",
    floors: CHEMICAL_FLOORS,
  },
];

/**
 * Safely convert a value to a searchable string.
 */
function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

/**
 * Check whether a feature represents a structural
 * element rather than an actual destination.
 */
function isExcludedFeature(
  name,
  category
) {
  const normalizedName =
    normalizeText(name);

  const normalizedCategory =
    normalizeText(category);

  if (
    EXCLUDED_CATEGORIES.has(
      normalizedCategory
    )
  ) {
    return true;
  }

  return EXCLUDED_NAME_KEYWORDS.some(
    (keyword) =>
      normalizedName.includes(keyword)
  );
}

/**
 * Normalize a room feature into one common format.
 *
 * This handles both:
 *
 * Mechanical:
 *   name
 *   category
 *
 * Chemical:
 *   name / room_name
 *   category / type
 */
function normalizeRoomFeature(
  feature,
  building,
  floorFolder
) {
  const properties =
    feature?.properties ?? {};

  const roomNo = String(
    properties.room_no ?? ""
  ).trim();

  const name = String(
    properties.name ??
      properties.room_name ??
      ""
  ).trim();

  const category = String(
    properties.category ??
      properties.type ??
      ""
  ).trim();

  if (!roomNo && !name) {
    return null;
  }

  /**
   * Remove structural features such as:
   * corridors, stairs, ramps, etc.
   */
  if (
    isExcludedFeature(
      name,
      category
    )
  ) {
    return null;
  }

  /**
   * IMPORTANT:
   *
   * Do not use properties.id here.
   *
   * Some GeoJSON files reuse IDs between floors.
   * The generated ID must therefore include:
   *
   * building + floor + room number
   */
  const generatedId =
    `${building.id}-${floorFolder}-${roomNo || name}`;

  return {
    id: generatedId,

    type: "room",

    roomNo,
    name,
    category,

    building: String(
      properties.building ??
        building.name
    ).trim(),

    floor:
      properties.floor ?? null,

    floorLabel:
      FLOOR_LABELS[floorFolder] ??
      String(
        properties.floor ?? ""
      ),

    department: String(
      properties.department ?? ""
    ).trim(),

    accessible:
      properties.accessible ?? null,

    remarks: String(
      properties.remarks ?? ""
    ).trim(),

    coordinates:
      feature.geometry?.coordinates ??
      null,
  };
}

/**
 * Load one room GeoJSON file.
 */
async function loadRooms(
  building,
  floorFolder
) {
  const url =
    `${DATA_BASE}/${building.path}` +
    `/${floorFolder}/rooms.geojson`;

  const response =
    await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to load ${url}`
    );
  }

  const geojson =
    await response.json();

  return (
    geojson.features ?? []
  )
    .map((feature) =>
      normalizeRoomFeature(
        feature,
        building,
        floorFolder
      )
    )
    .filter(Boolean);
}

/**
 * Load all searchable destinations.
 *
 * Results are cached so we don't repeatedly
 * download the same GeoJSON files while the
 * user is typing.
 */
let destinationsPromise =
  null;

export async function loadDestinations() {
  if (!destinationsPromise) {
    destinationsPromise =
      Promise.all(
        BUILDINGS.flatMap(
          (building) =>
            building.floors.map(
              (floorFolder) =>
                loadRooms(
                  building,
                  floorFolder
                )
            )
        )
      ).then((results) =>
        results.flat()
      );
  }

  return destinationsPromise;
}

/**
 * Search destinations.
 *
 * Matches against:
 *   - room number
 *   - room name
 *   - category
 *   - department
 *   - building
 *
 * Example:
 *
 * searchDestinations("M2")
 * searchDestinations("Lab")
 * searchDestinations("Faculty")
 */
export async function searchDestinations(
  query,
  options = {}
) {
  const searchQuery =
    normalizeText(query);

  if (!searchQuery) {
    return [];
  }

  const {
    limit = 10,
  } = options;

  const destinations =
    await loadDestinations();

  const matches =
    destinations
      .filter((destination) => {
        const searchableFields = [
          destination.roomNo,
          destination.name,
          destination.category,
          destination.department,
          destination.building,
        ];

        return searchableFields.some(
          (field) =>
            normalizeText(
              field
            ).includes(searchQuery)
        );
      })
      .sort(
        (a, b) =>
          getMatchScore(
            b,
            searchQuery
          ) -
          getMatchScore(
            a,
            searchQuery
          )
      );

  return matches.slice(
    0,
    limit
  );
}

/**
 * Rank better matches first.
 */
function getMatchScore(
  destination,
  query
) {
  const roomNo =
    normalizeText(
      destination.roomNo
    );

  const name =
    normalizeText(
      destination.name
    );

  const category =
    normalizeText(
      destination.category
    );

  const department =
    normalizeText(
      destination.department
    );

  const building =
    normalizeText(
      destination.building
    );

  /**
   * Exact room number
   *
   * M201 → M201
   */
  if (roomNo === query) {
    return 100;
  }

  /**
   * Room number starts with query
   *
   * M2 → M201, M202, M203...
   */
  if (
    roomNo.startsWith(query)
  ) {
    return 90;
  }

  /**
   * Room name starts with query
   */
  if (
    name.startsWith(query)
  ) {
    return 80;
  }

  /**
   * Category starts with query
   */
  if (
    category.startsWith(query)
  ) {
    return 70;
  }

  /**
   * Department starts with query
   */
  if (
    department.startsWith(query)
  ) {
    return 65;
  }

  /**
   * Building starts with query
   */
  if (
    building.startsWith(query)
  ) {
    return 60;
  }

  /**
   * Partial room number
   */
  if (
    roomNo.includes(query)
  ) {
    return 50;
  }

  /**
   * Partial room name
   */
  if (
    name.includes(query)
  ) {
    return 40;
  }

  /**
   * Partial category
   */
  if (
    category.includes(query)
  ) {
    return 30;
  }

  /**
   * Partial department
   */
  if (
    department.includes(query)
  ) {
    return 25;
  }

  return 10;
}