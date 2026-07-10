import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "leaflet/dist/leaflet.css";

import App from "./App";
import "./index.css";

import { NavigationProvider } from "./context/NavigationProvider";
import { LocationProvider } from "./context/LocationContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <NavigationProvider>
        <LocationProvider>
          <App />
        </LocationProvider>
      </NavigationProvider>
    </BrowserRouter>
  </React.StrictMode>
);