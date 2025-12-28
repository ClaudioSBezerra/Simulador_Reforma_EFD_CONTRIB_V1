
import React, { useState } from 'react';
import { SpedData, TaxRateYear, Branch } from '../types';

interface MercadoriasPanelProps {
  spedData: SpedData | null;
  taxRates: TaxRateYear[];
  year: number;
  branches: Branch[];
}

const MercadoriasPanel: React.FC<MercadoriasPanelProps> = ({ spedData, taxRates, year, branches }) => {
  const [indOperFilter, setIndOperFilter] = useState<number>(1); // Default Saídas
  const [cnpjFilter, setCnpjFilter] = useState<string>('all');
  
  if (!spedData) return <div className="p-8 text-center text-gray-500 font-medium">Importe arquivos para visualizar os dados.</div>;

  const currentRate = taxRates.find(r => r.year === year) || taxRates[0];

  const filtered = spedData.c100.filter(rec => {
    const operMatch = rec.indOper === indOperFilter;
    const cnpjMatch = cnpjFilter === 'all' || rec.cnpj === cnpjFilter;
    return operMatch && cnpjMatch;
  });

  const getMesAno = (dateStr: string) => {
    if (!dateStr || dateStr.length < 8) return '-';
    // DDMMYYYY or YYYY-MM-DD
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      return `${parts[1]}/${parts[0]}`;
    }
    return `${dateStr.substring(2, 4)}/${dateStr.substring(4, 8)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-center bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
        <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
          <button 
            onClick={() => setIndOperFilter(0)}
            className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all uppercase tracking-widest ${indOperFilter === 0 ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Entradas
          </button>
          <button 
            onClick={() => setIndOperFilter(1)}
            className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all uppercase tracking-widest ${indOperFilter === 1 ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Saídas
          </button>
        </div>

        <div className="h-10 w-px bg-gray-100 mx-2 hidden md:block"></div>

        <div className="flex items-center space-x-3">
          <i className="fas fa-building text-gray-300"></i>
          <select 
            value={cnpjFilter}
            onChange={(e) => setCnpjFilter(e.target.value)}
            className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 min-w-[240px] appearance-none"
          >
            <option value="all">TODAS AS FILIAIS (CNPJ)</option>
            {branches.map(b => (
              <option key={b.cnpj} value={b.cnpj}>{b.cnpj} - {b.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-gray-100">
              <tr>
                <th className="px-8 py-5">CNPJ Filial</th>
                <th className="px-8 py-5">Mês/Ano</th>
                <th className="px-8 py-5">Vl. Doc</th>
                <th className="px-8 py-5">VLPISCOF</th>
                <th className="px-8 py-5">ICMS Atual</th>
                <th className="px-8 py-5 text-indigo-600">ICMS Proj.</th>
                <th className="px-8 py-5 text-indigo-600">IBS Proj.</th>
                <th className="px-8 py-5 text-indigo-600">CBS Proj.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((rec, i) => {
                const vlPisCof = rec.vlPis + rec.vlCofins;
                const icmsProj = rec.vlIcms - ((rec.vlIcms * currentRate.percReducICMS) / 100);
                const ibsProj = rec.vlDoc * (currentRate.percIBS / 100);
                const cbsProj = rec.vlDoc * (currentRate.percCBS / 100);

                return (
                  <tr key={i} className="hover:bg-indigo-50/20 transition-colors group">
                    <td className="px-8 py-6 text-sm font-bold text-gray-900">{rec.cnpj}</td>
                    <td className="px-8 py-6 text-sm font-medium text-gray-500">{getMesAno(rec.dtDoc)}</td>
                    <td className="px-8 py-6 text-sm font-black text-gray-800">R$ {rec.vlDoc.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                    <td className="px-8 py-6 text-sm font-semibold text-gray-500">R$ {vlPisCof.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                    <td className="px-8 py-6 text-sm font-semibold text-gray-500">R$ {rec.vlIcms.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                    <td className="px-8 py-6 text-sm font-black text-indigo-600 bg-indigo-50/10">R$ {icmsProj.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                    <td className="px-8 py-6 text-sm font-black text-indigo-600 bg-indigo-50/20">R$ {ibsProj.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                    <td className="px-8 py-6 text-sm font-black text-indigo-600 bg-indigo-50/30">R$ {cbsProj.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-8 py-12 text-center text-gray-400 italic">Nenhum registro encontrado para os filtros selecionados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MercadoriasPanel;
