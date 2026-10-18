import { NAVIGATION_STAGE } from "../constants/navigationStages.js";

/**
 * Calculates great-circle distance between two WGS84 points in meters.
 */
export function distanceInMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Calculates initial bearing (azimuth) from point 1 to point 2 in degrees [0, 360).
 */
export function calculateBearing(lat1, lng1, lat2, lng2) {
  const toRad = Math.PI / 180;
  const toDeg = 180 / Math.PI;
  const phi1 = lat1 * toRad;
  const phi2 = lat2 * toRad;
  const deltaLambda = (lng2 - lng1) * toRad;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  const theta = Math.atan2(y, x) * toDeg;
  return (theta + 360) % 360;
}

/**
 * Calculates relative turn angle between two headings in degrees [-180, 180].
 * Negative = Left turn, Positive = Right turn.
 */
export function calculateTurnAngle(bearing1, bearing2) {
  return ((bearing2 - bearing1 + 540) % 360) - 180;
}

/**
 * Formats distance in meters to a human-readable string.
 */
export function formatDistance(meters) {
  if (meters === null || meters === undefined || isNaN(meters)) return "--";
  if (meters < 10) return "Arriving";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Calculates estimated walking time based on project standard (50m / minute).
 */
export function calculateETA(meters) {
  if (meters === null || meters === undefined || isNaN(meters)) return "--";
  const minutes = Math.max(1, Math.ceil(meters / 50));
  return `${minutes} min`;
}

/**
 * Returns human-readable floor name for a given floor number.
 */
export function getFloorLabel(floor) {
  if (floor === 0 || floor === "0") return "Ground Floor";
  if (floor === 1 || floor === "1") return "First Floor";
  if (floor === 2 || floor === "2") return "Second Floor";
  if (floor === 3 || floor === "3") return "Third Floor";
  return floor !== undefined && floor !== null ? `Floor ${floor}` : "Ground Floor";
}

/**
 * Parses route nodes (string "lat,lng", [lat, lng], or {lat, lng}) into { lat, lng } objects.
 */
export function parseRouteCoordinates(route) {
  if (!Array.isArray(route) || route.length === 0) return [];

  return route
    .map((node) => {
      if (typeof node === "string") {
        const parts = node.split(",").map(Number);
        if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          return { lat: parts[0], lng: parts[1] };
        }
      } else if (Array.isArray(node) && node.length >= 2) {
        const lat = Number(node[0]);
        const lng = Number(node[1]);
        if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
      } else if (
        node &&
        typeof node === "object" &&
        "lat" in node &&
        "lng" in node
      ) {
        const lat = Number(node.lat);
        const lng = Number(node.lng);
        if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
      }
      return null;
    })
    .filter(Boolean);
}

/**
 * Classifies a turn angle into maneuver details.
 */
function classifyTurn(angle) {
  if (angle > 135) {
    return {
      type: "SHARP_RIGHT",
      actionTitle: "Sharp right",
      iconName: "corner-up-right",
      spokenTurn: "make a sharp right turn",
    };
  }
  if (angle >= 45) {
    return {
      type: "TURN_RIGHT",
      actionTitle: "Turn right",
      iconName: "corner-up-right",
      spokenTurn: "turn right",
    };
  }
  if (angle >= 25) {
    return {
      type: "SLIGHT_RIGHT",
      actionTitle: "Bear right",
      iconName: "arrow-up-right",
      spokenTurn: "bear right",
    };
  }
  if (angle < -135) {
    return {
      type: "SHARP_LEFT",
      actionTitle: "Sharp left",
      iconName: "corner-up-left",
      spokenTurn: "make a sharp left turn",
    };
  }
  if (angle <= -45) {
    return {
      type: "TURN_LEFT",
      actionTitle: "Turn left",
      iconName: "corner-up-left",
      spokenTurn: "turn left",
    };
  }
  if (angle <= -25) {
    return {
      type: "SLIGHT_LEFT",
      actionTitle: "Bear left",
      iconName: "arrow-up-left",
      spokenTurn: "bear left",
    };
  }
  return {
    type: "STRAIGHT",
    actionTitle: "Continue straight",
    iconName: "arrow-up",
    spokenTurn: "continue straight",
  };
}

