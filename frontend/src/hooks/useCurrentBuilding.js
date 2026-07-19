import { useEffect } from "react";
import { useNavigation } from "./useNavigation";
import { loadBuildings } from "../navigation/loadBuildings";


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
      "Building Features:",
      buildings.features.length
    );
  }

  detectBuilding();
}, [currentLocation, currentBuilding, setCurrentBuilding]);
}