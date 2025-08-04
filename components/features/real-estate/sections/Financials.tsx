import React from 'react';
import { HouseFinancials } from '@/interfaces/House';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';

interface FinancialsProps {
  financials: HouseFinancials;
}

const Financials: React.FC<FinancialsProps> = ({ financials }) => {
  const {
    grossIncomeYear,
    grossIncomeMonth,
    monthlyCost,
    netIncomeMonth,
    netIncomeYear,
    totalInvestment,
    expectedIncome,
  } = financials;

  // Exemple de données pour le diagramme (à adapter selon tes coûts réels)
  const chartData = [
    { name: 'Property Management (10.00%)', value: 90 },
    { name: 'Tokeshare Platform (2.00%)', value: 21.4 },
    { name: 'Maintenance Expenses', value: 185 },
    { name: 'Property Taxes', value: 120 },
    { name: 'Insurance', value: 85.6 },
  ];

  // Palette de couleurs (autant d’entrées que voulu)
  const COLORS = ['#6366F1', '#3B82F6', '#000000', '#F97316', '#10B981'];

  return (
    <div className="w-full rounded-lg shadow-lg overflow-hidden text-color4 border-2 border-color4 font-semibold">
      {/* En-tête sombre */}
      <div className="bg-color4 text-white p-4">
        <h2 className="text-lg font-semibold">PROPERTY FINANCIALS</h2>
      </div>

      {/* Contenu principal */}
      <div className=" p-6 space-y-6">
        {/* Revenus bruts Annuel et Mensuel */}
        <div className="flex flex-col md:flex-row justify-between font-semibold text-xl border-b-2 border-color5 pb-2">
          <span className="">Gross Income / year</span>
          <span>{grossIncomeYear?.toLocaleString() || '12,840.00'}</span>
        </div>
        <div className="flex flex-col md:flex-row justify-between font-semibold text-xl border-b-2 border-color5 pb-2">
          <span className="">Gross Income / month</span>
          <span>{grossIncomeMonth?.toLocaleString() || '1,070.00'}</span>
        </div>

        {/* Coûts Mensuels + Diagramme */}
        <div>
          <div className="flex flex-col md:flex-row justify-between  mb-2 font-semibold text-xl">
            <span className="">
              Monthly Costs <sup>©</sup>
            </span>
            <span className=" font-semibold">{monthlyCost?.toLocaleString() || '502.00'}</span>
          </div>

          {/* Petit container pour le diagramme et la légende */}
          <div className="border-2 border-color5 rounded-md p-4 flex flex-col md:flex-row items-center md:items-start md:space-x-4 ">
            {/* Diagramme */}
            <div>
              <PieChart width={300} height={200}>
                <Tooltip />
                <Pie data={chartData} dataKey="value" cx="50%" cy="50%" outerRadius={80} labelLine={false}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </div>

            {/* Légende manuelle des postes de dépense */}
            <div className="mt-6 md:mt-0">
              {chartData.map((item, i) => (
                <div key={i} className="flex items-center space-x-2 mb-2">
                  <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-gray-800 text-sm">{item.name}</span>
                </div>
              ))}
              <p className=" text-sm mt-4">
                Utilities <span className="">Tenant-paid</span>
              </p>
            </div>
          </div>
        </div>

        {/* Revenu Net mensuel */}
        <div className="flex flex-col md:flex-row justify-between font-semibold text-xl">
          <span>Net Income / month</span>
          <span>{netIncomeMonth?.toLocaleString() || '568.00'}</span>
        </div>

        <hr className="border border-color2" />

        {/* Section finale : Net Income / year, Total Investment, Expected Income */}
        <div className="flex flex-col space-y-6  ">
          {/* Net Income / year */}
          <div className="flex flex-col md:flex-row text-xl justify-between">
            <span className="text-color2 font-bold">Net Income / year</span>
            <p className="text-color2 font-semibold">{netIncomeYear?.toLocaleString() || '6,816.00'}</p>
          </div>
          {/* Total Investment */}
          <div className="flex flex-col md:flex-row text-xl justify-between">
            <span className="text-color2 font-bold">Total Investment</span>
            <p className="text-color2 font-semibold">{totalInvestment?.toLocaleString() || '75,705.00'}</p>
          </div>
          {/* Expected Income */}
          <div className="flex justify-between text-xl">
            <div className="flex start flex-col">
              <span className="text-color2 font-bold">
                Expected Income <sup>©</sup>
              </span>
              <p className="text-xs text-color2">Not including capital appreciation</p>
            </div>
            <p className="text-color2 font-semibold">{expectedIncome ? `${expectedIncome}` : '9.00%'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Financials;
