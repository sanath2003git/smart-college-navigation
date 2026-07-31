import { useEffect } from "react";
import { useNavigation } from "./useNavigation";
import { loadBuildings } from "../navigation/loadBuildings";
import { detectCurrentBuilding } from "../navigation/buildingDetection";

export default function useCurrentBuilding() {
  const {
    currentLocation,
    currentBuilding,
    setCurrentBuilding,
  } = useNavigation();

  useEffect(() => {
    if (!currentLocation) return;

    // Building detection logic will be added here.
    async function detectBuilding() {
  const buildings = await loadBuildings();
  console.log(
  "Loaded buildings:",
  buildings.features.map((b) => ({
    id: b.properties.id,
    name: b.properties.name,
  }))
);

  console.log(
    "Building Features:",
    buildings.features.length
  );

  const building = detectCurrentBuilding(
  currentLocation,
  buildings
);

const detectedBuilding =
  building?.properties.name ?? null;

if (detectedBuilding !== currentBuilding) {
  if (detectedBuilding) {
    console.log(
      "Current Building:",
      detectedBuilding
    );
  } else {
    console.log("Outside all buildings");
  }

  setCurrentBuilding(detectedBuilding);
}
}

  detectBuilding();
}, [currentLocation, currentBuilding,setCurrentBuilding]);
}