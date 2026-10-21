/**
 * campusVenues.js
 *
 * Verified Campus Venue Registry for SmartNav EventMap Integration.
 *
 * Every venue is verified against SmartNav's actual geographic and indoor building datasets:
 * - buildings.geojson (Auditorium, Canteen, Central Library, Main Block)
 * - areas.geojson (Football & Cricket Ground, Basketball Court, Tennis Court, APJ Park)
 * - mechanical/ (Mechanical Block indoor rooms: M108, M203, M102)
 * - chemical/ (Chemical Block indoor rooms: H102)
 *
 * Coordinates are exact WGS84 centroids derived from the verified polygon geometries.
 */

export const CAMPUS_VENUES = [
  // ── AUDITORIUMS & COMMON HALLS ──────────────────────────────────
  {
    id: "venue-auditorium",
    name: "College Auditorium",
    category: "Auditorium",
    building: "Auditorium",
    floor: 0,
    roomNo: null,
    coordinates: {
      lat: 8.913771,
      lng: 76.632078,
    },
    landmark: "Central campus quadrangle, west of the Canteen",
    directions:
      "From the Main Gate, walk north along the central avenue for ~120m. The Auditorium is directly ahead on the left.",
    hasIndoorMap: false,
  },
  {
    id: "venue-canteen",
    name: "College Canteen & Open Quadrangle",
    category: "Common Facility",
    building: "Canteen",
    floor: 0,
    roomNo: null,
    coordinates: {
      lat: 8.913751,
      lng: 76.632469,
    },
    landmark: "Next to the Cooperative Store and Auditorium",
    directions:
      "From the Main Gate, walk north for ~100m. The Canteen complex is on your right adjacent to the quadrangle.",
    hasIndoorMap: false,
  },
  {
    id: "venue-library",
    name: "Central Library Reading Hall",
    category: "Common Facility",
    building: "Central Library",
    floor: 0,
    roomNo: null,
    coordinates: {
      lat: 8.91436,
      lng: 76.632862,
    },
    landmark: "East of Main Block, opposite the Workshop Block",
    directions:
      "Walk east from the Main Block along the library walkway. Enter the Central Library through the front entrance doors.",
    hasIndoorMap: false,
  },
  {
    id: "venue-main-block",
    name: "Main Block Council Chamber",
    category: "Administrative",
    building: "Main Block",
    floor: 0,
    roomNo: null,
    coordinates: {
      lat: 8.914166,
      lng: 76.632079,
    },
    landmark: "Main Administrative Block Ground Floor",
    directions:
      "Walk straight north from the Main Gate to the central administrative building. Enter through the front portico.",
    hasIndoorMap: false,
  },

  // ── INDOOR ROOMS & SEMINAR HALLS (MECHANICAL BLOCK) ───────────────
  {
    id: "venue-mech-m108",
    name: "CAD/CAM Seminar Hall (M108)",
    category: "Seminar Hall",
    building: "Mechanical Block",
    floor: 0,
    roomNo: "M108",
    coordinates: {
      lat: 8.912928,
      lng: 76.631978,
    },
    landmark: "Mechanical Block Ground Floor, North-East Corridor",
    directions:
      "Enter Mechanical Block through the main entrance. Follow the main corridor to the right; Room M108 is on the left corridor.",
    hasIndoorMap: true,
  },
  {
    id: "venue-mech-m203",
    name: "Mechanical Lecture Hall (M203)",
    category: "Classroom",
    building: "Mechanical Block",
    floor: 1,
    roomNo: "M203",
    coordinates: {
      lat: 8.912698,
      lng: 76.631719,
    },
    landmark: "Mechanical Block First Floor, near Main Staircase",
    directions:
      "Enter Mechanical Block, take the central stairs to the First Floor. Turn left into the main corridor; M203 is on your right.",
    hasIndoorMap: true,
  },
  {
    id: "venue-mech-m102",
    name: "Heat Engines Laboratory (M102)",
    category: "Lab",
    building: "Mechanical Block",
    floor: 0,
    roomNo: "M102",
    coordinates: {
      lat: 8.912674,
      lng: 76.631765,
    },
    landmark: "Mechanical Block Ground Floor, South Wing",
    directions:
      "Enter Mechanical Block main entrance and proceed south along the ground floor corridor. Heat Engines Lab is on the left.",
    hasIndoorMap: true,
  },

  // ── INDOOR ROOMS (CHEMICAL BLOCK) ─────────────────────────────────
  {
    id: "venue-chem-h102",
    name: "Chemical Seminar Room (H102)",
    category: "Seminar Hall",
    building: "Chemical Block",
    floor: 0,
    roomNo: "H102",
    coordinates: {
      lat: 8.912584,
      lng: 76.631566,
    },
    landmark: "Chemical Block Ground Floor, central corridor",
    directions:
      "Enter Chemical Block via the front portico. H102 is adjacent to the main corridor opposite the central courtyard.",
    hasIndoorMap: true,
  },

  // ── SPORTS & OUTDOOR FACILITIES ───────────────────────────────────
  {
    id: "venue-sports-ground",
    name: "Football and Cricket Ground",
    category: "Sports Facility",
    building: "Football and Cricket Ground",
    floor: null,
    roomNo: null,
    coordinates: {
      lat: 8.912996,
      lng: 76.632785,
    },
    landmark: "Behind the hostel complex and eastern campus walkway",
    directions:
      "From the central campus, follow the walkway east past the workshop area directly to the main sports ground.",
    hasIndoorMap: false,
  },
  {
    id: "venue-basketball-court",
    name: "Campus Basketball Court",
    category: "Sports Facility",
    building: "Basketball Court",
    floor: null,
    roomNo: null,
    coordinates: {
      lat: 8.914358,
      lng: 76.632243,
    },
    landmark: "Adjacent to the Main Block eastern courtyard",
    directions:
      "Walk toward the Main Block; the basketball court is located on the eastern court open area.",
    hasIndoorMap: false,
  },
  {
    id: "venue-tennis-court",
    name: "Open Tennis Court",
    category: "Sports Facility",
    building: "Open Tennis Court",
    floor: null,
    roomNo: null,
    coordinates: {
      lat: 8.915284,
      lng: 76.632495,
    },
    landmark: "North campus sports zone near APJ Park",
    directions:
      "Proceed north past the Main Block toward APJ Park. The tennis court is located along the northern path.",
    hasIndoorMap: false,
  },
  {
    id: "venue-apj-park",
    name: "APJ Park Open-Air Arena",
    category: "Outdoor Area",
    building: "APJ Park",
    floor: null,
    roomNo: null,
    coordinates: {
      lat: 8.915362,
      lng: 76.632146,
    },
    landmark: "Northern end of campus near Volleyball and Tennis courts",
    directions:
      "Follow the main campus road north past the Main Block to the landscaped APJ Park open area.",
    hasIndoorMap: false,
  },
];

