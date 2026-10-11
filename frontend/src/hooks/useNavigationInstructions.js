import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigation } from "./useNavigation";
import { NAVIGATION_STAGE } from "../constants/navigationStages";
import {
  generateRouteInstructions,
  getRouteProgress,
  formatDistance,
  calculateETA,
} from "../services/navigationInstructionService";
import {
  speak,
  repeatLastInstruction,
  cancelSpeech,
  resetVoiceGuidance,
  isVoiceMuted,
  setVoiceMuted,
} from "../services/voiceService";

/**
 * Custom hook that generates turn-by-turn navigation instructions from route geometry,
 * tracks real-time progress using GPS coordinates, and coordinates voice announcements.
 */
export function useNavigationInstructions() {
  const {
    route,
    destination,
    navigationStage,
    currentFloor,
    currentLocation,
    targetEntrance,
    targetStair,
  } = useNavigation();

  // Track muted state in component state for responsive UI re-renders
  const [muted, setMutedState] = useState(() => isVoiceMuted());

  const toggleMute = useCallback(() => {
    setMutedState((prev) => {
      const next = !prev;
      setVoiceMuted(next);
      return next;
    });
  }, []);

  // Track which maneuvers have already had audio announcements to prevent duplicate / spam speech
  const spokenAnnouncementsRef = useRef(new Set());
  const lastPassedNodeIndexRef = useRef(0);
  const previousRouteKeyRef = useRef("");

  // 1. Generate full instruction list from geometry whenever route or targets change
  const instructions = useMemo(() => {
    if (!route || route.length < 2 || !destination) {
      return [];
    }
    return generateRouteInstructions({
      route,
      navigationStage,
      destination,
      targetEntrance,
      targetStair,
      currentFloor,
    });
  }, [
    route,
    navigationStage,
    destination,
    targetEntrance,
    targetStair,
    currentFloor,
  ]);

  // Reset announcement tracking when route identity changes
  const currentRouteKey = useMemo(() => {
    if (!route || route.length === 0) return "";
    return `${navigationStage}_${currentFloor}_${route[0]}_${route[route.length - 1]}`;
  }, [route, navigationStage, currentFloor]);

  useEffect(() => {
    if (currentRouteKey !== previousRouteKeyRef.current) {
      previousRouteKeyRef.current = currentRouteKey;
      spokenAnnouncementsRef.current.clear();
      lastPassedNodeIndexRef.current = 0;
    }
  }, [currentRouteKey]);

  // 2. Calculate real-time progress along route based on GPS location
  const progress = useMemo(() => {
    if (instructions.length === 0) {
      return {
        activeInstructionIndex: 0,
        activeInstruction: null,
        nextInstruction: null,
        distanceToNextAction: null,
        remainingTotalDistance: null,
        closestNodeIndex: 0,
      };
    }

    const res = getRouteProgress({
      route,
      instructions,
      currentLocation,
      lastPassedNodeIndex: lastPassedNodeIndexRef.current,
    });

    if (res.closestNodeIndex > lastPassedNodeIndexRef.current) {
      lastPassedNodeIndexRef.current = res.closestNodeIndex;
    }

    return res;
  }, [route, instructions, currentLocation]);

  const {
    activeInstruction,
    nextInstruction,
    distanceToNextAction,
    remainingTotalDistance,
  } = progress;

  // 3. Voice guidance coordinator: trigger announcements strictly on meaningful progress milestones
  useEffect(() => {
    if (!activeInstruction || instructions.length === 0 || !route || route.length < 2) {
      return;
    }

    const announcedSet = spokenAnnouncementsRef.current;

    // A. Announce the start of the current route segment once
    const startKey = `${currentRouteKey}_started`;
    if (!announcedSet.has(startKey)) {
      announcedSet.add(startKey);
      // Give initial overview instruction
      const firstManeuver = instructions[0];
      if (firstManeuver) {
        const prefix =
          navigationStage === NAVIGATION_STAGE.OUTDOOR
            ? "Navigation started. "
            : "";
        speak(
          `${prefix}${firstManeuver.spokenExecText || firstManeuver.primaryText}`,
          { queue: true }
        );
      }
      return;
    }

    // B. Maneuver approach announcement (15m to 30m before turn)
    if (
      activeInstruction.type !== "STRAIGHT" &&
      activeInstruction.type !== "ARRIVE" &&
      activeInstruction.type !== "ENTER_BUILDING" &&
      activeInstruction.type !== "PROCEED_TO_STAIRS"
    ) {
      const approachKey = `${activeInstruction.id}_approach`;
      if (
        distanceToNextAction !== null &&
        distanceToNextAction <= 30 &&
        distanceToNextAction >= 12 &&
        !announcedSet.has(approachKey)
      ) {
        announcedSet.add(approachKey);
        speak(
          `In ${Math.round(distanceToNextAction)} meters, ${activeInstruction.actionTitle.toLowerCase()}.`
        );
        return;
      }

      // C. Turn execution announcement (within 8 meters of vertex)
      const execKey = `${activeInstruction.id}_exec`;
      if (
        distanceToNextAction !== null &&
        distanceToNextAction <= 8 &&
        !announcedSet.has(execKey)
      ) {
        announcedSet.add(execKey);
        speak(activeInstruction.spokenExecText || activeInstruction.primaryText);
        return;
      }
    }
  }, [
    activeInstruction,
    distanceToNextAction,
    instructions,
    route,
    currentRouteKey,
  ]);

  // Clean up when navigation stops
  useEffect(() => {
    if (!route || route.length === 0 || !destination) {
      spokenAnnouncementsRef.current.clear();
      lastPassedNodeIndexRef.current = 0;
      cancelSpeech();
    }
  }, [route, destination]);

  // 4. Repeat instruction on user command
  const repeatCurrentInstruction = useCallback(() => {
    if (!activeInstruction) {
      repeatLastInstruction();
      return;
    }

    let repeatText = activeInstruction.primaryText;
    if (
      distanceToNextAction !== null &&
      distanceToNextAction > 10 &&
      activeInstruction.type !== "ARRIVE"
    ) {
      repeatText = `In ${Math.round(distanceToNextAction)} meters, ${activeInstruction.primaryText.toLowerCase()}`;
    }

    speak(repeatText, { force: true });
  }, [activeInstruction, distanceToNextAction]);

  return {
    instructions,
    currentInstruction: activeInstruction,
    nextInstruction,
    distanceToNextAction,
    remainingTotalDistance,
    formattedDistance: formatDistance(remainingTotalDistance),
    formattedNextDistance: formatDistance(distanceToNextAction),
    formattedETA: calculateETA(remainingTotalDistance),
    isMuted: muted,
    toggleMute,
    repeatInstruction: repeatCurrentInstruction,
  };
}
