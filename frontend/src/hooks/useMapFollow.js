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
  // Stop following when user manually pans
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
  // Follow current GPS location
  // ==========================================

  useEffect(() => {
    if (!isFollowing || !location) return;

    const mapSize = map.getSize();

    // Put the user slightly below the
    // vertical center of the screen.
    const verticalOffset = mapSize.y * 0.12;

    const targetPoint = map.latLngToContainerPoint([
      location.lat,
      location.lng,
    ]);

    targetPoint.y += verticalOffset;

    const targetLatLng =
      map.containerPointToLatLng(targetPoint);

    map.panTo(targetLatLng, {
      animate: true,
      duration: 0.4,
    });
  }, [map, location, isFollowing]);

  // ==========================================
  // Start following
  // ==========================================

  const startFollowing = useCallback(() => {
    if (!location) return;

    isFollowingRef.current = true;
    setIsFollowing(true);

    const mapSize = map.getSize();

    const verticalOffset = mapSize.y * 0.12;

    const targetPoint = map.latLngToContainerPoint([
      location.lat,
      location.lng,
    ]);

    targetPoint.y += verticalOffset;

    const targetLatLng =
      map.containerPointToLatLng(targetPoint);

    map.panTo(targetLatLng, {
      animate: true,
      duration: 0.8,
    });
  }, [map, location]);

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