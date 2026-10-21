import React from "react";

const CATEGORIES = [
  "All",
  "Tech",
  "Cultural",
  "Sports",
  "Workshop",
  "Seminar",
  "Other",
];

/**
 * FilterChips Component
 *
 * Horizontal scrollable category pill bar with event counts.
 */
export default function FilterChips({
  selectedCategory = "All",
  onSelectCategory,
  counts = {},
}) {
  return (
    <div className="smartnav-filter-chips-container" role="tablist" aria-label="Event Categories">
      {CATEGORIES.map((cat) => {
        const isSelected = selectedCategory === cat;
        const count = counts[cat] ?? 0;

        return (
          <button
            key={cat}
            type="button"
            role="tab"
            aria-selected={isSelected}
            className={`smartnav-filter-chip ${
              isSelected ? "smartnav-filter-chip--active" : ""
            }`}
            onClick={() => onSelectCategory?.(cat)}
          >
            <span>{cat}</span>
            {count > 0 && (
              <span className="smartnav-filter-chip__count">
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// Provides category and status filters for campus events.