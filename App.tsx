
import React, { useState, useEffect, useMemo } from 'react';
import { User, Tenant, CompanyGroup, Company, Branch, SpedData, TaxRateYear } from './types';
import { SIMULATION_YEARS } from './constants';
import { supabase } from './services/supabase';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MercadoriasPanel from './components/MercadoriasPanel';
import EnergiaPanel from './components/EnergiaPanel';
import FretePanel from './components/FretePanel';
import TenantsManager from './components/TenantsManager';
import TaxRatesManager from './components/TaxRatesManager';
import SqlSchemaView from './components/SqlSchemaView';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<string>('dashboard');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [groups, setGroups] = useState<CompanyGroup[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [spedData, setSpedData] = useState<SpedData | null>(null);
  const [simulationYear, setSimulationYear] = useState<number>(2027);
  const [taxRates, setTaxRates] = useState<TaxRateYear[]>(SIMULATION_YEARS);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      setUser({
        id: profile.id,
        email: profile.email,
        role: profile.role || 'USER',
        tenantId: profile.tenant_id,
        companyId: profile.empresa_id,
        confirmed: profile.confirmado
      });
      
      await refreshGlobalData();
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshGlobalData = async () => {
    await Promise.all([
      fetchTenants(),
      fetchGroups(),
      fetchCompanies(),
      fetchBranches(),
      fetchTaxRates(),
      fetchSpedData()
    ]);
  };

  const fetchTaxRates = async () => {
    const { data } = await supabase.from('tabela_aliquota').select('*').order('ano', { ascending: true });
    if (data && data.length > 0) {
      setTaxRates(data.map(r => ({
        year: r.ano,
        percIBS: Number(r.perc_ibs),
        percCBS: Number(r.perc_cbs),
        percReducICMS: Number(r.perc_reduc_icms)
      })));
    }
  };

  // Fix: Explicitly map database 'nome' to 'name' and rename snake_case fields to camelCase
  const fetchTenants = async () => {
    const { data } = await supabase.from('tenants').select('*');
    if (data) setTenants(data.map(t => ({ id: t.id, name: t.nome })));
  };

  const fetchGroups = async () => {
    const { data } = await supabase.from('grupos_empresariais').select('*');
    if (data) setGroups(data.map(g => ({ id: g.id, name: g.nome, tenantId: g.tenant_id })));
  };

  const fetchCompanies = async () => {
    const { data } = await supabase.from('empresas').select('*');
    if (data) setCompanies(data.map(c => ({ id: c.id, name: c.nome, tenantId: c.tenant_id, groupId: c.grupo_id })));
  };

  const fetchBranches = async () => {
    const { data } = await supabase.from('filiais').select('*');
    if (data) setBranches(data.map(b => ({ id: b.id, name: b.nome, cnpj: b.cnpj, companyId: b.empresa_id })));
  };

  const fetchSpedData = async () => {
    try {
      const { data: c100 } = await supabase.from('efd_c100').select('*');
      const { data: c500 } = await supabase.from('efd_c500').select('*');
      const { data: c600 } = await supabase.from('efd_c600').select('*');
      const { data: d100 } = await supabase.from('efd_d100').select('*');

      setSpedData({
        c100: (c100 || []).map(r => ({ ...r, cnpj: r.cnpj || '00000000000000', dtDoc: r.dt_doc, indOper: parseInt(r.ind_oper), vlDoc: Number(r.vl_doc), vlBcIcms: Number(r.vl_bc_icms), vlIcms: Number(r.vl_icms), vlPis: Number(r.vl_pis), vlCofins: Number(r.vl_cofins) })),
        c500: (c500 || []).map(r => ({ ...r, cnpj: r.cnpj || '00000000000000', dtDoc: r.dt_doc, vlDoc: Number(r.vl_doc), vlBcIcms: Number(r.vl_bc_icms), vlIcms: Number(r.vl_icms), vlPis: Number(r.vl_pis), vlCofins: Number(r.vl_cofins) })),
        c600: (c600 || []).map(r => ({ ...r, cnpj: r.cnpj || '00000000000000', dtDoc: r.dt_doc, vlDoc: Number(r.vl_doc), vlBcIcms: 0, vlIcms: 0, vlPis: 0, vlCofins: 0 })),
        d100: (d100 || []).map(r => ({ ...r, cnpj: r.cnpj || '00000000000000', dtDoc: r.dt_doc, indOper: parseInt(r.ind_oper), vlDoc: Number(r.vl_doc), vlBcIcms: Number(r.vl_bc_icms), vlIcms: Number(r.vl_icms), vlPis: Number(r.vl_pis), vlCofins: Number(r.vl_cofins) }))
      });
    } catch (err) {
      console.error('Erro ao buscar dados SPED do Supabase:', err);
    }
  };

  // Filter branches based on the logged-in user's company
  const userBranches = useMemo(() => {
    if (!user) return [];
    return branches.filter(b => b.companyId === user.companyId);
  }, [user, branches]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-medium tracking-tight">Conectando ao Supabase...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={() => {}} companies={companies} tenants={tenants} />;
  }

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard spedData={spedData} taxRates={taxRates} year={simulationYear} />;
      case 'mercadorias':
        return <MercadoriasPanel spedData={spedData} taxRates={taxRates} year={simulationYear} branches={userBranches} />;
      case 'energia':
        return <EnergiaPanel spedData={spedData} taxRates={taxRates} year={simulationYear} branches={userBranches} />;
      case 'frete':
        return <FretePanel spedData={spedData} taxRates={taxRates} year={simulationYear} branches={userBranches} />;
      case 'admin_tenants':
        return <TenantsManager 
          tenants={tenants} onRefresh={refreshGlobalData}
          groups={groups} 
          companies={companies} 
          branches={branches}
          user={user}
        />;
      case 'admin_taxes':
        return <TaxRatesManager taxRates={taxRates} setTaxRates={setTaxRates} />;
      case 'sql_schema':
        return <SqlSchemaView />;
      default:
        return <Dashboard spedData={spedData} taxRates={taxRates} year={simulationYear} />;
    }
  };

  const currentCompanyName = companies.find(c => c.id === user.companyId)?.name || 'Empresa não encontrada';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar 
        currentView={view} 
        setView={setView} 
        user={user} 
        onLogout={handleLogout} 
        onDataImported={fetchSpedData}
      />
      
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center space-x-4">
            <div className="hidden md:block">
              <h1 className="text-xl font-bold text-gray-800">{currentCompanyName}</h1>
              <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">
                {view === 'sql_schema' ? 'Infraestrutura: SQL Script' : view.replace('admin_', 'Configurações: ').replace('_', ' ')}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ano Simulado</span>
              <select 
                value={simulationYear}
                onChange={(e) => setSimulationYear(parseInt(e.target.value))}
                className="bg-transparent text-indigo-700 font-bold border-none focus:ring-0 cursor-pointer text-lg"
              >
                {taxRates.map(tr => (
                  <option key={tr.year} value={tr.year}>{tr.year}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-3 pl-6 border-l border-gray-100">
               <div className="text-right">
                  <p className="text-sm font-bold text-gray-900 leading-none">{user.email.split('@')[0]}</p>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">{user.role}</p>
               </div>
               <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg transform rotate-3">
                {user.email[0].toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