/**
 * Formats internal stair/lift identifiers into natural spoken names.
 */
export function formatHumanStairName(rawName) {
  if (!rawName || typeof rawName !== "string") return "the stairs";
  // If already clean like "Main Staircase"
  if (!rawName.includes("_")) return rawName;

  const upper = rawName.toUpperCase();
  if (upper.includes("LIFT") || upper.includes("ELEVATOR")) {
    return "the elevator";
  }
  const stairMatch = upper.match(/STAIR(?:CASE)?_?0?(\d+)/i);
  if (stairMatch) {
    const num = stairMatch[1];
    return `staircase ${num}`;
  }
  return "the stairs";
}

/**
 * Generates structured navigation instructions from route coordinates and active context.
 */
export function generateRouteInstructions({
  route,
  navigationStage,
  destination,
  targetEntrance,
  targetStair,
  currentFloor,
}) {
  const points = parseRouteCoordinates(route);
  if (points.length < 2) return [];

  const isOutdoor = navigationStage === NAVIGATION_STAGE.OUTDOOR;
  const isOutdoorVenue = Boolean(
    destination?.properties?.isOutdoorVenue ||
      (!targetEntrance && !destination?.properties?.room_no && isOutdoor)
  );

  const destinationBuilding =
    destination?.properties?.building ?? "destination building";
  const roomCode =
    destination?.properties?.room_no ??
    destination?.properties?.room ??
    destination?.properties?.name ??
    destination?.properties?.id ??
    "destination";
  const roomName =
    destination?.properties?.name && destination.properties.name !== roomCode
      ? destination.properties.name
      : null;
  const destTitle = destination?.properties?.name || roomCode;
  const destinationFloor =
    destination?.properties?.floor ??
    destination?.properties?.level ??
    0;
  const hasStairTransition = Boolean(targetStair);
  const rawStairName =
    targetStair?.properties?.name ||
    targetStair?.properties?.id ||
    "stairs";
  const stairName = formatHumanStairName(rawStairName);

  // Calculate segment lengths and bearings
  const segmentDistances = [];
  const segmentBearings = [];

  for (let i = 0; i < points.length - 1; i++) {
    const dist = distanceInMeters(
      points[i].lat,
      points[i].lng,
      points[i + 1].lat,
      points[i + 1].lng
    );
    const bearing = calculateBearing(
      points[i].lat,
      points[i].lng,
      points[i + 1].lat,
      points[i + 1].lng
    );
    segmentDistances.push(dist);
    segmentBearings.push(bearing);
  }

  // Identify maneuver vertices (angles >= 25 deg over segments > 2m)
  const maneuvers = [];

  // Initial step at node 0
  let currentManeuverNodeIndex = 0;
  let accumulatedDist = 0;

  for (let i = 0; i < segmentDistances.length; i++) {
    accumulatedDist += segmentDistances[i];

    // Check if point i + 1 is a turn vertex
    const isLastSegment = i === segmentDistances.length - 1;
    let isTurn = false;
    let turnClassification = null;

    if (!isLastSegment) {
      const turnAngle = calculateTurnAngle(
        segmentBearings[i],
        segmentBearings[i + 1]
      );
      // Require at least 25 degrees turn and that the incoming segment is non-trivial (> 2m)
      if (Math.abs(turnAngle) >= 25 && segmentDistances[i + 1] >= 2) {
        isTurn = true;
        turnClassification = classifyTurn(turnAngle);
      }
    }

    if (isTurn) {
      // Finalize preceding straight maneuver
      const roundedDist = Math.max(1, Math.round(accumulatedDist));
      if (currentManeuverNodeIndex === 0) {
        let initialText = "";
        let initialSpoken = "";
        if (isOutdoorVenue) {
          initialText = `Head straight toward ${destTitle}`;
          initialSpoken = `Head toward ${destTitle}. Continue straight for ${roundedDist} meters.`;
        } else if (isOutdoor) {
          initialText = `Head toward ${destinationBuilding} entrance`;
          initialSpoken = `Head toward the ${destinationBuilding} entrance for ${roomCode}. Continue straight for ${roundedDist} meters.`;
        } else if (hasStairTransition) {
          initialText = `Proceed straight toward ${stairName}`;
          initialSpoken = `Proceed straight toward ${stairName} for ${roundedDist} meters.`;
        } else {
          initialText = `Follow corridor straight toward ${roomCode}`;
          initialSpoken = `Follow corridor straight toward ${roomCode} for ${roundedDist} meters.`;
        }

        maneuvers.push({
          id: `step_${maneuvers.length}`,
          nodeIndex: currentManeuverNodeIndex,
          type: "STRAIGHT",
          actionTitle: "Continue straight",
          primaryText: initialText,
          secondaryText: `Continue for ${roundedDist} m`,
          spokenApproachText: `Continue straight for ${roundedDist} meters.`,
          spokenExecText: initialSpoken,
          distance: accumulatedDist,
          iconName: "arrow-up",
          lat: points[currentManeuverNodeIndex].lat,
          lng: points[currentManeuverNodeIndex].lng,
        });
      }

      // Record the turn maneuver at vertex i + 1
      currentManeuverNodeIndex = i + 1;
      accumulatedDist = 0;

      const turnTarget = isOutdoorVenue
        ? destTitle
        : isOutdoor
        ? destinationBuilding
        : roomCode;

      maneuvers.push({
        id: `step_${maneuvers.length}`,
        nodeIndex: currentManeuverNodeIndex,
        type: turnClassification.type,
        actionTitle: turnClassification.actionTitle,
        primaryText: isOutdoor
          ? `${turnClassification.actionTitle} onto walkway`
          : `${turnClassification.actionTitle} along corridor`,
        secondaryText: `Toward ${turnTarget}`,
        spokenApproachText: `In about 20 meters, ${turnClassification.spokenTurn}.`,
        spokenExecText: `${turnClassification.actionTitle}, then continue straight.`,
        distance: 0, // will be updated as following segment accumulates
        iconName: turnClassification.iconName,
        lat: points[currentManeuverNodeIndex].lat,
        lng: points[currentManeuverNodeIndex].lng,
      });
    }
  }

  // If no turns were detected at all, create the single straight maneuver
  if (maneuvers.length === 0) {
    const roundedDist = Math.max(1, Math.round(accumulatedDist));
    let initialText = "";
    let initialSpoken = "";
    if (isOutdoorVenue) {
      initialText = `Walk toward ${destTitle}`;
      initialSpoken = `Head toward ${destTitle}. Continue straight for ${roundedDist} meters.`;
    } else if (isOutdoor) {
      initialText = `Walk toward ${destinationBuilding} entrance`;
      initialSpoken = `Head toward the ${destinationBuilding} entrance for ${roomCode}. Continue straight for ${roundedDist} meters.`;
    } else if (hasStairTransition) {
      initialText = `Walk toward ${stairName}`;
      initialSpoken = `Walk toward ${stairName} for ${roundedDist} meters.`;
    } else {
      initialText = `Follow corridor to ${roomCode}`;
      initialSpoken = `Follow corridor to ${roomCode} for ${roundedDist} meters.`;
    }

    maneuvers.push({
      id: "step_0",
      nodeIndex: 0,
      type: "STRAIGHT",
      actionTitle: "Continue straight",
      primaryText: initialText,
      secondaryText: `Continue for ${roundedDist} m`,
      spokenApproachText: initialSpoken,
      spokenExecText: initialSpoken,
      distance: accumulatedDist,
      iconName: "arrow-up",
      lat: points[0].lat,
      lng: points[0].lng,
    });
  } else {
    // Assign remaining accumulated distance to the last turn maneuver
    if (maneuvers.length > 0 && accumulatedDist > 0) {
      const last = maneuvers[maneuvers.length - 1];
      last.distance = accumulatedDist;
      const roundedDist = Math.max(1, Math.round(accumulatedDist));
      last.secondaryText = `Continue for ${roundedDist} m`;
      last.spokenExecText = `${last.actionTitle}, then continue straight for ${roundedDist} meters.`;
    }
  }

  // Append Destination / Milestone Arrival Maneuver at the end of the route
  const lastPoint = points[points.length - 1];
  let finalStep = null;

  if (isOutdoorVenue) {
    finalStep = {
      id: `step_${maneuvers.length}`,
      nodeIndex: points.length - 1,
      type: "ARRIVE",
      actionTitle: "Destination ahead",
      primaryText: `Arrive at ${destTitle}`,
      secondaryText: destination?.properties?.building || destination?.properties?.landmark || "Campus Venue",
      spokenApproachText: `In about 25 meters, your destination, ${destTitle}, will be ahead.`,
      spokenExecText: `You have arrived at ${destTitle}.`,
      distance: 0,
      iconName: "map-pin",
      lat: lastPoint.lat,
      lng: lastPoint.lng,
    };
  } else if (isOutdoor) {
    const entranceLabel =
      targetEntrance?.properties?.name ||
      `${destinationBuilding} Entrance`;
    finalStep = {
      id: `step_${maneuvers.length}`,
      nodeIndex: points.length - 1,
      type: "ENTER_BUILDING",
      actionTitle: "Enter building",
      primaryText: `Approach ${entranceLabel}`,
      secondaryText: `Enter ${destinationBuilding} for ${roomCode}`,
      spokenApproachText: `In about 25 meters, approach the ${destinationBuilding} entrance.`,
      spokenExecText: `You have reached the entrance. Enter ${destinationBuilding}.`,
      distance: 0,
      iconName: "log-in",
      lat: lastPoint.lat,
      lng: lastPoint.lng,
    };
  } else if (hasStairTransition) {
    finalStep = {
      id: `step_${maneuvers.length}`,
      nodeIndex: points.length - 1,
      type: "PROCEED_TO_STAIRS",
      actionTitle: "Take stairs / lift",
      primaryText: `Proceed to ${stairName}`,
      secondaryText: `Take to ${getFloorLabel(destinationFloor)} for ${roomCode}`,
      spokenApproachText: `In about 20 meters, approach ${stairName}. Take it to ${getFloorLabel(destinationFloor)}.`,
      spokenExecText: `You have reached ${stairName}. Proceed to ${getFloorLabel(destinationFloor)}.`,
      distance: 0,
      iconName: "footprints",
      lat: lastPoint.lat,
      lng: lastPoint.lng,
    };
  } else {
    finalStep = {
      id: `step_${maneuvers.length}`,
      nodeIndex: points.length - 1,
      type: "ARRIVE",
      actionTitle: "Destination ahead",
      primaryText: `Arrive at ${roomCode}`,
      secondaryText: `${destinationBuilding}${roomName ? ` · ${roomName}` : ""} (${getFloorLabel(destinationFloor)})`,
      spokenApproachText: `In about 20 meters, your destination ${roomCode} will be ahead on this floor.`,
      spokenExecText: `You have arrived at destination ${roomCode}.`,
      distance: 0,
      iconName: "map-pin",
      lat: lastPoint.lat,
      lng: lastPoint.lng,
    };
  }

  maneuvers.push(finalStep);

  return maneuvers;
}

