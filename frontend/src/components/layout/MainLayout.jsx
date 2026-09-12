import Navbar from "./Navbar";
import SearchBar from "../controls/SearchBar";

export default function MainLayout({ children }) {
  return (
    <div className="smartnav-app">
      <Navbar />

      <main className="smartnav-content">
        <div className="smartnav-map-area">
          {children}
        </div>

        <SearchBar />
      </main>
    </div>
  );
}