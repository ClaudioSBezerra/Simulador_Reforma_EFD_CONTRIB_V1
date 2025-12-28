
import React, { useState } from 'react';
import { Tenant, CompanyGroup, Company, Branch, User } from '../types';
import { supabase } from '../services/supabase';

interface TenantsManagerProps {
  tenants: Tenant[];
  groups: CompanyGroup[];
  companies: Company[];
  branches: Branch[];
  onRefresh: () => void;
  user: User;
}

const TenantsManager: React.FC<TenantsManagerProps> = ({ tenants, groups, companies, branches, onRefresh, user }) => {
  const [activeTab, setActiveTab] = useState<string>('tenant');
  const [loading, setLoading] = useState(false);

  const handleAddTenant = async (name: string) => {
    setLoading(true);
    const { error } = await supabase.from('tenants').insert([{ nome: name }]);
    if (error) alert(error.message);
    else onRefresh();
    setLoading(false);
  };

  const handleAddGroup = async (name: string) => {
    if (tenants.length === 0) return alert("Crie um tenant primeiro");
    setLoading(true);
    const { error } = await supabase.from('grupos_empresariais').insert([{ 
      nome: name, 
      tenant_id: user.tenantId 
    }]);
    if (error) alert(error.message);
    else onRefresh();
    setLoading(false);
  };

  const handleAddCompany = async (name: string) => {
    if (groups.length === 0) return alert("Crie um grupo primeiro");
    setLoading(true);
    const { error } = await supabase.from('empresas').insert([{ 
      nome: name, 
      tenant_id: user.tenantId,
      grupo_id: groups[0].id
    }]);
    if (error) alert(error.message);
    else onRefresh();
    setLoading(false);
  };

  const handleAddBranch = async (name: string, cnpj: string) => {
    if (companies.length === 0) return alert("Crie uma empresa primeiro");
    setLoading(true);
    const { error } = await supabase.from('filiais').insert([{ 
      nome: name, 
      cnpj: cnpj.replace(/\D/g, ''),
      tenant_id: user.tenantId,
      empresa_id: companies[0].id
    }]);
    if (error) alert(error.message);
    else onRefresh();
    setLoading(false);
  };

  const AddForm = ({ onAdd, placeholder, label, showCnpj = false }: any) => {
    const [val, setVal] = useState('');
    const [cnpj, setCnpj] = useState('');
    return (
      <div className="space-y-3 mt-6 bg-gray-50 p-6 rounded-2xl border border-gray-100">
        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Novo {label}</h4>
        <input 
          type="text" 
          value={val} 
          onChange={(e) => setVal(e.target.value)} 
          placeholder={placeholder}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
        />
        {showCnpj && (
          <input 
            type="text" 
            value={cnpj} 
            onChange={(e) => setCnpj(e.target.value)} 
            placeholder="CNPJ (apenas números)"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        )}
        <button 
          onClick={() => { onAdd(val, cnpj); setVal(''); setCnpj(''); }}
          disabled={loading || !val}
          className="w-full bg-indigo-600 text-white px-4 py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Sincronizando...' : `Salvar ${label}`}
        </button>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-10">
      <div className="mb-10">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Arquitetura de Dados</h2>
        <p className="text-gray-500 font-medium">Gerencie a hierarquia multi-tenant da sua organização.</p>
      </div>

      <div className="flex border-b border-gray-100 mb-10 overflow-x-auto scrollbar-hide">
        <button onClick={() => setActiveTab('tenant')} className={`pb-4 px-8 font-bold text-sm border-b-2 transition-all whitespace-nowrap uppercase tracking-widest ${activeTab === 'tenant' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>1. Tenants</button>
        <button onClick={() => setActiveTab('group')} className={`pb-4 px-8 font-bold text-sm border-b-2 transition-all whitespace-nowrap uppercase tracking-widest ${activeTab === 'group' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>2. Grupos</button>
        <button onClick={() => setActiveTab('company')} className={`pb-4 px-8 font-bold text-sm border-b-2 transition-all whitespace-nowrap uppercase tracking-widest ${activeTab === 'company' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>3. Empresas</button>
        <button onClick={() => setActiveTab('branch')} className={`pb-4 px-8 font-bold text-sm border-b-2 transition-all whitespace-nowrap uppercase tracking-widest ${activeTab === 'branch' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>4. Filiais</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-3">
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Registros Atuais</h4>
          {activeTab === 'tenant' && tenants.map(t => (
            <div key={t.id} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm flex justify-between items-center group hover:border-indigo-200 transition-all">
              <span className="font-bold text-gray-800">{t.name}</span>
              <span className="text-[10px] font-mono text-gray-300 group-hover:text-indigo-300">{t.id}</span>
            </div>
          ))}
          {activeTab === 'group' && groups.map(g => (
            <div key={g.id} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm flex justify-between items-center group hover:border-indigo-200 transition-all">
              <span className="font-bold text-gray-800">{g.name}</span>
              <span className="text-[10px] font-mono text-gray-300">Tenant: {g.tenantId.slice(0,8)}...</span>
            </div>
          ))}
          {activeTab === 'company' && companies.map(c => (
            <div key={c.id} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm flex justify-between items-center group hover:border-indigo-200 transition-all">
              <span className="font-bold text-gray-800">{c.name}</span>
              <span className="text-[10px] font-mono text-gray-300">Grupo: {c.groupId.slice(0,8)}...</span>
            </div>
          ))}
          {activeTab === 'branch' && branches.map(b => (
            <div key={b.id} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm flex justify-between items-center group hover:border-indigo-200 transition-all">
              <div>
                <p className="font-bold text-gray-800">{b.name}</p>
                <p className="text-xs font-black text-indigo-600 tracking-wider">{b.cnpj}</p>
              </div>
              <span className="text-[10px] font-mono text-gray-300">Empresa: {b.companyId.slice(0,8)}...</span>
            </div>
          ))}
          
          {(activeTab === 'tenant' ? tenants : activeTab === 'group' ? groups : activeTab === 'company' ? companies : branches).length === 0 && (
            <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-3xl">
              <p className="text-gray-400 text-sm font-medium">Nenhum registro encontrado.</p>
            </div>
          )}
        </div>

        <div>
          {activeTab === 'tenant' && <AddForm label="Tenant" placeholder="Nome do Tenant Principal" onAdd={handleAddTenant} />}
          {activeTab === 'group' && <AddForm label="Grupo" placeholder="Ex: Holding Brasileira S.A." onAdd={handleAddGroup} />}
          {activeTab === 'company' && <AddForm label="Empresa" placeholder="Ex: Indústria Alpha Ltda" onAdd={handleAddCompany} />}
          {activeTab === 'branch' && <AddForm label="Filial" placeholder="Ex: Filial São Paulo" onAdd={handleAddBranch} showCnpj={true} />}
        </div>
      </div>
    </div>
  );
};

export default TenantsManager;