/**
 * Returns all campus venues.
 */
export function getVenues() {
  return CAMPUS_VENUES;
}

/**
 * Finds a campus venue by its unique ID.
 */
export function getVenueById(id) {
  if (!id) return null;
  return CAMPUS_VENUES.find((v) => v.id === id) || null;
}

/**
 * Finds all venues located in a specific building.
 */
export function getVenuesByBuilding(building) {
  if (!building) return [];
  const normalized = building.trim().toLowerCase();
  return CAMPUS_VENUES.filter(
    (v) => v.building && v.building.toLowerCase() === normalized
  );
}

/**
 * Searches venues by name, building, room number, or landmark.
 */
export function searchVenues(query) {
  if (!query || typeof query !== "string") return CAMPUS_VENUES;
  const q = query.trim().toLowerCase();
  if (!q) return CAMPUS_VENUES;

  return CAMPUS_VENUES.filter((v) => {
    return (
      v.name.toLowerCase().includes(q) ||
      (v.building && v.building.toLowerCase().includes(q)) ||
      (v.roomNo && v.roomNo.toLowerCase().includes(q)) ||
      (v.landmark && v.landmark.toLowerCase().includes(q)) ||
      (v.category && v.category.toLowerCase().includes(q))
    );
  });
}
// Small review-only change: keep this module within the approved campus project work.
