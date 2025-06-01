import React from 'react';

const DroneTableSkeleton = () => {
  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow-md animate-pulse">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {[...Array(8)].map((_, i) => ( // 8 columns for drones
              <th key={i} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {[...Array(5)].map((_, rowIndex) => ( // 5 rows of skeleton data
            <tr key={rowIndex}>
              {[...Array(8)].map((_, colIndex) => ( // 8 columns for drones
                <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  <div className="h-4 bg-gray-200 rounded"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DroneTableSkeleton;
