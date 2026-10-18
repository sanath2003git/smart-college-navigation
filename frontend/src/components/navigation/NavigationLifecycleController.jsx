import { useEffect } from "react";
import useCurrentBuilding from "../../hooks/useCurrentBuilding";
import useIndoorEntry from "../../hooks/useIndoorEntry";
import { useNavigationStage } from "../../hooks/useNavigationStage";
import { useFloorTransition } from "../../hooks/useFloorTransition";
import { useDestinationArrival } from "../../hooks/useDestinationArrival";
import { useLocation } from "../../hooks/useLocation";
import { useNavigation } from "../../hooks/useNavigation";

/**
 * Headless controller that manages navigation lifecycle hooks across routes.
 *
 * Mounted persistently inside MainLayout so that building detection, indoor entry,
 * outdoor/indoor stage transitions, floor transitions, and room arrival
 * continue executing seamlessly across React Router page changes (e.g. '/' and building routes).
 */
export default function NavigationLifecycleController() {
  const { rawLocation } = useLocation();
  const { setCurrentLocation } = useNavigation();

  // Continuously sync raw GPS location into navigation context across all pages
  useEffect(() => {
    if (!rawLocation || !setCurrentLocation) return;
    setCurrentLocation((prev) => {
      if (
        prev &&
        prev.lat === rawLocation.lat &&
        prev.lng === rawLocation.lng &&
        prev.accuracy === rawLocation.accuracy
      ) {
        return prev;
      }
      return rawLocation;
    });
  }, [rawLocation, setCurrentLocation]);

  useCurrentBuilding();
  useIndoorEntry();
  useNavigationStage();
  useFloorTransition();
  useDestinationArrival();

  return null;
}
