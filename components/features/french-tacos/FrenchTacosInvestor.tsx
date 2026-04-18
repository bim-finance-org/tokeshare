import React from 'react';

const FrenchTacosInvestor = () => {
  return (
    <div className="w-full rounded-xl shadow-lg overflow-hidden text-color4 border-2 border-color4">
      {/* Header sombre */}
      <div className="bg-color4 text-white p-4 pl-6">
        <h2 className="text-lg font-semibold">INVESTOR</h2>
      </div>
      <div className="bg-color1 p-6">
        <div className="py-4 flex flex-col md:flex-row md:justify-between md:items-center">
          <h3 className="text-lg font-semibold">Official Investor Report — Q1 2026</h3>
          <a
            href="/French_Tacos_LT_SRL_Official_Investor_Report_Q1_2026_EN.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg underline text-color2 hover:text-color5 transition-colors"
          >
            Download PDF
          </a>
        </div>
      </div>
    </div>
  );
};

export default FrenchTacosInvestor;
