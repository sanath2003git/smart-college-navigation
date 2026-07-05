import {
  MapPinned,
  Navigation,
  Building2,
  Layers3,
  Star,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { useState } from "react";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  const menu = [
    {
      icon: <MapPinned size={20} />,
      label: "My Location",
      color: "text-blue-600",
    },
    {
      icon: <Navigation size={20} />,
      label: "Navigate",
      color: "text-green-600",
    },
    {
      icon: <Building2 size={20} />,
      label: "Buildings",
      color: "text-orange-600",
    },
    {
      icon: <Layers3 size={20} />,
      label: "Layers",
      color: "text-purple-600",
    },
    {
      icon: <Star size={20} />,
      label: "Favorites",
      color: "text-yellow-500",
    },
    {
      icon: <Settings size={20} />,
      label: "Settings",
      color: "text-gray-600",
    },
  ];

  return (
    <div
      className={`bg-white shadow-lg border-r transition-all duration-300 ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && (
          <h2 className="font-bold text-blue-700">
            Menu
          </h2>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-500 hover:text-blue-600"
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </button>
      </div>

      {/* Menu */}
      <div className="py-3">
        {menu.map((item) => (
          <button
            key={item.label}
            className="w-full flex items-center gap-3 px-5 py-3 hover:bg-blue-50 hover:text-blue-700 transition"
          >
            <div className={item.color}>
              {item.icon}
            </div>

            {!collapsed && (
              <span>{item.label}</span>
            )}
          </button>
        ))}
      </div>

      {/* Prototype Status */}
      <div className="border-t mt-4 p-4">
        {!collapsed && (
          <>
            <h3 className="font-semibold text-gray-700 mb-2">
              Prototype Status
            </h3>

            <p className="text-sm text-gray-500">
              Outdoor Navigation
            </p>

            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: "35%" }}
              />
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Phase 1 Development
            </p>
          </>
        )}
      </div>
    </div>
  );
}