/**
 * Calculates real-time progress along the route given user GPS location.
 */
export function getRouteProgress({
  route,
  instructions,
  currentLocation,
  lastPassedNodeIndex = 0,
}) {
  const points = parseRouteCoordinates(route);
  if (points.length < 2 || !instructions || instructions.length === 0) {
    return {
      activeInstructionIndex: 0,
      activeInstruction: instructions?.[0] || null,
      nextInstruction: instructions?.[1] || null,
      distanceToNextAction: null,
      remainingTotalDistance: null,
      closestNodeIndex: 0,
    };
  }

  let closestNodeIndex = lastPassedNodeIndex;

  if (currentLocation && typeof currentLocation.lat === "number") {
    let minDistance = Infinity;
    // Search within a forward window starting from lastPassedNodeIndex - 1 to prevent GPS jitter from snapping backwards
    const searchStart = Math.max(0, lastPassedNodeIndex - 1);
    const searchEnd = points.length;

    for (let i = searchStart; i < searchEnd; i++) {
      const d = distanceInMeters(
        currentLocation.lat,
        currentLocation.lng,
        points[i].lat,
        points[i].lng
      );
      if (d < minDistance) {
        minDistance = d;
        closestNodeIndex = i;
      }
    }
  }

  // Helper to compute distance from user along route nodes up to a target node index
  const distanceToNode = (targetIndex) => {
    if (targetIndex <= closestNodeIndex) {
      return distanceInMeters(
        currentLocation.lat,
        currentLocation.lng,
        points[targetIndex].lat,
        points[targetIndex].lng
      );
    }
    let d = distanceInMeters(
      currentLocation.lat,
      currentLocation.lng,
      points[closestNodeIndex].lat,
      points[closestNodeIndex].lng
    );
    for (let i = closestNodeIndex; i < targetIndex; i++) {
      d += distanceInMeters(
        points[i].lat,
        points[i].lng,
        points[i + 1].lat,
        points[i + 1].lng
      );
    }
    return d;
  };

  // Determine current active maneuver
  // 1. Find the base maneuver the user is physically progressing along
  let activeIndex = 0;
  for (let i = 0; i < instructions.length; i++) {
    if (instructions[i].nodeIndex <= closestNodeIndex) {
      activeIndex = i;
    } else {
      break;
    }
  }

  // 2. Look ahead to the next upcoming maneuver (e.g. turn or entrance)
  let nextIdx = activeIndex + 1 < instructions.length ? activeIndex + 1 : activeIndex;
  let distToNextManeuver = 0;

  if (currentLocation && typeof currentLocation.lat === "number") {
    distToNextManeuver = distanceToNode(instructions[nextIdx].nodeIndex);
  } else {
    distToNextManeuver = instructions[activeIndex].distance || 0;
  }

  // 3. If within 25m of an upcoming turn, promote the turn to be the active display instruction
  let distanceToNextAction = distToNextManeuver;
  if (
    nextIdx > activeIndex &&
    distToNextManeuver <= 25 &&
    instructions[nextIdx].type !== "ARRIVE"
  ) {
    activeIndex = nextIdx;
    nextIdx = activeIndex + 1 < instructions.length ? activeIndex + 1 : activeIndex;
  }

  const activeInstruction = instructions[activeIndex];
  const nextInstruction =
    nextIdx > activeIndex
      ? instructions[nextIdx]
      : activeIndex + 1 < instructions.length
      ? instructions[activeIndex + 1]
      : null;

  // If approaching the active maneuver vertex, distance is to that vertex
  if (currentLocation && typeof currentLocation.lat === "number" && activeInstruction.nodeIndex > 0) {
    const distToManeuverVertex = distanceInMeters(
      currentLocation.lat,
      currentLocation.lng,
      points[activeInstruction.nodeIndex].lat,
      points[activeInstruction.nodeIndex].lng
    );

    if (closestNodeIndex <= activeInstruction.nodeIndex && distToManeuverVertex > 6) {
      distanceToNextAction = distToManeuverVertex;
    } else {
      distanceToNextAction = distToNextManeuver;
    }
  }

  // Calculate total remaining distance from user to route destination
  let remainingTotalDistance = 0;
  if (currentLocation && typeof currentLocation.lat === "number") {
    remainingTotalDistance = distanceToNode(points.length - 1);
  } else {
    for (let i = 0; i < points.length - 1; i++) {
      remainingTotalDistance += distanceInMeters(
        points[i].lat,
        points[i].lng,
        points[i + 1].lat,
        points[i + 1].lng
      );
    }
  }

  return {
    activeInstructionIndex: activeIndex,
    activeInstruction,
    nextInstruction,
    distanceToNextAction: Math.max(0, distanceToNextAction),
    remainingTotalDistance: Math.max(0, remainingTotalDistance),
    closestNodeIndex,
  };
}
