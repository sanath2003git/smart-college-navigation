import { getOutdoorGraph } from "../navigation/graphManager";
import { loadGraphs } from "../navigation/loadGraphs";
import { navigate } from "../navigation/navigationRouter";
import { NAVIGATION_STAGE } from "../constants/navigationStages";
import { findNearestNode } from "../navigation/findNearestNode";
import { aStar } from "../navigation/astar";
import { findRooms } from "./roomService";
import { findStairById } from "./stairService";
import { selectBestTransition } from "../navigation/transitionSelector";
import { getBuildingFromRoom } from "./buildingRoomLookup";
import { getVenueById } from "../data/campusVenues";

/**
 * Validates and starts navigation to a campus venue (indoor room or outdoor facility).
 *
 * Reuses SmartNav's existing NavigationContext, outdoor A* walkway routing,
 * indoor room routing, building entrance detection, and voice guidance.
 *
 * @param {Object|string} venueOrId - Venue object or venue ID string
 * @param {Object} navContext - Value from useNavigation() hook
 * @param {Function} routerNavigate - React Router navigate function
 * @param {Object} [options] - Additional optional parameters (e.g. fallbackLocation)
 * @returns {Promise<{ success: boolean, error?: string, message?: string }>}
 */
export async function startNavigationToVenue(
  venueOrId,
  navContext,
  routerNavigate,
  options = {}
) {
  // 1. Resolve venue
  const venue =
    typeof venueOrId === "string" ? getVenueById(venueOrId) : venueOrId;

  if (!venue || !venue.coordinates) {
    const errorMsg = "Venue information is not available for this event.";
    console.error("[VenueNavigation] Invalid venue:", venueOrId);
    alert(errorMsg);
    return { success: false, error: "INVALID_VENUE", message: errorMsg };
  }

  // 2. Resolve user current location
  const currentLocation =
    navContext?.currentLocation || options.fallbackLocation || null;

  if (
    !currentLocation ||
    typeof currentLocation.lat !== "number" ||
    typeof currentLocation.lng !== "number"
  ) {
    const errorMsg =
      "Waiting for your current GPS location. Please ensure location services are enabled.";
    console.warn("[VenueNavigation] Current location not available:", currentLocation);
    alert(errorMsg);
    return { success: false, error: "NO_LOCATION", message: errorMsg };
  }

  const { lat: currentLat, lng: currentLng } = currentLocation;

  // 3. Ensure navigation graphs are loaded
  let outdoorGraph = getOutdoorGraph();
  if (!outdoorGraph) {
    try {
      console.log("[VenueNavigation] Outdoor graph not loaded yet. Loading graphs...");
      const loaded = await loadGraphs();
      outdoorGraph = loaded?.outdoor || getOutdoorGraph();
    } catch (err) {
      console.error("[VenueNavigation] Failed to load navigation graphs:", err);
      const errorMsg = "Unable to load campus walkway map for navigation.";
      alert(errorMsg);
      return { success: false, error: "GRAPH_LOAD_FAILED", message: errorMsg };
    }
  }

  if (!outdoorGraph || Object.keys(outdoorGraph).length === 0) {
    const errorMsg = "Campus navigation graph is unavailable.";
    alert(errorMsg);
    return { success: false, error: "GRAPH_UNAVAILABLE", message: errorMsg };
  }

  // 4. Clear prior navigation targets
  navContext.setRoute([]);
  navContext.setTargetEntrance(null);
  navContext.setTargetStair(null);

  // -------------------------------------------------------------
  // BRANCH A: Indoor Room Venue (e.g. M108, M203, H102)
  // -------------------------------------------------------------
  const isIndoorRoom = Boolean(
    venue.roomNo &&
      (venue.hasIndoorMap ||
        venue.building === "Mechanical Block" ||
        venue.building === "Chemical Block")
  );

  if (isIndoorRoom) {
    const destinationBuilding =
      venue.building || getBuildingFromRoom(venue.roomNo);

    if (!destinationBuilding) {
      const errorMsg = `Unable to determine building for room ${venue.roomNo}.`;
      alert(errorMsg);
      return { success: false, error: "BUILDING_NOT_FOUND", message: errorMsg };
    }

    // Locate the actual room GeoJSON feature
    let rooms = [];
    try {
      rooms = await findRooms(destinationBuilding, venue.roomNo);
    } catch (err) {
      console.error("[VenueNavigation] Error finding room:", err);
    }

    if (!rooms || rooms.length === 0) {
      const errorMsg = `Room ${venue.roomNo} was not found in the ${destinationBuilding} building plan.`;
      alert(errorMsg);
      return { success: false, error: "ROOM_NOT_FOUND", message: errorMsg };
    }

    const destinationFeature = rooms[0];
    const destinationFloor =
      destinationFeature.properties?.floor ??
      destinationFeature.properties?.level ??
      venue.floor ??
      0;

    const sameBuilding = navContext.currentBuilding === destinationBuilding;
    const alreadyOnGroundFloor =
      navContext.navigationStage === NAVIGATION_STAGE.GROUND_FLOOR;

    // Sub-case A1: Inside same building GF → GF
    if (sameBuilding && alreadyOnGroundFloor && destinationFloor === 0) {
      console.log("[VenueNavigation] Routing mode: SAME BUILDING GF -> GF");
      const result = await navigate({
        stage: NAVIGATION_STAGE.GROUND_FLOOR,
        start: { lat: currentLat, lng: currentLng },
        destination: destinationFeature,
        building: destinationBuilding,
      });

      if (!result || !result.route || result.route.length === 0) {
        const errorMsg = `Unable to calculate indoor route to ${venue.name}.`;
        alert(errorMsg);
        return { success: false, error: "NO_INDOOR_ROUTE", message: errorMsg };
      }

      navContext.setRoute(result.route);
      navContext.setDestination(destinationFeature);
      navContext.setSelectedBuilding(destinationBuilding);
      navContext.setNavigationStage(NAVIGATION_STAGE.GROUND_FLOOR);
      navContext.setTargetEntrance(null);
      navContext.setTargetStair(null);

      const buildingRoute =
        destinationBuilding === "Mechanical Block" ? "/mechanical" : "/chemical";
      if (typeof routerNavigate === "function") {
        routerNavigate(buildingRoute);
      }
      return { success: true };
    }

    // Sub-case A2: Inside same building GF → First Floor (e.g. M203)
    if (sameBuilding && alreadyOnGroundFloor && destinationFloor === 1) {
      console.log("[VenueNavigation] Routing mode: SAME BUILDING GF -> FF");
      const transition = await selectBestTransition({
        building: destinationBuilding,
        currentFloor: navContext.currentFloor ?? 0,
        destinationFloor,
        start: { lat: currentLat, lng: currentLng },
      });

      if (!transition || !transition.id) {
        const errorMsg = "No floor transition is available for this destination.";
        alert(errorMsg);
        return { success: false, error: "NO_TRANSITION", message: errorMsg };
      }

      const preparedTargetStair = await findStairById(transition.id);
      if (!preparedTargetStair) {
        const errorMsg = "Unable to find the floor transition.";
        alert(errorMsg);
        return { success: false, error: "STAIR_NOT_FOUND", message: errorMsg };
      }

      navContext.setDestination(destinationFeature);
      navContext.setSelectedBuilding(destinationBuilding);
      navContext.setTargetEntrance(null);

      const result = await navigate({
        stage: NAVIGATION_STAGE.GROUND_FLOOR,
        start: { lat: currentLat, lng: currentLng },
        stairId: transition.id,
        transitionCandidates: transition.candidates,
        transitionStrategy: transition.strategy,
        building: destinationBuilding,
      });

      if (!result || !result.route || result.route.length === 0) {
        const errorMsg = "Unable to calculate route to the floor transition.";
        alert(errorMsg);
        return { success: false, error: "NO_STAIR_ROUTE", message: errorMsg };
      }

      if (result.selectedTransition) {
        navContext.setTargetStair(result.selectedTransition);
      }
      navContext.setRoute(result.route);
      navContext.setNavigationStage(NAVIGATION_STAGE.GROUND_FLOOR);

      const buildingRoute =
        destinationBuilding === "Mechanical Block" ? "/mechanical" : "/chemical";
      if (typeof routerNavigate === "function") {
        routerNavigate(buildingRoute);
      }
      return { success: true };
    }

    // Sub-case A3: Standard Outdoor → Entrance Flow (starts on Campus Map)
    console.log("[VenueNavigation] Routing mode: OUTDOOR -> ENTRANCE -> INDOOR");
    navContext.setCurrentFloor(0);
    navContext.setNavigationStage(NAVIGATION_STAGE.OUTDOOR);

    const result = await navigate({
      stage: NAVIGATION_STAGE.OUTDOOR,
      start: { lat: currentLat, lng: currentLng },
      destination: venue.roomNo,
    });

    if (!result || !result.route || result.route.length === 0) {
      const errorMsg = `Unable to calculate route to ${venue.name} (${destinationBuilding}).`;
      alert(errorMsg);
      return { success: false, error: "NO_OUTDOOR_ROUTE", message: errorMsg };
    }

    navContext.setRoute(result.route);
    navContext.setDestination(result.destination || destinationFeature);
    navContext.setTargetEntrance(result.entrance);
    navContext.setSelectedBuilding(destinationBuilding);

    if (typeof routerNavigate === "function") {
      routerNavigate("/");
    }
    return { success: true };
  }

  // -------------------------------------------------------------
  // BRANCH B: Standalone Building or Outdoor Venue
  // (e.g. Auditorium, Sports Ground, Central Library, APJ Park)
  // -------------------------------------------------------------
  console.log("[VenueNavigation] Routing mode: OUTDOOR VENUE WALKWAY ROUTING");

  const startNode = findNearestNode(
    outdoorGraph,
    currentLat,
    currentLng
  );

  const goalNode = findNearestNode(
    outdoorGraph,
    venue.coordinates.lat,
    venue.coordinates.lng
  );

  if (!startNode || !goalNode) {
    const errorMsg =
      "Unable to locate navigation points on the campus walkway map.";
    alert(errorMsg);
    return { success: false, error: "NODE_NOT_FOUND", message: errorMsg };
  }

  const route = aStar(outdoorGraph, startNode, goalNode);

  if (!route || route.length === 0) {
    const errorMsg = `No walking path found between your location and ${venue.name}.`;
    alert(errorMsg);
    return { success: false, error: "NO_WALK_ROUTE", message: errorMsg };
  }

  const destinationFeature = {
    type: "Feature",
    properties: {
      id: venue.id,
      name: venue.name,
      building: venue.building,
      floor: 0,
      category: venue.category,
      landmark: venue.landmark,
      directions: venue.directions,
      isOutdoorVenue: true,
      hasIndoorMap: false,
    },
    geometry: {
      type: "Point",
      coordinates: [venue.coordinates.lng, venue.coordinates.lat],
    },
  };

  navContext.setRoute(route);
  navContext.setDestination(destinationFeature);
  navContext.setTargetEntrance(null);
  navContext.setTargetStair(null);
  navContext.setSelectedBuilding(venue.building);
  navContext.setCurrentFloor(0);
  navContext.setNavigationStage(NAVIGATION_STAGE.OUTDOOR);

  if (typeof routerNavigate === "function") {
    routerNavigate("/");
  }

  return { success: true };
}
