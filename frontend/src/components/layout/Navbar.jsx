import { useState, useRef, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useUser, SignOutButton } from "@clerk/react";
import {
  Compass,
  Map,
  Calendar,
  Wrench,
  FlaskConical,
  Landmark,
  BookOpen,
  Shield,
  LogOut,
} from "lucide-react";


const NAV_ITEMS = [
  { to: "/", label: "Campus", icon: Compass, exact: true },
  { to: "/events", label: "Events", icon: Calendar },
  { to: "/mechanical", label: "Mechanical", icon: Wrench },
  { to: "/chemical", label: "Chemical", icon: FlaskConical },
  { to: "/main", label: "Main Block", icon: Landmark },
  { to: "/library", label: "Library", icon: BookOpen },
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const userButtonRef = useRef(null);
  const location = useLocation();
  const { isSignedIn, user } = useUser();

  const navLinkClass = ({ isActive }) =>
    `smartnav-navbar-link ${
      isActive ? "smartnav-navbar-link-active" : ""
    }`;

  // Automatically dismiss mobile menu when location changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Dismiss menu on outside click or Escape key press
  useEffect(() => {
    if (!isMenuOpen) return;

    function handleClickOutside(event) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        userButtonRef.current &&
        !userButtonRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        userButtonRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

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

        {/* Desktop Navigation (Preserved) */}
        <nav
          className="smartnav-navbar-nav"
          aria-label="Desktop primary navigation"
        >
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={navLinkClass}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right side actions & User/Mobile Navigation Menu */}
        <div className="smartnav-navbar-actions">
          <button
            type="button"
            className="smartnav-map-status"
            aria-label="Campus map status"
          >
            <Map size={17} />
            <span>Campus Map</span>
          </button>

          {/* User button triggers mobile navigation popover */}
          <div className="smartnav-user-menu-wrapper">
            <button
              ref={userButtonRef}
              type="button"
              className={`smartnav-user-button ${
                isMenuOpen ? "smartnav-user-button--active" : ""
              } ${isSignedIn ? "smartnav-user-button--signed-in" : ""}`}
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-label="Campus navigation and account menu"
              aria-expanded={isMenuOpen}
              aria-haspopup="menu"
              aria-controls="smartnav-mobile-dropdown"
              id="smartnav-user-menu-trigger"
            >
              {isSignedIn && user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={user.fullName || "User"}
                  className="smartnav-user-button-avatar"
                />
              ) : isSignedIn && user?.firstName ? (
                user.firstName[0].toUpperCase()
              ) : (
                "S"
              )}
            </button>

            {isMenuOpen && (
              <div
                ref={menuRef}
                id="smartnav-mobile-dropdown"
                className="smartnav-mobile-menu"
                role="menu"
                aria-labelledby="smartnav-user-menu-trigger"
              >
                {/* User / Account Card */}
                <div className="smartnav-mobile-menu__profile">
                  <div
                    className="smartnav-mobile-menu__avatar"
                    aria-hidden="true"
                  >
                    {isSignedIn && user?.imageUrl ? (
                      <img
                        src={user.imageUrl}
                        alt="Avatar"
                        className="smartnav-user-button-avatar"
                      />
                    ) : isSignedIn && user?.firstName ? (
                      user.firstName[0].toUpperCase()
                    ) : (
                      "S"
                    )}
                  </div>
                  <div className="smartnav-mobile-menu__user-info">
                    <p className="smartnav-mobile-menu__user-title">
                      {isSignedIn
                        ? user.fullName || "Administrator"
                        : "Student Portal"}
                    </p>
                    <p className="smartnav-mobile-menu__user-sub">
                      {isSignedIn
                        ? user.primaryEmailAddress?.emailAddress || "Admin Session"
                        : "TKM College of Engineering"}
                    </p>
                  </div>
                </div>

                {/* Primary Navigation Section */}
                <div className="smartnav-mobile-menu__section">
                  <div className="smartnav-mobile-menu__section-header">
                    <span>Campus Navigation</span>
                  </div>

                  <nav
                    className="smartnav-mobile-menu__nav"
                    aria-label="Mobile destinations"
                  >
                    {NAV_ITEMS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end={item.exact}
                          role="menuitem"
                          className={({ isActive }) =>
                            `smartnav-mobile-menu__link ${
                              isActive
                                ? "smartnav-mobile-menu__link--active"
                                : ""
                            }`
                          }
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <span
                            className="smartnav-mobile-menu__link-icon"
                            aria-hidden="true"
                          >
                            <Icon size={17} />
                          </span>
                          <span className="smartnav-mobile-menu__link-text">
                            {item.label}
                          </span>
                          <span
                            className="smartnav-mobile-menu__link-badge"
                            aria-hidden="true"
                          />
                        </NavLink>
                      );
                    })}
                  </nav>
                </div>

                {/* Extensible Admin Slot (Reused for Clerk Admin Portal) */}
                <div className="smartnav-mobile-menu__admin-slot">
                  <div className="smartnav-mobile-menu__section-header">
                    <span>Administration</span>
                  </div>

                  <NavLink
                    to="/admin"
                    role="menuitem"
                    className={({ isActive }) =>
                      `smartnav-mobile-menu__link ${
                        isActive
                          ? "smartnav-mobile-menu__link--active"
                          : ""
                      }`
                    }
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span
                      className="smartnav-mobile-menu__link-icon text-teal-600"
                      aria-hidden="true"
                    >
                      <Shield size={17} />
                    </span>
                    <span className="smartnav-mobile-menu__link-text font-medium">
                      Admin Portal
                    </span>
                    <span className="smartnav-mobile-menu__admin-badge">
                      {isSignedIn ? "Signed In" : "Sign In"}
                    </span>
                  </NavLink>

                  {isSignedIn && (
                    <NavLink
                      to="/admin/events"
                      role="menuitem"
                      className={({ isActive }) =>
                        `smartnav-mobile-menu__link ${
                          isActive
                            ? "smartnav-mobile-menu__link--active"
                            : ""
                        }`
                      }
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span
                        className="smartnav-mobile-menu__link-icon text-teal-600"
                        aria-hidden="true"
                      >
                        <Calendar size={17} />
                      </span>
                      <span className="smartnav-mobile-menu__link-text font-medium">
                        Event Dashboard
                      </span>
                    </NavLink>
                  )}

                  {isSignedIn && (
                    <div className="smartnav-mobile-menu__signout-wrap">
                      <SignOutButton>
                        <button
                          type="button"
                          className="smartnav-mobile-menu__signout-btn"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <LogOut size={15} />
                          <span>Sign Out</span>
                        </button>
                      </SignOutButton>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
