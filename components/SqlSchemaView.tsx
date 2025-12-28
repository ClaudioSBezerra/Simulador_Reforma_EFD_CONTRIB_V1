
import React from 'react';

const SqlSchemaView: React.FC = () => {
  const sqlScript = `-- SCRIPT DE BANCO DE DADOS - SIMULADOR REFORMA TRIBUTÁRIA
-- PLATAFORMA: SUPABASE (POSTGRESQL)

-- 1. HIERARQUIA ORGANIZACIONAL
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.grupos_empresariais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    nome TEXT NOT NULL
);

CREATE TABLE public.empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    grupo_id UUID REFERENCES public.grupos_empresariais(id) ON DELETE CASCADE,
    nome TEXT NOT NULL
);

CREATE TABLE public.filiais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    cnpj CHAR(14) NOT NULL UNIQUE
);

-- 2. PERFIS E USUÁRIOS
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.tenants(id),
    empresa_id UUID REFERENCES public.empresas(id),
    email TEXT NOT NULL,
    role TEXT DEFAULT 'USER',
    confirmado BOOLEAN DEFAULT FALSE
);

-- 3. ALÍQUOTAS (MODELO DE TRANSIÇÃO)
CREATE TABLE public.tabela_aliquota (
    ano INTEGER PRIMARY KEY,
    perc_ibs DECIMAL(5,2) NOT NULL,
    perc_cbs DECIMAL(5,2) NOT NULL,
    perc_reduc_icms DECIMAL(5,2) NOT NULL
);

-- 4. DADOS FISCAIS (EFD CONTRIBUIÇÕES)
CREATE TABLE public.efd_0000 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id),
    filial_id UUID REFERENCES public.filiais(id),
    cnpj CHAR(14) NOT NULL,
    periodo_inicio DATE NOT NULL,
    periodo_fim DATE NOT NULL
);

CREATE TABLE public.efd_c010 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id),
    efd_0000_id UUID REFERENCES public.efd_0000(id) ON DELETE CASCADE,
    cnpj CHAR(14) NOT NULL
);

CREATE TABLE public.efd_c100 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id),
    reg_c010_id UUID REFERENCES public.efd_c010(id) ON DELETE CASCADE,
    ind_oper CHAR(1), -- 0=Entrada, 1=Saída
    vl_doc DECIMAL(18,2),
    vl_bc_icms DECIMAL(18,2),
    vl_icms DECIMAL(18,2),
    vl_pis DECIMAL(18,2),
    vl_cofins DECIMAL(18,2),
    dt_doc DATE,
    cnpj TEXT -- CNPJ da Filial relacionado
);

CREATE TABLE public.efd_c500 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id),
    reg_c010_id UUID REFERENCES public.efd_c010(id) ON DELETE CASCADE,
    vl_doc DECIMAL(18,2),
    vl_bc_icms DECIMAL(18,2),
    vl_icms DECIMAL(18,2),
    vl_pis DECIMAL(18,2),
    vl_cofins DECIMAL(18,2),
    dt_doc DATE,
    cnpj TEXT
);

CREATE TABLE public.efd_c600 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id),
    reg_c010_id UUID REFERENCES public.efd_c010(id) ON DELETE CASCADE,
    vl_doc DECIMAL(18,2),
    dt_doc DATE,
    cnpj TEXT
);

CREATE TABLE public.efd_d010 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id),
    efd_0000_id UUID REFERENCES public.efd_0000(id) ON DELETE CASCADE,
    cnpj CHAR(14) NOT NULL
);

CREATE TABLE public.efd_d100 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id),
    reg_d010_id UUID REFERENCES public.efd_d010(id) ON DELETE CASCADE,
    ind_oper CHAR(1),
    vl_doc DECIMAL(18,2),
    vl_bc_icms DECIMAL(18,2),
    vl_icms DECIMAL(18,2),
    vl_pis DECIMAL(18,2),
    vl_cofins DECIMAL(18,2),
    dt_doc DATE,
    cnpj TEXT
);

-- 5. SEGURANÇA (RLS)
ALTER TABLE public.efd_c100 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.efd_c500 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.efd_c600 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.efd_d100 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso por Tenant" ON public.efd_c100 FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Acesso por Tenant" ON public.efd_c500 FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Acesso por Tenant" ON public.efd_c600 FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Acesso por Tenant" ON public.efd_d100 FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 6. DADOS INICIAIS
INSERT INTO public.tabela_aliquota (ano, perc_ibs, perc_cbs, perc_reduc_icms) VALUES
(2027, 0.1, 0.9, 10.0), (2028, 0.2, 1.8, 20.0), (2029, 0.3, 2.7, 40.0),
(2030, 0.4, 3.6, 60.0), (2031, 0.5, 4.5, 80.0), (2032, 0.6, 5.4, 100.0), (2033, 0.7, 6.3, 100.0)
ON CONFLICT (ano) DO NOTHING;`;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">Script SQL para Deploy</h2>
          <p className="text-gray-500">Copie e execute no editor SQL do seu projeto Supabase.</p>
        </div>
        <button 
          onClick={() => { navigator.clipboard.writeText(sqlScript); alert('SQL Copiado!'); }}
          className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg"
        >
          Copiar SQL
        </button>
      </div>
      <div className="bg-gray-900 rounded-2xl p-6 overflow-hidden shadow-inner">
        <pre className="text-emerald-400 font-mono text-xs overflow-auto max-h-[500px] whitespace-pre scrollbar-hide">
          {sqlScript}
        </pre>
      </div>
    </div>
  );
};

export default SqlSchemaView;
