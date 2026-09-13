import { useCallback, useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";

import { useLocation } from "./useLocation";

export default function useMapFollow() {
  const map = useMap();

  const { location } = useLocation();

  const [isFollowing, setIsFollowing] = useState(false);

  const isFollowingRef = useRef(false);

  // ==========================================
  // Keep ref synchronized with state
  // ==========================================

  useEffect(() => {
    isFollowingRef.current = isFollowing;
  }, [isFollowing]);

  // ==========================================
  // Calculate camera position
  // ==========================================

  const getFollowTarget = useCallback(
    (lat, lng) => {
      const mapSize = map.getSize();

      // Keep user slightly below center
      const verticalOffset = mapSize.y * 0.12;

      const userPoint = map.latLngToContainerPoint([
        lat,
        lng,
      ]);

      userPoint.y += verticalOffset;

      return map.containerPointToLatLng(userPoint);
    },
    [map]
  );

  // ==========================================
  // Stop following when user manually drags
  // ==========================================

  useEffect(() => {
    const handleDragStart = () => {
      if (!isFollowingRef.current) return;

      isFollowingRef.current = false;
      setIsFollowing(false);
    };

    map.on("dragstart", handleDragStart);

    return () => {
      map.off("dragstart", handleDragStart);
    };
  }, [map]);

  // ==========================================
  // Follow GPS location
  // ==========================================

  useEffect(() => {
    if (!isFollowing || !location) return;

    const targetLatLng = getFollowTarget(
      location.lat,
      location.lng
    );

    // GPS updates only move the camera.
    // Current zoom level is preserved.
    map.panTo(targetLatLng, {
      animate: true,
      duration: 0.4,
    });
  }, [
    map,
    location,
    isFollowing,
    getFollowTarget,
  ]);

  // ==========================================
  // Start following / Re-center
  // ==========================================

  const startFollowing = useCallback(() => {
    if (!location) return;

    isFollowingRef.current = true;
    setIsFollowing(true);

    const targetLatLng = getFollowTarget(
      location.lat,
      location.lng
    );

    // Re-center always restores the
    // navigation zoom level.
    map.flyTo(
      targetLatLng,
      21.5,
      {
        animate: true,
        duration: 1.2,
      }
    );
  }, [
    map,
    location,
    getFollowTarget,
  ]);

  // ==========================================
  // Stop following
  // ==========================================

  const stopFollowing = useCallback(() => {
    isFollowingRef.current = false;
    setIsFollowing(false);
  }, []);

  return {
    isFollowing,
    startFollowing,
    stopFollowing,
  };
}