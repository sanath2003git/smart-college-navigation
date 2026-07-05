import Navbar from "./Navbar";
import Footer from "./Footer";
import SearchBar from "../search/SearchBar";
import Sidebar from "../sidebar/Sidebar";

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-100">

      <Navbar />

      <SearchBar />

      <div className="flex flex-1">

        <Sidebar />

        <main className="flex-1">
          {children}
        </main>

      </div>

      <Footer />

    </div>
  );
}