import { Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import { useLocation } from "../../hooks/useLocation";

const userIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width:18px;
      height:18px;
      background:#2563eb;
      border:3px solid white;
      border-radius:50%;
      box-shadow:0 0 10px rgba(37,99,235,.8);
    "></div>
  `,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export default function CurrentLocation() {
  const { location } = useLocation();

  if (!location) return null;

  return (
    <>
      <Circle
        center={[location.lat, location.lng]}
        radius={location.accuracy}
        pathOptions={{
          color: "#2563eb",
          fillColor: "#2563eb",
          fillOpacity: 0.15,
        }}
      />

      <Marker
        position={[location.lat, location.lng]}
        icon={userIcon}
      >
        <Popup>
          <b>Your Current Location</b>

          <br />

          Latitude:
          <br />
          {location.lat}

          <br />
          <br />

          Longitude:
          <br />
          {location.lng}

          <br />
          <br />

          Accuracy:
          <br />
          {Math.round(location.accuracy)} m
        </Popup>
      </Marker>
    </>
  );
}