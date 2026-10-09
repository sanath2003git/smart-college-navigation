import { useNavigation } from "../../hooks/useNavigation";
import { NAVIGATION_STAGE } from "../../constants/navigationStages";

const FLOORS = [
  { value: 0, code: "GF", label: "Ground", name: "Ground Floor" },
  { value: 1, code: "FF", label: "First", name: "First Floor" },
  { value: 2, code: "SF", label: "Second", name: "Second Floor" },
  { value: 3, code: "TF", label: "Third", name: "Third Floor" },
];

export default function FloorSelector() {
  const {
    navigationStage,
    setNavigationStage,
    selectedBuilding,
    setSelectedBuilding,
    currentBuilding,
    currentFloor,
    setCurrentFloor,
    getNavigationStageForFloor,
  } = useNavigation();

  // Only render when inside an indoor floor view
  const isIndoor = navigationStage !== NAVIGATION_STAGE.OUTDOOR;
  if (!isIndoor) {
    return null;
  }

  const buildingName =
    typeof selectedBuilding === "string"
      ? selectedBuilding
      : selectedBuilding?.properties?.name ||
        currentBuilding ||
        "Mechanical Block";

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
      {/* =========================================================
          DESKTOP INDOOR FLOOR NAV (Screen 4)
      ========================================================= */}
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

      {/* =========================================================
          MOBILE INDOOR FLOOR NAV (Screen 4 Mobile)
      ========================================================= */}
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
