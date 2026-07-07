import { useState } from "react";
import NavigationContext from "./NavigationContext";

export function NavigationProvider({ children }) {
  const [graph, setGraph] = useState(null);
  const [route, setRoute] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [destination, setDestination] = useState(null);

  return (
    <NavigationContext.Provider
      value={{
        graph,
        setGraph,
        route,
        setRoute,
        currentLocation,
        setCurrentLocation,
        destination,
        setDestination,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}