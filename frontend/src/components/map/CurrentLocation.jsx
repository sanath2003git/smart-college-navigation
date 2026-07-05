import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { demoLocation } from "../../data/demoLocation";

const userIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width:18px;
      height:18px;
      background:#2563eb;
      border:3px solid white;
      border-radius:50%;
      box-shadow:0 0 10px rgba(37,99,235,0.8);
    "></div>
  `,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export default function CurrentLocation() {
  return (
    <Marker
      position={[demoLocation.lat, demoLocation.lng]}
      icon={userIcon}
    >
      <Popup>
        <b>You are here (Demo)</b>
        <br />
        {demoLocation.name}
      </Popup>
    </Marker>
  );
}