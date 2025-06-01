// src/components/charts/BarChart.js
"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * Reusable Bar Chart component for displaying categorical data.
 *
 * @param {object} props - The properties for the component.
 * @param {Array<object>} props.data - The data array for the chart. Each object should have a 'name' (for X-axis) and a 'value' (for bar height).
 * @param {string} props.dataKey - The key from the data objects to use for the bar values (e.g., "value").
 * @param {string} props.xAxisDataKey - The key from the data objects to use for the X-axis labels (e.g., "name").
 * @param {string} [props.barColor='#007BFF'] - The color of the bars.
 */
export default function CustomBarChart({ data, dataKey, xAxisDataKey, barColor = '#007BFF' }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
        <XAxis dataKey={xAxisDataKey} stroke="#888888" />
        <YAxis stroke="#888888" />
        <Tooltip
          contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
          labelStyle={{ color: '#333' }}
          itemStyle={{ color: '#333' }}
        />
        <Bar dataKey={dataKey} fill={barColor} />
      </BarChart>
    </ResponsiveContainer>
  );
}
