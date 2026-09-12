import {
  MapPinned,
  Navigation,
  Building2,
  Layers3,
  Star,
  Settings,
  ChevronLeft,
  ChevronRight,
  CircleDot,
} from "lucide-react";

import { useState } from "react";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  const menu = [
    {
      icon: MapPinned,
      label: "My Location",
      description: "View your position",
    },
    {
      icon: Navigation,
      label: "Navigate",
      description: "Find a destination",
      active: true,
    },
    {
      icon: Building2,
      label: "Buildings",
      description: "Explore campus buildings",
    },
    {
      icon: Layers3,
      label: "Layers",
      description: "Map information",
    },
    {
      icon: Star,
      label: "Favorites",
      description: "Saved places",
    },
    {
      icon: Settings,
      label: "Settings",
      description: "Application settings",
    },
  ];

  return (
    <aside
      className={`smartnav-sidebar ${
        collapsed ? "smartnav-sidebar-collapsed" : ""
      }`}
    >
      {/* Sidebar Header */}
      <div className="smartnav-sidebar-header">
        {!collapsed && (
          <div className="smartnav-sidebar-heading">
            <span>SMARTNAV</span>
            <h2>Explore Campus</h2>
          </div>
        )}

        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="smartnav-sidebar-toggle"
          aria-label={
            collapsed
              ? "Expand sidebar"
              : "Collapse sidebar"
          }
        >
          {collapsed ? (
            <ChevronRight size={18} />
          ) : (
            <ChevronLeft size={18} />
          )}
        </button>
      </div>

      {/* Menu */}
      <nav className="smartnav-sidebar-menu">
        {menu.map((item) => {
          const Icon = item.icon;

          return (
            <button
              type="button"
              key={item.label}
              title={collapsed ? item.label : undefined}
              className={`smartnav-sidebar-item ${
                item.active
                  ? "smartnav-sidebar-item-active"
                  : ""
              } ${
                collapsed
                  ? "smartnav-sidebar-item-collapsed"
                  : ""
              }`}
            >
              {item.active && (
                <span className="smartnav-sidebar-active-bar" />
              )}

              <span className="smartnav-sidebar-icon">
                <Icon size={18} strokeWidth={2} />
              </span>

              {!collapsed && (
                <span className="smartnav-sidebar-copy">
                  <span className="smartnav-sidebar-label">
                    {item.label}
                  </span>

                  <span className="smartnav-sidebar-description">
                    {item.description}
                  </span>
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom status */}
      {!collapsed && (
        <div className="smartnav-sidebar-footer">
          <div className="smartnav-sidebar-status-icon">
            <CircleDot size={15} />
          </div>

          <div>
            <span className="smartnav-sidebar-status-title">
              Prototype Status
            </span>

            <span className="smartnav-sidebar-status-text">
              GPS + Indoor Navigation
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}