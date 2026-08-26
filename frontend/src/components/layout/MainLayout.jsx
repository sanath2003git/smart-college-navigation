import Navbar from "./Navbar";
import Footer from "./Footer";
import SearchBar from "../controls/SearchBar";
import Sidebar from "../sidebar/Sidebar";

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <Navbar />

      <SearchBar />

      <div className="flex flex-1 min-w-0">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>

      <Footer />
    </div>
  );
}