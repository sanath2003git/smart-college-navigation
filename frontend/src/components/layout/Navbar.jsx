import { NavLink } from "react-router-dom";

export default function Navbar() {
  const navLinkClass = ({ isActive }) =>
    `transition-colors duration-200 ${
      isActive
        ? "text-blue-600 font-semibold"
        : "text-gray-700 hover:text-blue-600"
    }`;

  return (
    <header className="sticky top-0 z-50 bg-white border-b shadow-md">
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between px-6 py-4">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="text-4xl">🏫</div>

          <div>
            <h1 className="text-xl font-bold text-blue-700">
              Smart College Navigation
            </h1>

            <p className="text-sm text-gray-500">
              TKM College of Engineering
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">

          <NavLink to="/" className={navLinkClass}>
            Campus
          </NavLink>

          <NavLink to="/mechanical" className={navLinkClass}>
            Mechanical
          </NavLink>

          <NavLink to="/chemical" className={navLinkClass}>
            Chemical
          </NavLink>

          <NavLink to="/main" className={navLinkClass}>
            Main Block
          </NavLink>

          <NavLink to="/library" className={navLinkClass}>
            Library
          </NavLink>

        </nav>

        {/* User Avatar */}
        <button className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 transition">
          S
        </button>

      </div>
    </header>
  );
}