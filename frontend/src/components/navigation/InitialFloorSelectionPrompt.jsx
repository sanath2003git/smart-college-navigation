import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNavigation } from "../../hooks/useNavigation";
import { BUILDING_CONFIGS } from "../../constants/buildingConfigs";
import { FLOORS } from "./FloorSelector";

/**
 * Global Initial Floor Selection Prompt (Modal on desktop, Bottom Sheet on mobile).
 * Appears when SmartNav detects the user is inside a building with indoor floor data.
 * Upon confirming the floor, it hands off navigation to the building's dedicated page.
 */
export default function InitialFloorSelectionPrompt() {
  const navigate = useNavigate();
  const {
    initialFloorSelection,
    confirmInitialFloorSelection,
    cancelInitialFloorSelection,
  } = useNavigation();

  const [selectedInitialFloor, setSelectedInitialFloor] = useState(null);

  const isInitialOpen = Boolean(initialFloorSelection?.open);

  // Reset selection whenever the prompt opens
  useEffect(() => {
    if (isInitialOpen) {
      setSelectedInitialFloor(null);
    }
  }, [isInitialOpen]);

  if (!isInitialOpen) {
    return null;
  }

  const initialBuilding = initialFloorSelection?.building || "Mechanical Block";
  const initialBuildingName =
    typeof initialBuilding === "string"
      ? initialBuilding
      : initialBuilding?.properties?.name || "Mechanical Block";

  const config = BUILDING_CONFIGS[initialBuildingName];
  const available =
    config?.availableFloors && config.availableFloors.length > 0
      ? config.availableFloors
      : [0, 1, 2, 3];
  const floorsToDisplay = FLOORS.filter((f) => available.includes(f.value));

  const selectedFloorObj = FLOORS.find((f) => f.value === selectedInitialFloor);

  const handleConfirmInitial = () => {
    if (selectedInitialFloor === null || selectedInitialFloor === undefined) {
      return;
    }

    if (confirmInitialFloorSelection) {
      confirmInitialFloorSelection(selectedInitialFloor);
    }

    const targetRoute = config?.route;
    if (targetRoute) {
      navigate(targetRoute, { state: { floor: selectedInitialFloor } });
    }
  };

  const handleCancelInitial = () => {
    if (cancelInitialFloorSelection) {
      cancelInitialFloorSelection();
    }
  };

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

          {/* Floor selection buttons */}
          <div className="init-floor-selector-container">
            <div
              className="floor-selector init-inline-floorsel"
              role="radiogroup"
              aria-label="Floor selection"
            >
              {floorsToDisplay.map((f) => {
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
              {floorsToDisplay.map((f) => {
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
