import useCurrentBuilding from "../../hooks/useCurrentBuilding";
import useIndoorEntry from "../../hooks/useIndoorEntry";
import { useNavigationStage } from "../../hooks/useNavigationStage";
import { useFloorTransition } from "../../hooks/useFloorTransition";
import { useDestinationArrival } from "../../hooks/useDestinationArrival";

/**
 * Headless controller that manages navigation lifecycle hooks across routes.
 *
 * Mounted persistently inside MainLayout so that building detection, indoor entry,
 * outdoor/indoor stage transitions, floor transitions, and room arrival
 * continue executing seamlessly across React Router page changes (e.g. '/' and building routes).
 */
export default function NavigationLifecycleController() {
  useCurrentBuilding();
  useIndoorEntry();
  useNavigationStage();
  useFloorTransition();
  useDestinationArrival();

  return null;
}
