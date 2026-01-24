'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useCmc20Constituents } from '@/hooks/useCmc20Constituents';
import { Loader2 } from 'lucide-react';

// Colors for the pie chart segments
const COLORS = [
  '#F7931A', // Bitcoin orange
  '#627EEA', // Ethereum blue
  '#26A17B', // Tether green (but we exclude stablecoins)
  '#E84142', // Solana gradient
  '#2775CA', // XRP blue
  '#F3BA2F', // BNB yellow
  '#8DC351', // Cardano green
  '#E6007A', // Polkadot pink
  '#00D4AA', // Avalanche red
  '#14F195', // Solana green
  '#FF6B35', // Orange
  '#7B68EE', // Purple
  '#20B2AA', // Light sea green
  '#FF69B4', // Hot pink
  '#32CD32', // Lime green
  '#FFD700', // Gold
  '#00CED1', // Dark turquoise
  '#FF4500', // Orange red
  '#9370DB', // Medium purple
  '#00FA9A', // Medium spring green
];

interface TooltipPayload {
  name: string;
  value: number;
  payload: {
    name: string;
    symbol: string;
    value: number;
    price: number;
  };
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="font-semibold text-color4">
          {data.name} ({data.symbol})
        </p>
        <p className="text-sm text-gray-600">Weight: {data.value.toFixed(2)}%</p>
        <p className="text-sm text-gray-600">Price: ${data.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
      </div>
    );
  }
  return null;
};

const CMC20PieChart = () => {
  const { data, isLoading, error } = useCmc20Constituents();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-80">
        <Loader2 className="h-8 w-8 animate-spin text-color4" />
        <span className="ml-2 text-color4">Loading composition...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-80 text-red-500">
        Failed to load composition data
      </div>
    );
  }

  const chartData = data.constituents.map((c) => ({
    name: c.name,
    symbol: c.symbol,
    value: c.weight,
    price: c.price,
  }));

  return (
    <div className="w-full">
      <div className="h-80 sm:h-96">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              nameKey="symbol"
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Constituents Table */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-color4">
              <th className="text-left py-2 px-2 text-color4 font-semibold">#</th>
              <th className="text-left py-2 px-2 text-color4 font-semibold">Asset</th>
              <th className="text-right py-2 px-2 text-color4 font-semibold">Weight</th>
              <th className="text-right py-2 px-2 text-color4 font-semibold hidden sm:table-cell">Price</th>
            </tr>
          </thead>
          <tbody>
            {data.constituents.map((c, index) => (
              <tr key={c.id} className="border-b border-color5 hover:bg-gray-50">
                <td className="py-2 px-2 text-color4">{index + 1}</td>
                <td className="py-2 px-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium text-color4">{c.symbol}</span>
                    <span className="text-gray-500 hidden sm:inline">{c.name}</span>
                  </div>
                </td>
                <td className="py-2 px-2 text-right text-color4 font-medium">{c.weight.toFixed(2)}%</td>
                <td className="py-2 px-2 text-right text-color4 hidden sm:table-cell">
                  ${c.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-500 mt-4 text-center">
        Data from CoinMarketCap. Rebalanced monthly on the 1st of each month.
      </p>
    </div>
  );
};

export default CMC20PieChart;
