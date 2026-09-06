import Navbar from "./Navbar";
import SearchBar from "../controls/SearchBar";

export default function MainLayout({ children }) {
  return (
    <div className="smartnav-app">
      <Navbar />

      <SearchBar />

      <div className="smartnav-main">
        <main className="flex-1 min-w-0 min-h-0 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}