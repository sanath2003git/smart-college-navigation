export const FLOORS = [
  { value: 0, code: "GF", label: "Ground", name: "Ground Floor" },
  { value: 1, code: "FF", label: "First", name: "First Floor" },
  { value: 2, code: "SF", label: "Second", name: "Second Floor" },
  { value: 3, code: "TF", label: "Top", name: "Top Floor" },
];

/**
 * Vertical floor selector for building explorer pages.
 * Allows switching between mapped floors for buildings with indoor floor plans.
 */
export default function FloorSelector({
  mode = "explore",
  building,
  availableFloors = null,
  activeFloor = null,
  onFloorChange = null,
} = {}) {
  const floorsToDisplay =
    availableFloors && availableFloors.length > 0
      ? FLOORS.filter((f) => availableFloors.includes(f.value))
      : FLOORS;

  if (floorsToDisplay.length === 0) {
    return null;
  }

  const activeFloorNum = Number(activeFloor ?? 0);

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

  return (
    <div
      className="m-floorsel building-explorer-floorsel"
      role="toolbar"
      aria-label={`${exploreBuildingName} floor selector`}
    >
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
            title={f.name}
          >
            {f.code}
          </button>
        );
      })}
    </div>
  );
}
