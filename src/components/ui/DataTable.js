// src/components/ui/DataTable.js
"use client";

import React from 'react';

/**
 * Reusable DataTable component.
 *
 * @param {object} props - The properties for the component.
 * @param {Array<object>} props.columns - Array of column definitions: [{ header: 'Header Name', accessor: 'dataKey' }].
 * @param {Array<object>} props.data - Array of data objects.
 * @param {string} [props.className] - Optional additional CSS classes for the table container.
 */
export default function DataTable({ columns, data, className = '' }) {
  return (
    <div className={`overflow-x-auto bg-white rounded-lg shadow-md ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((column, colIndex) => (
                <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {column.cell
                    ? column.cell({ row })
                    : row[column.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
