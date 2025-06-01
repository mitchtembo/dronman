// src/components/charts/LineChart.js
"use client";

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * Reusable Line Chart component for displaying data over time.
 *
 * @param {object} props - The properties for the component.
 * @param {Array<object>} props.data - The data array for the chart. Each object should have a 'name' (for X-axis) and a 'value' (for Y-axis).
 * @param {string} props.dataKey - The key from the data objects to use for the line values (e.g., "value").
 * @param {string} props.xAxisDataKey - The key from the data objects to use for the X-axis labels (e.g., "name").
 * @param {string} [props.lineColor='#007BFF'] - The color of the line.
 */
export default function CustomLineChart({ data, dataKey, xAxisDataKey, lineColor = '#007BFF' }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis dataKey={xAxisDataKey} stroke="#888888" />
        <YAxis stroke="#888888" />
        <Tooltip
          contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
          labelStyle={{ color: '#333' }}
          itemStyle={{ color: '#333' }}
        />
        <Line type="monotone" dataKey={dataKey} stroke={lineColor} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
