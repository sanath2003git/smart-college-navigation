import { useState, useEffect } from "react";
import { useNavigation } from "../../hooks/useNavigation";
import { NAVIGATION_STAGE } from "../../constants/navigationStages";

const FLOORS = [
  { value: 0, code: "GF", label: "Ground", name: "Ground Floor" },
  { value: 1, code: "FF", label: "First", name: "First Floor" },
  { value: 2, code: "SF", label: "Second", name: "Second Floor" },
  { value: 3, code: "TF", label: "Third", name: "Third Floor" },
];

export default function FloorSelector({
  mode = "navigation",
  building,
  availableFloors = null,
  activeFloor = null,
  onFloorChange = null,
  onConfirm,
  onCancel,
} = {}) {
  const {
    navigationStage,
    setNavigationStage,
    selectedBuilding,
    setSelectedBuilding,
    currentBuilding,
    currentFloor,
    setCurrentFloor,
    getNavigationStageForFloor,
    initialFloorSelection,
    confirmInitialFloorSelection,
    cancelInitialFloorSelection,
  } = useNavigation();

  // =========================================================
  // EXPLORATION MODE (Building Floor Explorer)
  // Used on dedicated building explorer pages.
  // Independent of GPS, userFloor, navigationStage, and active routing.
  // =========================================================
  if (mode === "explore") {
    const floorsToDisplay =
      availableFloors && availableFloors.length > 0
        ? FLOORS.filter((f) => availableFloors.includes(f.value))
        : FLOORS;

    if (floorsToDisplay.length === 0) {
      return null;
    }

    const activeFloorNum = Number(activeFloor ?? 0);
    const currentFloorObj =
      floorsToDisplay.find((f) => f.value === activeFloorNum) ||
      floorsToDisplay[0] ||
      FLOORS[0];

    const exploreBuildingName =
      typeof building === "string"
        ? building
        : building?.properties?.name || "Building";

    const handleExploreFloorSelect = (floorNum) => {
      if (floorNum === activeFloorNum) return;
      if (onFloorChange) {
        onFloorChange(floorNum);
      }
    };

    const desktopSubtitle =
      activeFloorNum === 0
        ? "Ground Floor · Indoor Map"
        : `${currentFloorObj.name} · Indoor Map`;

    const mobileSubtitle =
      activeFloorNum === 0
        ? "Ground Floor"
        : currentFloorObj.name;

    return (
      <>
        {/* DESKTOP INDOOR FLOOR NAV (EXPLORATION) */}
        <div className="smartnav-desktop-indoor-ui building-explorer-floorsel">
          {/* Horizontal Floor Selector */}
          <div className="floor-selector" role="toolbar" aria-label="Indoor floor selector">
            {floorsToDisplay.map((f) => {
              const isActive = f.value === activeFloorNum;
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => handleExploreFloorSelect(f.value)}
                  className={`fs-item ${isActive ? "active" : ""}`}
                  aria-pressed={isActive}
                  aria-label={`Switch to ${f.name}`}
                >
                  <div className="n">{f.code}</div>
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Building Tag */}
          <div className="building-tag2">
            <div className="n">{exploreBuildingName}</div>
            <div className="s">{desktopSubtitle}</div>
          </div>

          {/* Indoor Map Legend */}
          <div className="plan-legend">
            <div className="pl-row">
              <div className="sw2" style={{ background: "#E9A400" }} />
              Active route
            </div>
            <div className="pl-row">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 21V9l8-6 8 6v12" />
                <path d="M9 21v-6h6v6" />
              </svg>
              Destination room
            </div>
            <div className="pl-row">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 21h4v-4h4v-4h4V9h4V3" />
              </svg>
              Staircase
            </div>
            <div className="pl-row">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 21c-4.4-3.6-7-7-7-10a7 7 0 1 1 14 0c0 3-2.6 6.4-7 10z" />
                <circle cx="12" cy="11" r="2.4" />
              </svg>
              Your position
            </div>
          </div>
        </div>

        {/* MOBILE INDOOR FLOOR NAV (EXPLORATION) */}
        <div className="smartnav-mobile-indoor-ui building-explorer-m-floorsel">
          <div className="m-buildingtag">
            <div className="n">{exploreBuildingName}</div>
            <div className="s">{mobileSubtitle}</div>
          </div>

          <div className="m-floorsel" role="toolbar" aria-label="Mobile floor selector">
            {floorsToDisplay.map((f) => {
              const isActive = f.value === activeFloorNum;
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => handleExploreFloorSelect(f.value)}
                  className={`m-floorsel-btn ${isActive ? "active" : ""}`}
                  aria-pressed={isActive}
                  aria-label={`Switch to ${f.name}`}
                >
                  {f.code}
                </button>
              );
            })}
          </div>
        </div>
      </>
    );
  }

  // =========================================================
  // NAVIGATION MODE (Live Campus Navigation & Detection)
  // =========================================================

  // Local state for initial floor selection (starts at null to prevent premature default)
  const [selectedInitialFloor, setSelectedInitialFloor] = useState(null);

  const isInitialOpen = initialFloorSelection?.open;

  // Reset selectedInitialFloor to null whenever the initial selection prompt opens
  useEffect(() => {
    if (isInitialOpen) {
      setSelectedInitialFloor(null);
    }
  }, [isInitialOpen]);

  const isIndoor = navigationStage !== NAVIGATION_STAGE.OUTDOOR;

  // Do not render if outdoors and no initial floor selection is open
  if (!isIndoor && !isInitialOpen) {
    return null;
  }

  // Determine building name
  const buildingName =
    typeof selectedBuilding === "string"
      ? selectedBuilding
      : selectedBuilding?.properties?.name ||
        currentBuilding ||
        "Mechanical Block";

  const initialBuilding =
    building ||
    initialFloorSelection?.building ||
    selectedBuilding ||
    currentBuilding ||
    "Mechanical Block";

  const initialBuildingName =
    typeof initialBuilding === "string"
      ? initialBuilding
      : initialBuilding?.properties?.name || "Mechanical Block";

  // Initial floor selection confirm & cancel handlers
  const handleConfirmInitial = () => {
    if (selectedInitialFloor === null || selectedInitialFloor === undefined) {
      return;
    }
    if (onConfirm) {
      onConfirm(selectedInitialFloor);
    } else if (confirmInitialFloorSelection) {
      confirmInitialFloorSelection(selectedInitialFloor);
    }
  };

  const handleCancelInitial = () => {
    if (onCancel) {
      onCancel();
    } else if (cancelInitialFloorSelection) {
      cancelInitialFloorSelection();
    }
  };

  // =========================================================
  // INITIAL FLOOR SELECTION MODE
  // =========================================================
  if (isInitialOpen) {
    const selectedFloorObj = FLOORS.find(
      (f) => f.value === selectedInitialFloor
    );

    return (
      <>
        {/* Desktop Initial Floor Selection Modal */}
        <div
          className="ft-overlay smartnav-desktop-ft"
          onClick={(e) => {
            if (e.target === e.currentTarget && handleCancelInitial) {
              handleCancelInitial();
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="init-floor-title-desktop"
        >
          <div className="ft-card init-floor-card">
            <div className="init-floor-header">
              <div className="init-floor-badge-icon" aria-hidden="true">
                <BuildingIcon />
              </div>
              <button
                type="button"
                className="ft-close-btn"
                onClick={handleCancelInitial}
                aria-label="Dismiss floor selection"
              >
                <CloseIcon />
              </button>
            </div>

            <div id="init-floor-title-desktop" className="init-floor-title">
              You're inside {initialBuildingName}
            </div>

            <p className="init-floor-desc">
              Select your current floor to start indoor navigation.
            </p>

            {/* Reused FloorSelector buttons matching Screen 4 */}
            <div className="init-floor-selector-container">
              <div
                className="floor-selector init-inline-floorsel"
                role="radiogroup"
                aria-label="Floor selection"
              >
                {FLOORS.map((f) => {
                  const isSelected = selectedInitialFloor === f.value;
                  return (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setSelectedInitialFloor(f.value)}
                      className={`fs-item ${isSelected ? "active" : ""}`}
                      role="radio"
                      aria-checked={isSelected}
                      aria-label={`Select ${f.name}`}
                    >
                      <div className="n">{f.code}</div>
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected floor summary */}
            <div className="init-floor-preview">
              <div className="ifp-label">Selected Floor</div>
              <div className="ifp-value">
                {selectedFloorObj ? selectedFloorObj.name : "None selected"}
              </div>
            </div>

            {/* Confirm / Continue button */}
            <button
              type="button"
              className="ft-btn"
              disabled={selectedInitialFloor === null}
              onClick={handleConfirmInitial}
            >
              Continue
            </button>
          </div>
        </div>

        {/* Mobile Initial Floor Selection Sheet */}
        <div
          className="m-ft-overlay smartnav-mobile-ft"
          onClick={(e) => {
            if (e.target === e.currentTarget && handleCancelInitial) {
              handleCancelInitial();
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="init-floor-title-mobile"
        >
          <div className="m-ft-sheet init-floor-sheet">
            <div className="m-handle" />

            <div className="init-floor-header">
              <div className="init-floor-badge-icon" aria-hidden="true">
                <BuildingIcon />
              </div>
              <button
                type="button"
                className="ft-close-btn"
                onClick={handleCancelInitial}
                aria-label="Dismiss floor selection"
              >
                <CloseIcon />
              </button>
            </div>

            <div id="init-floor-title-mobile" className="init-floor-title">
              You're inside {initialBuildingName}
            </div>

            <p className="init-floor-desc">
              Select your current floor to start indoor navigation.
            </p>

            {/* Mobile Floor Selection Buttons */}
            <div className="init-floor-selector-container">
              <div
                className="floor-selector init-inline-floorsel"
                role="radiogroup"
                aria-label="Floor selection"
              >
                {FLOORS.map((f) => {
                  const isSelected = selectedInitialFloor === f.value;
                  return (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setSelectedInitialFloor(f.value)}
                      className={`fs-item ${isSelected ? "active" : ""}`}
                      role="radio"
                      aria-checked={isSelected}
                      aria-label={`Select ${f.name}`}
                    >
                      <div className="n">{f.code}</div>
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="init-floor-preview">
              <div className="ifp-label">Selected Floor</div>
              <div className="ifp-value">
                {selectedFloorObj ? selectedFloorObj.name : "None selected"}
              </div>
            </div>

            <button
              type="button"
              className="ft-btn"
              disabled={selectedInitialFloor === null}
              onClick={handleConfirmInitial}
            >
              Continue
            </button>
          </div>
        </div>
      </>
    );
  }

  // =========================================================
  // NORMAL INDOOR FLOOR SELECTION MODE (CampusPage Live Nav)
  // =========================================================
  const activeFloorNum = Number(currentFloor ?? 0);
  const currentFloorObj =
    FLOORS.find((f) => f.value === activeFloorNum) || FLOORS[0];

  const handleFloorSelect = (floorNum) => {
    if (floorNum === activeFloorNum) return;
    const stage = getNavigationStageForFloor
      ? getNavigationStageForFloor(floorNum)
      : getStageFallback(floorNum);

    if (!selectedBuilding) {
      setSelectedBuilding(buildingName);
    }

    setCurrentFloor(floorNum);
    setNavigationStage(stage);
  };

  const desktopSubtitle =
    activeFloorNum === 0
      ? "Ground Floor · 21 mapped spaces"
      : `${currentFloorObj.name} · Indoor Map`;

  const mobileSubtitle =
    activeFloorNum === 0
      ? "Ground Floor · 21 spaces"
      : currentFloorObj.name;

  return (
    <>
      {/* DESKTOP INDOOR FLOOR NAV */}
      <div className="smartnav-desktop-indoor-ui">
        {/* Horizontal Floor Selector */}
        <div className="floor-selector" role="toolbar" aria-label="Indoor floor selector">
          {FLOORS.map((f) => {
            const isActive = f.value === activeFloorNum;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => handleFloorSelect(f.value)}
                className={`fs-item ${isActive ? "active" : ""}`}
                aria-pressed={isActive}
                aria-label={`Switch to ${f.name}`}
              >
                <div className="n">{f.code}</div>
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Building Tag */}
        <div className="building-tag2">
          <div className="n">{buildingName}</div>
          <div className="s">{desktopSubtitle}</div>
        </div>

        {/* Indoor Map Legend */}
        <div className="plan-legend">
          <div className="pl-row">
            <div className="sw2" style={{ background: "#E9A400" }} />
            Active route
          </div>
          <div className="pl-row">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 21V9l8-6 8 6v12" />
              <path d="M9 21v-6h6v6" />
            </svg>
            Destination room
          </div>
          <div className="pl-row">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 21h4v-4h4v-4h4V9h4V3" />
            </svg>
            Staircase
          </div>
          <div className="pl-row">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 21c-4.4-3.6-7-7-7-10a7 7 0 1 1 14 0c0 3-2.6 6.4-7 10z" />
              <circle cx="12" cy="11" r="2.4" />
            </svg>
            Your position
          </div>
        </div>
      </div>

      {/* MOBILE INDOOR FLOOR NAV */}
      <div className="smartnav-mobile-indoor-ui">
        {/* Mobile Building Tag */}
        <div className="m-buildingtag">
          <div className="n">{buildingName}</div>
          <div className="s">{mobileSubtitle}</div>
        </div>

        {/* Mobile Vertical Floor Selector */}
        <div className="m-floorsel" role="toolbar" aria-label="Mobile floor selector">
          {FLOORS.map((f) => {
            const isActive = f.value === activeFloorNum;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => handleFloorSelect(f.value)}
                className={`m-floorsel-btn ${isActive ? "active" : ""}`}
                aria-pressed={isActive}
                aria-label={`Switch to ${f.name}`}
              >
                {f.code}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

function getStageFallback(floor) {
  switch (Number(floor)) {
    case 0:
      return NAVIGATION_STAGE.GROUND_FLOOR;
    case 1:
      return NAVIGATION_STAGE.FIRST_FLOOR;
    case 2:
      return NAVIGATION_STAGE.SECOND_FLOOR;
    case 3:
      return NAVIGATION_STAGE.THIRD_FLOOR;
    default:
      return NAVIGATION_STAGE.GROUND_FLOOR;
  }
}

function BuildingIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="24"
      height="24"
    >
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M8 10h.01" />
      <path d="M16 10h.01" />
      <path d="M8 14h.01" />
      <path d="M16 14h.01" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="18"
      height="18"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
