
import React, { useState } from 'react';
import { TaxRateYear } from '../types';
import { supabase } from '../services/supabase';

interface TaxRatesManagerProps {
  taxRates: TaxRateYear[];
  setTaxRates: React.Dispatch<React.SetStateAction<TaxRateYear[]>>;
}

const TaxRatesManager: React.FC<TaxRatesManagerProps> = ({ taxRates, setTaxRates }) => {
  const [updatingYear, setUpdatingYear] = useState<number | null>(null);

  const handleUpdate = async (year: number) => {
    const rate = taxRates.find(r => r.year === year);
    if (!rate) return;

    setUpdatingYear(year);
    const { error } = await supabase.from('tabela_aliquota').upsert({
      ano: rate.year,
      perc_ibs: rate.percIBS,
      perc_cbs: rate.percCBS,
      perc_reduc_icms: rate.percReducICMS
    });

    if (error) alert(error.message);
    setUpdatingYear(null);
  };

  const handleChange = (year: number, field: keyof TaxRateYear, value: string) => {
    const newVal = parseFloat(value) || 0;
    setTaxRates(prev => prev.map(tr => tr.year === year ? { ...tr, [field]: newVal } : tr));
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-10">
      <div className="mb-10">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Modelo de Transição</h2>
        <p className="text-gray-500 font-medium">Calibragem das alíquotas de IBS e CBS conforme cronograma da Reforma.</p>
      </div>

      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-gray-100">
            <tr>
              <th className="px-8 py-5">Ano Fiscal</th>
              <th className="px-8 py-5">IBS (%)</th>
              <th className="px-8 py-5">CBS (%)</th>
              <th className="px-8 py-5">Redução ICMS (%)</th>
              <th className="px-8 py-5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {taxRates.map((tr) => (
              <tr key={tr.year} className="group hover:bg-indigo-50/30 transition-colors">
                <td className="px-8 py-6">
                  <span className="text-lg font-black text-gray-900">{tr.year}</span>
                </td>
                <td className="px-8 py-6">
                  <div className="relative w-32">
                    <input 
                      type="number" 
                      step="0.01"
                      value={tr.percIBS}
                      onChange={(e) => handleChange(tr.year, 'percIBS', e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs font-bold">%</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="relative w-32">
                    <input 
                      type="number" 
                      step="0.01"
                      value={tr.percCBS}
                      onChange={(e) => handleChange(tr.year, 'percCBS', e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs font-bold">%</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="relative w-32">
                    <input 
                      type="number" 
                      step="0.01"
                      value={tr.percReducICMS}
                      onChange={(e) => handleChange(tr.year, 'percReducICMS', e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs font-bold">%</span>
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                   <button 
                     onClick={() => handleUpdate(tr.year)}
                     disabled={updatingYear === tr.year}
                     className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg transition-all ${updatingYear === tr.year ? 'bg-gray-100 text-gray-400' : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-0.5'}`}
                   >
                     {updatingYear === tr.year ? <i className="fas fa-spinner animate-spin"></i> : 'Sincronizar'}
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-10 p-6 bg-amber-50 rounded-3xl border border-amber-100 flex items-start space-x-4">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
          <i className="fas fa-info-circle"></i>
        </div>
        <div>
          <h4 className="text-amber-900 font-bold text-sm">Persistência Global</h4>
          <p className="text-amber-700 text-xs leading-relaxed mt-1">
            As alterações nestas alíquotas impactam todos os cálculos de projeção do sistema. Clique em <strong>Sincronizar</strong> para salvar permanentemente no Supabase cada ano modificado.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TaxRatesManager;
