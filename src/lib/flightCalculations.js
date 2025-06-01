// src/lib/flightCalculations.js

/**
 * Calculates the total flight hours from an array of flight log objects.
 * Each flight log object is expected to have a 'duration' property in minutes.
 *
 * @param {Array<object>} flightLogs - An array of flight log objects.
 * @returns {number} The total flight hours, rounded to one decimal place.
 */
export function calculateTotalFlightHours(flightLogs) {
  if (!Array.isArray(flightLogs) || flightLogs.length === 0) {
    return 0;
  }

  const totalMinutes = flightLogs.reduce((sum, log) => {
    // Ensure log.duration is a number, default to 0 if not
    const duration = typeof log.duration === 'number' ? log.duration : 0;
    return sum + duration;
  }, 0);

  const totalHours = totalMinutes / 60;
  return parseFloat(totalHours.toFixed(1));
}
