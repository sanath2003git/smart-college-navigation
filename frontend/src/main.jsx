import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/react";
import "leaflet/dist/leaflet.css";

import App from "./App";
import "./index.css";

import { NavigationProvider } from "./context/NavigationProvider";
import { LocationProvider } from "./context/LocationContext";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <BrowserRouter>
        <NavigationProvider>
          <LocationProvider>
            <App />
          </LocationProvider>
        </NavigationProvider>
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>
);
