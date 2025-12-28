
import React from 'react';

const SqlSchemaView: React.FC = () => {
  const sqlScript = `-- ==========================================================
-- SCRIPT DE BANCO DE DADOS - SUPABASE (POSTGRESQL)
-- PROJETO: SIMULADOR DE IMPACTO DA REFORMA TRIBUTÁRIA
-- ==========================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELAS DE HIERARQUIA (MULTI-TENANCY)
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.grupos_empresariais (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.empresas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    grupo_id UUID NOT NULL REFERENCES public.grupos_empresariais(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.filiais (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    cnpj CHAR(14) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. PERFIS DE USUÁRIO (INTEGRADO AO SUPABASE AUTH)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id),
    email TEXT NOT NULL,
    confirmado BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. TABELA DE ALÍQUOTAS (IBS, CBS E REDUÇÃO ICMS)
CREATE TABLE public.tabela_aliquota (
    ano INTEGER PRIMARY KEY CHECK (ano BETWEEN 2027 AND 2033),
    perc_ibs DECIMAL(5,2) NOT NULL,
    perc_cbs DECIMAL(5,2) NOT NULL,
    perc_reduc_icms DECIMAL(5,2) NOT NULL
);

-- 5. DADOS EFD - ESTRUTURA HIERÁRQUICA PAI/FILHO

-- Registro 0000 (Pai de todos os registros da filial no arquivo)
CREATE TABLE public.efd_0000 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    filial_id UUID NOT NULL REFERENCES public.filiais(id) ON DELETE CASCADE,
    cnpj CHAR(14) NOT NULL,
    periodo_inicio DATE NOT NULL,
    periodo_fim DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- GRUPO C (MERCADORIAS E ENERGIA)
CREATE TABLE public.efd_c010 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    efd_0000_id UUID NOT NULL REFERENCES public.efd_0000(id) ON DELETE CASCADE,
    cnpj CHAR(14) NOT NULL
);

CREATE TABLE public.efd_c100 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    reg_c010_id UUID NOT NULL REFERENCES public.efd_c010(id) ON DELETE CASCADE,
    ind_oper CHAR(1) NOT NULL, -- 0-Entrada, 1-Saída
    vl_doc DECIMAL(18,2) NOT NULL,
    vl_bc_icms DECIMAL(18,2) DEFAULT 0,
    vl_icms DECIMAL(18,2) DEFAULT 0,
    vl_pis DECIMAL(18,2) DEFAULT 0,
    vl_cofins DECIMAL(18,2) DEFAULT 0,
    dt_doc DATE NOT NULL
);

CREATE TABLE public.efd_c500 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    reg_c010_id UUID NOT NULL REFERENCES public.efd_c010(id) ON DELETE CASCADE,
    vl_doc DECIMAL(18,2) NOT NULL,
    vl_bc_icms DECIMAL(18,2) DEFAULT 0,
    vl_icms DECIMAL(18,2) DEFAULT 0,
    vl_pis DECIMAL(18,2) DEFAULT 0,
    vl_cofins DECIMAL(18,2) DEFAULT 0,
    dt_doc DATE NOT NULL
);

CREATE TABLE public.efd_c600 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    reg_c010_id UUID NOT NULL REFERENCES public.efd_c010(id) ON DELETE CASCADE,
    vl_doc DECIMAL(18,2) NOT NULL,
    dt_doc DATE NOT NULL
);

-- GRUPO D (FRETE E TELECOM)
CREATE TABLE public.efd_d010 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    efd_0000_id UUID NOT NULL REFERENCES public.efd_0000(id) ON DELETE CASCADE,
    cnpj CHAR(14) NOT NULL
);

CREATE TABLE public.efd_d100 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    reg_d010_id UUID NOT NULL REFERENCES public.efd_d010(id) ON DELETE CASCADE,
    ind_oper CHAR(1) NOT NULL,
    vl_doc DECIMAL(18,2) NOT NULL,
    vl_bc_icms DECIMAL(18,2) DEFAULT 0,
    vl_icms DECIMAL(18,2) DEFAULT 0,
    vl_pis DECIMAL(18,2) DEFAULT 0,
    vl_cofins DECIMAL(18,2) DEFAULT 0,
    dt_doc DATE NOT NULL
);

CREATE TABLE public.efd_d500 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    reg_d010_id UUID NOT NULL REFERENCES public.efd_d010(id) ON DELETE CASCADE,
    vl_doc DECIMAL(18,2) NOT NULL,
    dt_doc DATE NOT NULL
);

-- 6. SEGURANÇA (ROW LEVEL SECURITY - RLS)
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grupos_empresariais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.efd_0000 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.efd_c010 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.efd_c100 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.efd_c500 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.efd_c600 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.efd_d010 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.efd_d100 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.efd_d500 ENABLE ROW LEVEL SECURITY;

-- FUNÇÃO HELPER PARA ISOLAMENTO
CREATE OR REPLACE FUNCTION get_user_tenant()
RETURNS UUID AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE;

-- POLÍTICAS DE ACESSO
CREATE POLICY tenant_isolation_all ON public.efd_c100 FOR ALL USING (tenant_id = get_user_tenant());
CREATE POLICY tenant_isolation_all ON public.efd_c500 FOR ALL USING (tenant_id = get_user_tenant());
CREATE POLICY tenant_isolation_all ON public.efd_c600 FOR ALL USING (tenant_id = get_user_tenant());
CREATE POLICY tenant_isolation_all ON public.efd_d100 FOR ALL USING (tenant_id = get_user_tenant());
CREATE POLICY tenant_isolation_all ON public.efd_d500 FOR ALL USING (tenant_id = get_user_tenant());

-- 7. INSERÇÃO DE ALÍQUOTAS DE TRANSIÇÃO (PADRÃO REFORMA)
INSERT INTO public.tabela_aliquota (ano, perc_ibs, perc_cbs, perc_reduc_icms) VALUES
(2027, 0.1, 0.9, 10.0),
(2028, 0.2, 1.8, 20.0),
(2029, 0.3, 2.7, 40.0),
(2030, 0.4, 3.6, 60.0),
(2031, 0.5, 4.5, 80.0),
(2032, 0.6, 5.4, 100.0),
(2033, 0.7, 6.3, 100.0)
ON CONFLICT (ano) DO UPDATE SET 
  perc_ibs = EXCLUDED.perc_ibs,
  perc_cbs = EXCLUDED.perc_cbs,
  perc_reduc_icms = EXCLUDED.perc_reduc_icms;`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlScript);
    alert('Comandos SQL copiados para o seu clipboard!');
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">Scripts de Banco de Dados</h2>
          <p className="text-gray-500">Comandos otimizados para Supabase (PostgreSQL) com segurança RLS.</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={copyToClipboard}
            className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold flex items-center space-x-2 hover:bg-emerald-700 transition-colors shadow-lg"
          >
            <i className="fas fa-copy"></i>
            <span>Copiar SQL</span>
          </button>
        </div>
      </div>

      <div className="bg-gray-900 rounded-2xl p-6 overflow-hidden relative shadow-inner">
        <div className="absolute top-4 right-4 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded border border-emerald-500/20 uppercase tracking-tighter">Supabase SQL Editor</div>
        <pre className="text-emerald-400 font-mono text-sm overflow-auto max-h-[600px] whitespace-pre scrollbar-hide">
          {sqlScript}
        </pre>
      </div>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100">
          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 mb-3">
            <i className="fas fa-layer-group"></i>
          </div>
          <h4 className="text-indigo-900 font-bold text-sm mb-1 uppercase tracking-wider">Multi-Tenancy</h4>
          <p className="text-indigo-700/70 text-xs leading-relaxed">Isolamento completo garantido pela coluna <code>tenant_id</code> em todos os níveis da hierarquia e registros fiscais.</p>
        </div>
        <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 mb-3">
            <i className="fas fa-shield-halved"></i>
          </div>
          <h4 className="text-emerald-900 font-bold text-sm mb-1 uppercase tracking-wider">Segurança RLS</h4>
          <p className="text-emerald-700/70 text-xs leading-relaxed">Políticas ativas no banco de dados impedem vazamento de dados entre diferentes empresas e locatários.</p>
        </div>
        <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-3">
            <i className="fas fa-diagram-project"></i>
          </div>
          <h4 className="text-blue-900 font-bold text-sm mb-1 uppercase tracking-wider">Pai e Filho</h4>
          <p className="text-blue-700/70 text-xs leading-relaxed">Integridade referencial estrita para os grupos C (C010 -> C100) e D (D010 -> D100) da EFD Contribuições.</p>
        </div>
      </div>
    </div>
  );
};

export default SqlSchemaView;
