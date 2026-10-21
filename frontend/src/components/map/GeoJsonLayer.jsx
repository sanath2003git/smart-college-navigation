import { useEffect, useState } from "react";
import { GeoJSON } from "react-leaflet";
import L from "leaflet";

export default function GeoJsonLayer({
  url,
  style,
  pointToLayer,
  onEachFeature,
  interactive = true,
  labelProperty = null,
  labelClassName = "smartnav-building-label",
}) {
  const [data, setData] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(
            `Failed to load ${url}: ${response.status}`
          );
        }

        const geojson = await response.json();

        if (mounted) {
          setData(geojson);
        }
      } catch (err) {
        console.error(
          `Error loading ${url}`,
          err
        );
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [url]);

  if (!data) {
    return null;
  }

  // ==========================================
  // Default point renderer
  // ==========================================

  const defaultPointToLayer = (
    feature,
    latlng
  ) =>
    L.circleMarker(latlng, {
      radius: 6,
      color: "#E9A400",
      fillColor: "#E9A400",
      fillOpacity: 1,
      weight: 2,
      interactive,
    });

  // ==========================================
  // Feature handler
  //
  // Keeps the existing building click/hover
  // behavior and optionally adds labels.
  // ==========================================

  const handleFeature = (
    feature,
    layer
  ) => {
    // ----------------------------------------
    // Existing feature interaction
    // ----------------------------------------

    if (onEachFeature) {
      onEachFeature(
        feature,
        layer
      );
    }

    // ----------------------------------------
    // Feature label (Buildings or Rooms)
    // ----------------------------------------

    if (labelProperty) {
      const label = resolveLabel(
        feature,
        labelProperty
      );

      if (label) {
        layer.bindTooltip(
          String(label),
          {
            permanent: true,
            direction: "center",
            className:
              labelClassName || "smartnav-building-label",
            interactive: false,
            opacity: 1,
          }
        );
      }
    }
  };

  return (
    <GeoJSON
      key={url}
      data={data}
      style={style}
      interactive={interactive}
      pointToLayer={
        pointToLayer ||
        defaultPointToLayer
      }
      onEachFeature={
        handleFeature
      }
    />
  );
}

// ==========================================
// Label Resolver Helper
//
// Resolves actual room number or room name
// from feature properties.
// ==========================================

function resolveLabel(feature, prop) {
  if (!feature || !feature.properties) return null;
  const props = feature.properties;

  if (typeof prop === "function") {
    return prop(feature);
  }

  if (Array.isArray(prop)) {
    for (const key of prop) {
      const val = props[key];
      if (val !== null && val !== undefined && String(val).trim() !== "") {
        return String(val).trim();
      }
    }
    return null;
  }

  if (typeof prop === "string") {
    const directVal = props[prop];
    if (directVal !== null && directVal !== undefined && String(directVal).trim() !== "") {
      return String(directVal).trim();
    }

    // Fallback for room layers: if room_no is not present or null on this feature
    // (e.g. stairs, lifts, corridors, porticos), fallback to name or room_name
    if (prop === "room_no" || prop === "room" || prop === "room_name") {
      const fallback = props.room_no || props.name || props.room_name;
      if (fallback !== null && fallback !== undefined && String(fallback).trim() !== "") {
        return String(fallback).trim();
      }
    }
  }

  return null;
}