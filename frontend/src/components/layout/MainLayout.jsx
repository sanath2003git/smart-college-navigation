import Navbar from "./Navbar";
import Footer from "./Footer";
import SearchBar from "../search/SearchBar";

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-100">

      <Navbar />

      <SearchBar />

      <main className="flex-1">
        {children}
      </main>

      <Footer />

    </div>
  );
}