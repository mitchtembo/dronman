// src/components/ui/StatCard.js
import React from 'react';

/**
 * StatCard component for displaying a title, value, and optional description or icon.
 * Based on the UI reference: clean white cards with subtle shadows and rounded corners.
 * Primary color for value/accents: Blue (#007BFF)
 *
 * @param {object} props - The properties for the component.
 * @param {string} props.title - The title of the statistic (e.g., "Total Flights").
 * @param {string|number} props.value - The main value of the statistic (e.g., "120", 35).
 * @param {string} [props.description] - Optional description or sub-text (e.g., "Last 6 Months +15%").
 * @param {React.ReactNode} [props.icon] - Optional icon component to display.
 * @param {string} [props.className] - Optional additional CSS classes.
 */
export default function StatCard({ title, value, description, icon, className = '' }) {
  return (
    <div className={`bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        {icon && <div className="text-blue-500">{icon}</div>}
      </div>
      <p className="text-3xl font-bold text-gray-800 mb-1">{value}</p>
      {description && <p className="text-xs text-gray-400">{description}</p>}
    </div>
  );
}
