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
      icon: MapPinned,
      label: "My Location",
      iconClass: "text-blue-600",
      iconBg: "bg-blue-50",
    },
    {
      icon: Navigation,
      label: "Navigate",
      iconClass: "text-emerald-600",
      iconBg: "bg-emerald-50",
      active: true,
    },
    {
      icon: Building2,
      label: "Buildings",
      iconClass: "text-orange-500",
      iconBg: "bg-orange-50",
    },
    {
      icon: Layers3,
      label: "Layers",
      iconClass: "text-violet-600",
      iconBg: "bg-violet-50",
    },
    {
      icon: Star,
      label: "Favorites",
      iconClass: "text-amber-500",
      iconBg: "bg-amber-50",
    },
    {
      icon: Settings,
      label: "Settings",
      iconClass: "text-slate-500",
      iconBg: "bg-slate-100",
    },
  ];

  return (
    <aside
      className={`
        flex h-full flex-col overflow-hidden
        rounded-[20px]
        border border-slate-200/90
        bg-white/95
        shadow-[0_12px_32px_rgba(15,23,42,0.10)]
        backdrop-blur-xl
        transition-all duration-300 ease-in-out
        ${collapsed ? "w-[76px]" : "w-[250px]"}
      `}
    >
      {/* Header */}
      <div
        className={`
          flex items-center
          border-b border-slate-100
          ${collapsed
            ? "justify-center px-2 py-4"
            : "justify-between px-4 py-4"
          }
        `}
      >
        {!collapsed && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              SmartNav
            </p>

            <h2 className="mt-1 text-[15px] font-bold text-slate-900">
              Explore Campus
            </h2>
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="
            flex h-9 w-9 items-center justify-center
            rounded-xl
            text-slate-400
            transition-all duration-200
            hover:bg-slate-100
            hover:text-slate-800
            active:scale-95
          "
          aria-label={
            collapsed
              ? "Expand sidebar"
              : "Collapse sidebar"
          }
        >
          {collapsed ? (
            <ChevronRight size={19} />
          ) : (
            <ChevronLeft size={19} />
          )}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-1.5 p-3">
        {menu.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              title={collapsed ? item.label : undefined}
              className={`
                group relative flex w-full items-center
                rounded-xl
                px-3 py-2.5
                text-left
                transition-all duration-200

                ${
                  item.active
                    ? "bg-slate-50"
                    : "hover:bg-slate-50/80"
                }

                ${
                  collapsed
                    ? "justify-center"
                    : "gap-3"
                }
              `}
            >
              {/* Active indicator */}
              {item.active && !collapsed && (
                <span
                  className="
                    absolute left-0
                    h-7 w-[3px]
                    rounded-r-full
                    bg-emerald-500
                  "
                />
              )}

              {/* Icon */}
              <div
                className={`
                  flex h-9 w-9 shrink-0
                  items-center justify-center
                  rounded-xl
                  transition-all duration-200

                  ${item.iconBg}

                  group-hover:scale-105
                `}
              >
                <Icon
                  size={18}
                  className={item.iconClass}
                />
              </div>

              {/* Label */}
              {!collapsed && (
                <span
                  className={`
                    text-sm font-medium

                    ${
                      item.active
                        ? "text-slate-900"
                        : "text-slate-600"
                    }
                  `}
                >
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      
    </aside>
  );
}