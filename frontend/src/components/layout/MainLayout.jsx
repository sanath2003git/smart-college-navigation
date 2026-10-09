import Navbar from "./Navbar";
import SearchBar from "../controls/SearchBar";
import ActiveNavigationPanel from "../navigation/ActiveNavigationPanel";
import { useNavigation } from "../../hooks/useNavigation";

export default function MainLayout({ children }) {
  const { route, destination } = useNavigation();
  const isNavigating = Boolean(route && route.length > 0 && destination);

  return (
    <div className="smartnav-app">
      <Navbar />

      <main className="smartnav-content">
        <div className="smartnav-map-area">
          {children}
        </div>

        {isNavigating ? (
          <ActiveNavigationPanel />
        ) : (
          <SearchBar />
        )}
      </main>
    </div>
  );
}