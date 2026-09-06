import { NavLink } from "react-router-dom";
import { Compass } from "lucide-react";

export default function Navbar() {
  const navLinkClass = ({ isActive }) =>
    `
      relative px-3 py-2 text-sm font-medium transition-all duration-200
      ${
        isActive
          ? "text-blue-600"
          : "text-slate-500 hover:text-slate-900"
      }
    `;

  return (
    <header className="z-50 shrink-0 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-[76px] max-w-[1920px] items-center justify-between px-4 md:px-6">

        {/* Brand */}
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="
              flex h-11 w-11 shrink-0 items-center justify-center
              rounded-2xl bg-slate-900 text-white shadow-lg
            "
          >
            <Compass size={22} />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-base font-bold tracking-tight text-slate-900 md:text-lg">
              Smart College Navigation
            </h1>

            <p className="truncate text-xs text-slate-500 md:text-sm">
              TKM College of Engineering
            </p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 lg:flex">
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

        {/* User */}
        <button
          className="
            flex h-11 w-11 shrink-0 items-center justify-center
            rounded-full bg-blue-600 text-sm font-bold text-white
            shadow-md transition hover:bg-blue-700 hover:shadow-lg
          "
          aria-label="User profile"
        >
          S
        </button>

      </div>
    </header>
  );
}