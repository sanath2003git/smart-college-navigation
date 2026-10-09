import { useMemo } from "react";
import {
  ArrowUp,
  Check,
  CornerDownRight,
  MapPin,
  X,
} from "lucide-react";
import { useNavigation } from "../../hooks/useNavigation";
import { NAVIGATION_STAGE } from "../../constants/navigationStages";

function distanceInMeters(lat1, lng1, lat2, lng2) {
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

function calculateRouteDistance(path) {
  if (!path || path.length < 2) return null;

  let totalMeters = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const [lat1, lng1] = path[i].split(",").map(Number);
    const [lat2, lng2] = path[i + 1].split(",").map(Number);
    if (!isNaN(lat1) && !isNaN(lng1) && !isNaN(lat2) && !isNaN(lng2)) {
      totalMeters += distanceInMeters(lat1, lng1, lat2, lng2);
    }
  }
  return totalMeters;
}

function formatDistance(meters) {
  if (meters === null || isNaN(meters)) return "--";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function calculateETA(meters) {
  if (meters === null || isNaN(meters)) return "--";
  // Walking speed constant standard in project: 50m / minute (from DestinationPanel.jsx)
  const minutes = Math.max(1, Math.ceil(meters / 50));
  return `${minutes} min`;
}

function getFloorLabel(floor) {
  if (floor === 0 || floor === "0") return "Ground Floor";
  if (floor === 1 || floor === "1") return "First Floor";
  if (floor === 2 || floor === "2") return "Second Floor";
  if (floor === 3 || floor === "3") return "Third Floor";
  return floor !== undefined && floor !== null ? `Floor ${floor}` : "Ground Floor";
}

export default function ActiveNavigationPanel() {
  const {
    route,
    destination,
    navigationStage,
    currentFloor,
    selectedBuilding,
    currentBuilding,
    targetEntrance,
    targetStair,
    setRoute,
    setDestination,
    setTargetEntrance,
    setTargetStair,
    setSelectedBuilding,
    setNavigationStage,
    setFloorTransition,
    setPendingFloorTransition,
    cancelNavigation: contextCancel,
  } = useNavigation();

  // If no active navigation session exists, do not render
  if (!route || route.length === 0 || !destination) {
    return null;
  }

  const handleCancel = () => {
    if (typeof contextCancel === "function") {
      contextCancel();
    } else {
      setRoute([]);
      setDestination(null);
      setTargetEntrance(null);
      setTargetStair(null);
      setFloorTransition({
        open: false,
        currentFloor: null,
        nextFloor: null,
        transitionId: null,
        transitionType: null,
      });
      setPendingFloorTransition(null);

      const isIndoors =
        Boolean(currentBuilding) || navigationStage !== NAVIGATION_STAGE.OUTDOOR;
      const indoorBuilding =
        currentBuilding ||
        (navigationStage !== NAVIGATION_STAGE.OUTDOOR ? selectedBuilding : null);

      if (isIndoors && indoorBuilding) {
        setSelectedBuilding(indoorBuilding);
        setCurrentFloor(Number(currentFloor ?? 0));
        setNavigationStage(navigationStage);
      } else {
        setSelectedBuilding(null);
        setNavigationStage(NAVIGATION_STAGE.OUTDOOR);
      }
    }
  };

  const routeMeters = useMemo(() => calculateRouteDistance(route), [route]);
  const formattedDistance = formatDistance(routeMeters);
  const formattedETA = calculateETA(routeMeters);

  const roomCode =
    destination?.properties?.room_no ??
    destination?.properties?.room ??
    destination?.properties?.name ??
    destination?.properties?.id ??
    "Destination";

  const roomName =
    destination?.properties?.name && destination.properties.name !== roomCode
      ? destination.properties.name
      : null;

  const destinationBuilding =
    destination?.properties?.building ??
    selectedBuilding ??
    "Campus Building";

  const destinationFloor =
    destination?.properties?.floor ??
    destination?.properties?.level ??
    0;

  const isOutdoor = navigationStage === NAVIGATION_STAGE.OUTDOOR;
  const isIndoor = !isOutdoor;
  const hasStairTransition = Boolean(targetStair);

  // Derive current instruction based on genuine navigation stage and targets
  let instructionTitle = "";
  let instructionMeta = "";
  let InstructionIcon = ArrowUp;

  if (isOutdoor) {
    instructionTitle = `Head toward ${destinationBuilding} entrance`;
    instructionMeta = targetEntrance?.properties?.name
      ? `Via ${targetEntrance.properties.name} · Final: ${roomCode}`
      : `Follow outdoor walkway · Final: ${roomCode}`;
    InstructionIcon = ArrowUp;
  } else if (hasStairTransition) {
    instructionTitle = `Proceed to ${targetStair?.properties?.name || targetStair?.properties?.id || "stairs / lift"}`;
    instructionMeta = `Transition to ${getFloorLabel(destinationFloor)} for ${roomCode}`;
    InstructionIcon = CornerDownRight;
  } else {
    instructionTitle = `Follow corridor to ${roomCode}`;
    instructionMeta = `${destinationBuilding}${roomName ? ` · ${roomName}` : ""}`;
    InstructionIcon = MapPin;
  }

  // High-level milestone stages derived from engine capabilities
  const steps = [
    {
      id: "start",
      label: "Start at current location",
      done: true,
    },
    {
      id: "entrance",
      label: `Walk to ${destinationBuilding} entrance`,
      done: isIndoor,
    },
    ...(destinationFloor > 0
      ? [
          {
            id: "stairs",
            label: `Take stairs/lift to ${getFloorLabel(destinationFloor)}`,
            done: currentFloor >= destinationFloor && isIndoor && !hasStairTransition,
          },
        ]
      : []),
    {
      id: "dest",
      label: `Arrive at ${roomCode}`,
      done: false,
    },
  ];

  return (
    <div className="smartnav-active-nav-container" aria-label="Active Navigation">
      {/* =========================================================
          DESKTOP TOPBAR
      ========================================================= */}
      <div className="smartnav-nav-topbar">
        <div className="smartnav-nav-seg">
          <div className="smartnav-nav-l">Distance</div>
          <div className="smartnav-nav-v">{formattedDistance}</div>
        </div>

        <div className="smartnav-nav-seg">
          <div className="smartnav-nav-l">ETA</div>
          <div className="smartnav-nav-v">{formattedETA}</div>
        </div>

        <div className="smartnav-nav-seg">
          <div className="smartnav-nav-l">Destination</div>
          <div className="smartnav-nav-v">{roomCode}</div>
        </div>

        <button
          type="button"
          onClick={handleCancel}
          className="smartnav-nav-cancel"
          aria-label="Cancel navigation"
        >
          <X size={13} strokeWidth={2.4} />
          <span>Cancel Navigation</span>
        </button>
      </div>

      {/* =========================================================
          DESKTOP INSTRUCTION PANEL
      ========================================================= */}
      <aside className="smartnav-instr-panel" aria-label="Navigation guidance">
        <div className="smartnav-instr-current">
          <div className="smartnav-instr-ic" aria-hidden="true">
            <InstructionIcon size={17} strokeWidth={2.4} />
          </div>
          <div>
            <div className="smartnav-instr-txt">{instructionTitle}</div>
            <div className="smartnav-instr-meta">{instructionMeta}</div>
          </div>
        </div>

        <div className="smartnav-instr-list">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`smartnav-instr-step ${step.done ? "done" : ""}`}
            >
              {step.done ? (
                <span className="smartnav-instr-check" aria-hidden="true">
                  <Check size={13} strokeWidth={2.6} />
                </span>
              ) : (
                <div className="smartnav-instr-dot2" aria-hidden="true" />
              )}
              <span>{step.label}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* =========================================================
          MOBILE ACTIVE NAVIGATION (SCREEN <= 768px)
      ========================================================= */}
      <div className="smartnav-m-navbar">
        <div className="smartnav-m-seg">
          <div className="smartnav-m-l">Distance</div>
          <div className="smartnav-m-v">{formattedDistance}</div>
        </div>

        <div className="smartnav-m-seg">
          <div className="smartnav-m-l">ETA</div>
          <div className="smartnav-m-v">{formattedETA}</div>
        </div>

        <button
          type="button"
          onClick={handleCancel}
          className="smartnav-m-cancel-chip"
          aria-label="Cancel navigation"
        >
          <X size={12} strokeWidth={2.4} />
          <span>Cancel</span>
        </button>
      </div>

      <div className="smartnav-m-sheet">
        <div className="smartnav-m-handle" aria-hidden="true" />
        <div className="smartnav-m-instr-row">
          <div className="smartnav-m-instr-ic" aria-hidden="true">
            <InstructionIcon size={16} strokeWidth={2.4} />
          </div>
          <div className="smartnav-m-instr-content">
            <div className="smartnav-m-instr-title">{instructionTitle}</div>
            <div className="smartnav-m-instr-sub">
              {instructionMeta}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCancel}
          className="smartnav-m-cancel-btn"
        >
          Cancel Navigation
        </button>
      </div>
    </div>
  );
}
