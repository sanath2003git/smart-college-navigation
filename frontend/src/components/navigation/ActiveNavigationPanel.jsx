import {
  ArrowUp,
  ArrowUpLeft,
  ArrowUpRight,
  Check,
  CornerUpLeft,
  CornerUpRight,
  DoorOpen,
  Footprints,
  MapPin,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useNavigation } from "../../hooks/useNavigation";
import { useNavigationInstructions } from "../../hooks/useNavigationInstructions";
import { NAVIGATION_STAGE } from "../../constants/navigationStages";
import { getFloorLabel } from "../../services/navigationInstructionService";

function getManeuverIcon(iconName, type) {
  switch (iconName) {
    case "corner-up-left":
      return CornerUpLeft;
    case "corner-up-right":
      return CornerUpRight;
    case "arrow-up-left":
      return ArrowUpLeft;
    case "arrow-up-right":
      return ArrowUpRight;
    case "log-in":
      return DoorOpen;
    case "footprints":
      return Footprints;
    case "map-pin":
      return MapPin;
    default:
      if (type === "TURN_LEFT" || type === "SHARP_LEFT") return CornerUpLeft;
      if (type === "TURN_RIGHT" || type === "SHARP_RIGHT") return CornerUpRight;
      if (type === "SLIGHT_LEFT") return ArrowUpLeft;
      if (type === "SLIGHT_RIGHT") return ArrowUpRight;
      if (type === "ENTER_BUILDING" || type === "APPROACH_ENTRANCE") return DoorOpen;
      if (type === "PROCEED_TO_STAIRS" || type === "CHANGE_FLOOR") return Footprints;
      if (type === "ARRIVE") return MapPin;
      return ArrowUp;
  }
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
    cancelNavigation: contextCancel,
    setRoute,
    setDestination,
    setTargetEntrance,
    setTargetStair,
    setSelectedBuilding,
    setCurrentFloor,
    setNavigationStage,
    setFloorTransition,
    setPendingFloorTransition,
  } = useNavigation();

  const {
    currentInstruction,
    nextInstruction,
    distanceToNextAction,
    formattedDistance,
    formattedNextDistance,
    formattedETA,
    isMuted,
    toggleMute,
    repeatInstruction,
  } = useNavigationInstructions();

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

  // Maneuver Icon
  const InstructionIcon = getManeuverIcon(
    currentInstruction?.iconName,
    currentInstruction?.type
  );

  // Fallback labels if instruction is not yet generated
  const displayTitle =
    currentInstruction?.primaryText ||
    (isOutdoor
      ? `Head toward ${destinationBuilding} entrance`
      : hasStairTransition
      ? `Proceed to ${targetStair?.properties?.name || "stairs / lift"}`
      : `Follow corridor to ${roomCode}`);

  const displayMeta =
    currentInstruction?.secondaryText ||
    `${destinationBuilding} · ${getFloorLabel(destinationFloor)}${roomName ? ` · ${roomName}` : ""}`;

  // Next Action distance label
  const distanceBadgeText =
    distanceToNextAction !== null && distanceToNextAction !== undefined
      ? distanceToNextAction < 8
        ? "Now"
        : `In ${formattedNextDistance}`
      : null;

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
          <div className="smartnav-nav-v">
            {roomCode}
            <span className="smartnav-dest-sub">
              {" "}· {destinationBuilding} ({getFloorLabel(destinationFloor)})
            </span>
          </div>
        </div>

        <div className="smartnav-nav-controls">
          {/* Voice Repeat Button */}
          <button
            type="button"
            onClick={repeatInstruction}
            className="smartnav-voice-btn"
            title="Repeat voice instruction"
            aria-label="Repeat voice instruction"
          >
            <RotateCcw size={13} strokeWidth={2.4} />
            <span>Repeat</span>
          </button>

          {/* Voice Mute / Unmute Button */}
          <button
            type="button"
            onClick={toggleMute}
            className={`smartnav-voice-btn ${isMuted ? "muted" : ""}`}
            title={isMuted ? "Unmute voice guidance" : "Mute voice guidance"}
            aria-label={isMuted ? "Unmute voice guidance" : "Mute voice guidance"}
          >
            {isMuted ? (
              <VolumeX size={15} strokeWidth={2.4} />
            ) : (
              <Volume2 size={15} strokeWidth={2.4} />
            )}
            <span>{isMuted ? "Muted" : "Voice"}</span>
          </button>

          {/* Cancel Navigation Button */}
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
      </div>

      {/* =========================================================
          DESKTOP INSTRUCTION PANEL
      ========================================================= */}
      <aside className="smartnav-instr-panel" aria-label="Navigation guidance">
        <div className="smartnav-instr-current">
          <div className="smartnav-instr-ic" aria-hidden="true">
            <InstructionIcon size={18} strokeWidth={2.4} />
          </div>
          <div className="min-w-0 flex-1">
            {distanceBadgeText && (
              <div className="smartnav-instr-dist-badge">
                {distanceBadgeText}
              </div>
            )}
            <div className="smartnav-instr-txt">{displayTitle}</div>
            <div className="smartnav-instr-meta">{displayMeta}</div>
          </div>
        </div>

        {/* Upcoming Action Preview */}
        {nextInstruction && (
          <div className="smartnav-instr-next">
            <span className="smartnav-instr-next-label">Next:</span>
            <span className="truncate">
              {nextInstruction.actionTitle} · {nextInstruction.primaryText}
            </span>
          </div>
        )}

        {/* Milestone Steps List */}
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

        <div className="smartnav-m-controls-row">
          {/* Mobile Voice Repeat */}
          <button
            type="button"
            onClick={repeatInstruction}
            className="smartnav-m-icon-btn"
            title="Repeat voice instruction"
            aria-label="Repeat voice instruction"
          >
            <RotateCcw size={13} strokeWidth={2.4} />
          </button>

          {/* Mobile Voice Mute */}
          <button
            type="button"
            onClick={toggleMute}
            className={`smartnav-m-icon-btn ${isMuted ? "muted" : ""}`}
            title={isMuted ? "Unmute voice guidance" : "Mute voice guidance"}
            aria-label={isMuted ? "Unmute voice guidance" : "Mute voice guidance"}
          >
            {isMuted ? (
              <VolumeX size={14} strokeWidth={2.4} />
            ) : (
              <Volume2 size={14} strokeWidth={2.4} />
            )}
          </button>

          {/* Mobile Cancel */}
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
      </div>

      <div className="smartnav-m-sheet">
        <div className="smartnav-m-handle" aria-hidden="true" />
        <div className="smartnav-m-instr-row">
          <div className="smartnav-m-instr-ic" aria-hidden="true">
            <InstructionIcon size={17} strokeWidth={2.4} />
          </div>
          <div className="smartnav-m-instr-content">
            {distanceBadgeText && (
              <div className="smartnav-instr-dist-badge">
                {distanceBadgeText}
              </div>
            )}
            <div className="smartnav-m-instr-title">{displayTitle}</div>
            <div className="smartnav-m-instr-sub">{displayMeta}</div>
          </div>
        </div>

        {nextInstruction && (
          <div className="smartnav-m-next-row">
            <span className="smartnav-instr-next-label">Next:</span>
            <span className="truncate">
              {nextInstruction.actionTitle} · {nextInstruction.primaryText}
            </span>
          </div>
        )}

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
