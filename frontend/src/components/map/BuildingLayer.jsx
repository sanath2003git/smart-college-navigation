import { GeoJSON } from "react-leaflet";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function BuildingLayer() {
  const [buildings, setBuildings] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/data/buildings.geojson")
      .then((response) => response.json())
      .then((data) => setBuildings(data))
      .catch((error) =>
        console.error("Error loading buildings.geojson:", error)
      );
  }, []);

  function onEachFeature(feature, layer) {
    const props = feature.properties;

    // Popup
    layer.bindPopup(`
      <div style="min-width:180px">
        <h3 style="margin:0 0 8px 0;">${props.name}</h3>
        <p><strong>Type:</strong> ${props.building_type}</p>
        <p><strong>Floors:</strong> ${props.floors}</p>
        <p>${props.description}</p>
      </div>
    `);

    // Hover effect
    layer.on("mouseover", function () {
      layer.setStyle({
        fillOpacity: 0.8,
        weight: 3,
      });
    });

    layer.on("mouseout", function () {
      layer.setStyle({
        fillOpacity: 0.5,
        weight: 2,
      });
    });

    // Click navigation
    layer.on("click", function () {
      switch (props.name) {
        case "Mechanical Block":
          navigate("/mechanical");
          break;

        case "Chemical Block":
          navigate("/chemical");
          break;

        case "Main Block":
          navigate("/main");
          break;

        case "Central Library":
          navigate("/library");
          break;

        case "Workshop Block":
          navigate("/workshop");
          break;

        case "Workshop (Electrical)":
          navigate("/electrical-workshop");
          break;

        case "Architecture Block":
          navigate("/architecture");
          break;

        case "Interdisciplinary Research Block (RUSA)":
          navigate("/research");
          break;

        default:
          alert(props.name);
      }
    });
  }

  if (!buildings) return null;

  return (
    <GeoJSON
      data={buildings}
      style={{
        color: "#c62828",
        weight: 2,
        fillColor: "#f44336",
        fillOpacity: 0.5,
      }}
      onEachFeature={onEachFeature}
    />
  );
}