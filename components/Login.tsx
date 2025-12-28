
import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Company, Tenant } from '../types';

interface LoginProps {
  onLogin: () => void;
  companies: Company[];
  tenants: Tenant[];
}

const Login: React.FC<LoginProps> = ({ companies }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) setError(loginError.message);
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompanyId) {
      setError("Selecione uma empresa para vincular seu cadastro.");
      return;
    }
    setLoading(true);
    setError(null);

    const { data: { user }, error: signupError } = await supabase.auth.signUp({ 
      email, 
      password,
    });

    if (signupError) {
      setError(signupError.message);
      setLoading(false);
      return;
    }

    if (user) {
      const company = companies.find(c => c.id === selectedCompanyId);
      if (!company) return;

      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: user.id,
          email: user.email,
          tenant_id: company.tenantId,
          empresa_id: company.id,
          confirmado: true
        }
      ]);

      if (profileError) setError(profileError.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-900 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-800 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-30 blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-800 rounded-full translate-x-1/2 translate-y-1/2 opacity-30 blur-3xl"></div>
      
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-md z-10 border border-white/20">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl shadow-xl text-white text-4xl mb-6 transform -rotate-6">
            <i className="fas fa-landmark"></i>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Simulador</h1>
          <p className="text-gray-500 font-semibold uppercase text-xs tracking-widest mt-1">Reforma Tributária 2.0</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 flex items-center space-x-2">
            <i className="fas fa-exclamation-circle"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-6">
          {isRegistering && (
            <div className="space-y-2">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Empresa de Vinculação</label>
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-medium text-gray-700 appearance-none"
                required
              >
                <option value="">Selecione sua empresa...</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Seu E-mail Profissional</label>
            <div className="relative">
              <i className="fas fa-envelope absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"></i>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@empresa.com"
                className="w-full pl-14 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-medium"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Senha de Acesso</label>
            <div className="relative">
              <i className="fas fa-shield-alt absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"></i>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-14 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-medium"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-black text-lg hover:shadow-2xl hover:shadow-indigo-500/40 transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:transform-none"
          >
            {loading ? (
              <i className="fas fa-circle-notch animate-spin"></i>
            ) : (
              isRegistering ? 'CRIAR CONTA' : 'ACESSAR PAINEL'
            )}
          </button>
        </form>

        <div className="mt-10 pt-6 border-t border-gray-50 text-center">
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            {isRegistering ? 'Já possui uma conta? Entre aqui' : 'Não tem conta? Cadastre-se na sua empresa'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
