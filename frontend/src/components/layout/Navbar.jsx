import { NavLink } from "react-router-dom";
import { Compass, Map } from "lucide-react";

export default function Navbar() {
  const navLinkClass = ({ isActive }) =>
    `smartnav-navbar-link ${
      isActive ? "smartnav-navbar-link-active" : ""
    }`;

  return (
    <header className="smartnav-navbar">
      <div className="smartnav-navbar-inner">

        {/* Brand */}
        <NavLink
          to="/"
          className="smartnav-brand"
          aria-label="Smart College Navigation home"
        >
          <div className="smartnav-brand-icon">
            <Compass size={22} strokeWidth={2.2} />
          </div>

          <div className="smartnav-brand-text">
            <h1>Smart College Navigation</h1>
            <p>TKM College of Engineering</p>
          </div>
        </NavLink>

        {/* Desktop Navigation */}
        <nav className="smartnav-navbar-nav">
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

        {/* Right side */}
        <div className="smartnav-navbar-actions">
          <button
            type="button"
            className="smartnav-map-status"
            aria-label="Campus map"
          >
            <Map size={17} />
            <span>Campus Map</span>
          </button>

          <button
            type="button"
            className="smartnav-user-button"
            aria-label="User profile"
          >
            S
          </button>
        </div>

      </div>
    </header>
  );
}