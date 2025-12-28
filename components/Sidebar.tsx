
import React, { useRef, useState } from 'react';
import { User, SpedData } from '../types';
import { parseSpedFile } from '../services/spedParser';
import { supabase } from '../services/supabase';

interface SidebarProps {
  currentView: string;
  setView: (v: string) => void;
  user: User;
  onLogout: () => void;
  onDataImported: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, user, onLogout, onDataImported }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const text = ev.target?.result as string;
        const parsedData = await parseSpedFile(text);
        
        // Identificar CNPJ do arquivo para vincular à filial correta
        const fileCnpj = parsedData.c100[0]?.cnpj || '00000000000000';
        
        // Buscar filial correspondente no banco
        const { data: filial } = await supabase
          .from('filiais')
          .select('id')
          .eq('cnpj', fileCnpj.replace(/\D/g, ''))
          .limit(1)
          .single();

        const { data: efd0000, error: efdError } = await supabase
          .from('efd_0000')
          .insert([{
            tenant_id: user.tenantId,
            filial_id: filial?.id,
            cnpj: fileCnpj,
            periodo_inicio: '2023-01-01',
            periodo_fim: '2023-01-31'
          }])
          .select()
          .single();

        if (efdError) throw efdError;

        const { data: regC010 } = await supabase.from('efd_c010').insert([{ 
          tenant_id: user.tenantId, 
          efd_0000_id: efd0000.id, 
          cnpj: fileCnpj 
        }]).select().single();

        const { data: regD010 } = await supabase.from('efd_d010').insert([{ 
          tenant_id: user.tenantId, 
          efd_0000_id: efd0000.id, 
          cnpj: fileCnpj 
        }]).select().single();

        // Salvar Registros C100
        if (parsedData.c100.length > 0) {
          await supabase.from('efd_c100').insert(parsedData.c100.map(r => ({
            tenant_id: user.tenantId,
            reg_c010_id: regC010.id,
            ind_oper: String(r.indOper),
            vl_doc: r.vlDoc,
            vl_bc_icms: r.vlBcIcms,
            vl_icms: r.vlIcms,
            vl_pis: r.vlPis,
            vl_cofins: r.vlCofins,
            dt_doc: '2023-01-15',
            cnpj: fileCnpj
          })));
        }

        // Salvar Registros C500 (Créditos)
        if (parsedData.c500.length > 0) {
          await supabase.from('efd_c500').insert(parsedData.c500.map(r => ({
            tenant_id: user.tenantId,
            reg_c010_id: regC010.id,
            vl_doc: r.vlDoc,
            vl_bc_icms: r.vlBcIcms,
            vl_icms: r.vlIcms,
            vl_pis: r.vlPis,
            vl_cofins: r.vlCofins,
            dt_doc: '2023-01-15',
            cnpj: fileCnpj
          })));
        }

        // Salvar Registros D100 (Frete)
        if (parsedData.d100.length > 0) {
          await supabase.from('efd_d100').insert(parsedData.d100.map(r => ({
            tenant_id: user.tenantId,
            reg_d010_id: regD010.id,
            ind_oper: String(r.indOper),
            vl_doc: r.vlDoc,
            vl_bc_icms: r.vlBcIcms,
            vl_icms: r.vlIcms,
            vl_pis: r.vlPis,
            vl_cofins: r.vlCofins,
            dt_doc: '2023-01-15',
            cnpj: fileCnpj
          })));
        }

        onDataImported();
        alert('EFD importada e processada com sucesso!');
      } catch (err) {
        console.error('Erro na importação:', err);
        alert('Falha ao processar arquivo EFD.');
      } finally {
        setImporting(false);
      }
    };
    reader.readAsText(file);
  };

  const NavItem = ({ id, icon, label }: { id: string, icon: string, label: string }) => {
    const active = currentView === id;
    return (
      <button
        onClick={() => setView(id)}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-300 group ${
          active 
            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200' 
            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${active ? 'bg-white/20' : 'bg-gray-50 group-hover:bg-white'}`}>
          <i className={`fas ${icon} text-lg`}></i>
        </div>
        <span className="font-bold text-sm tracking-tight">{label}</span>
      </button>
    );
  };

  return (
    <aside className="w-72 bg-white border-r border-gray-100 flex flex-col h-full shadow-2xl z-20">
      <div className="p-8 border-b border-gray-50">
        <div className="flex items-center space-x-3 text-indigo-600">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <i className="fas fa-gem"></i>
          </div>
          <span className="text-2xl font-black tracking-tighter text-gray-900 italic">Simulador</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        <div>
          <p className="text-[10px] font-black text-gray-400 px-4 mb-3 uppercase tracking-[0.2em]">Painéis Analíticos</p>
          <div className="space-y-1">
            <NavItem id="dashboard" icon="fa-th-large" label="Visão Estratégica" />
            <NavItem id="mercadorias" icon="fa-shopping-bag" label="Mercadorias" />
            <NavItem id="energia" icon="fa-bolt-lightning" label="Água & Energia" />
            <NavItem id="frete" icon="fa-truck-fast" label="Logística & Frete" />
          </div>
        </div>

        <div>
          <p className="text-[10px] font-black text-gray-400 px-4 mb-3 uppercase tracking-[0.2em]">Configurações</p>
          <div className="space-y-1">
            <NavItem id="admin_tenants" icon="fa-network-wired" label="Estrutura de Tenant" />
            <NavItem id="admin_taxes" icon="fa-percentage" label="Modelo de Transição" />
            <NavItem id="sql_schema" icon="fa-terminal" label="Infraestrutura SQL" />
          </div>
        </div>

        <div className="pt-4">
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".txt" />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="w-full flex items-center justify-center space-x-3 px-6 py-4 rounded-2xl bg-emerald-600 text-white font-black text-xs uppercase tracking-widest shadow-xl hover:bg-emerald-700 transition-all"
          >
            {importing ? <i className="fas fa-circle-notch animate-spin text-lg"></i> : <><i className="fas fa-cloud-arrow-up text-lg"></i><span>IMPORTAR EFD</span></>}
          </button>
        </div>
      </div>

      <div className="p-6 border-t border-gray-50 bg-gray-50/50">
        <button onClick={onLogout} className="w-full flex items-center justify-center space-x-2 py-3 text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-50 rounded-xl transition-all">
          <i className="fas fa-power-off"></i><span>Encerrar Sessão</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
