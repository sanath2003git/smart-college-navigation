import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import SearchBar from "../controls/SearchBar";
import ActiveNavigationPanel from "../navigation/ActiveNavigationPanel";
import NavigationLifecycleController from "../navigation/NavigationLifecycleController";
import { useNavigation } from "../../hooks/useNavigation";

export default function MainLayout({ children }) {
  const { route, destination } = useNavigation();
  const location = useLocation();
  const isNavigating = Boolean(route && route.length > 0 && destination);
  const isEventsPage = location.pathname.startsWith("/events");
  const isAdminPage = location.pathname.startsWith("/admin");
  const isScrollableContent = isEventsPage || isAdminPage;

  return (
    <div className="smartnav-app">
      <NavigationLifecycleController />
      <Navbar />

      <main className="smartnav-content">
        <div
          className={`smartnav-map-area ${
            isScrollableContent ? "smartnav-events-scrollable" : ""
          }`}
        >
          {children}
        </div>

        {isNavigating ? (
          <ActiveNavigationPanel />
        ) : !isScrollableContent ? (
          <SearchBar />
        ) : null}
      </main>
    </div>
  );

}