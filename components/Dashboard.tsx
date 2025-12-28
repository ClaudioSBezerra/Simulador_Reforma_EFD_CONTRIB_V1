
import React from 'react';
import { SpedData, TaxRateYear } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  spedData: SpedData | null;
  taxRates: TaxRateYear[];
  year: number;
}

const Dashboard: React.FC<DashboardProps> = ({ spedData, taxRates, year }) => {
  const currentRate = taxRates.find(r => r.year === year) || taxRates[0];

  const calculateTotals = () => {
    if (!spedData) return { current: 0, projected: 0, diff: 0 };

    let currentTotal = 0;
    let projectedTotal = 0;

    // Goods (C100)
    spedData.c100.forEach(rec => {
      currentTotal += (rec.vlPis + rec.vlCofins + rec.vlIcms);
      const icmsProjected = rec.vlIcms - ((rec.vlIcms * currentRate.percReducICMS) / 100);
      const ibsProjected = rec.vlDoc * (currentRate.percIBS / 100);
      const cbsProjected = rec.vlDoc * (currentRate.percCBS / 100);
      projectedTotal += (icmsProjected + ibsProjected + cbsProjected);
    });

    // Energy (C500/C600)
    [...spedData.c500, ...spedData.c600].forEach(rec => {
      currentTotal += (rec.vlPis + rec.vlCofins + rec.vlIcms);
      const icmsProjected = rec.vlIcms - ((rec.vlIcms * currentRate.percReducICMS) / 100);
      const ibsProjected = rec.vlDoc * (currentRate.percIBS / 100);
      const cbsProjected = rec.vlDoc * (currentRate.percCBS / 100);
      projectedTotal += (icmsProjected + ibsProjected + cbsProjected);
    });

    // Freight (D100)
    spedData.d100.forEach(rec => {
      currentTotal += (rec.vlPis + rec.vlCofins + rec.vlIcms);
      const icmsProjected = rec.vlIcms - ((rec.vlIcms * currentRate.percReducICMS) / 100);
      const ibsProjected = rec.vlDoc * (currentRate.percIBS / 100);
      const cbsProjected = rec.vlDoc * (currentRate.percCBS / 100);
      projectedTotal += (icmsProjected + ibsProjected + cbsProjected);
    });

    return { 
      current: currentTotal, 
      projected: projectedTotal, 
      diff: projectedTotal - currentTotal 
    };
  };

  const stats = calculateTotals();

  const chartData = [
    { name: 'Carga Atual (PIS+COF+ICMS)', value: stats.current },
    { name: 'Carga Projetada (IBS+CBS+ICMS Red.)', value: stats.projected }
  ];

  if (!spedData) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-white rounded-3xl border-2 border-dashed border-gray-200">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <i className="fas fa-file-invoice-dollar text-3xl text-gray-300"></i>
        </div>
        <h3 className="text-lg font-bold text-gray-900">Nenhum dado importado</h3>
        <p className="text-gray-500">Importe um arquivo EFD Contribuições para começar a simulação.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Carga Atual</p>
          <p className="text-3xl font-extrabold text-gray-900">R$ {stats.current.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Carga Projetada ({year})</p>
          <p className="text-3xl font-extrabold text-indigo-600">R$ {stats.projected.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 ${stats.diff > 0 ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-emerald-500'}`}>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Variação Projetada</p>
          <p className={`text-3xl font-extrabold ${stats.diff > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
            {stats.diff > 0 ? '+' : ''} R$ {stats.diff.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-6">Comparativo de Carga Tributária</h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
              <Tooltip 
                cursor={{fill: '#f9fafb'}}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="value" name="Valor (R$)" radius={[8, 8, 0, 0]} barSize={60}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#4b5563' : '#4f46e5'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
