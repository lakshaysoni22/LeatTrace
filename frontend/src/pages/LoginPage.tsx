import React, { useState } from 'react';
import { useAuthStore } from '../stores';
import { Hexagon, Shield, Eye, EyeOff, Lock, Mail, ArrowRight, AlertTriangle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuthStore();
  const [email, setEmail] = useState('inspector.verma@cybercrime.gov.in');
  const [password, setPassword] = useState('SecurePass@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1500));
    const success = login(email, password);
    if (!success) setError('Invalid credentials');
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-dark-950 grid-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-purple/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full border border-primary-500/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[1100px] rounded-full border border-primary-500/3" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-slide-down">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-500 to-cyber-teal flex items-center justify-center shadow-glow-cyan">
            <Hexagon size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">LEATrace-<span className="text-primary-400">X</span></h1>
          <p className="text-sm text-dark-400 mt-1">Blockchain Intelligence & Transaction Analysis Platform</p>
        </div>

        {/* Login Card */}
        <div className="glass-card p-8 animate-slide-up">
          <div className="flex items-center gap-2 mb-6">
            <Shield size={16} className="text-primary-400" />
            <h2 className="text-lg font-semibold text-white">Secure Authentication</h2>
          </div>

          {/* Security Notice */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-accent-gold/5 border border-accent-gold/20 mb-4">
            <AlertTriangle size={14} className="text-accent-gold mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-dark-300">This system is for authorized law enforcement personnel only. All access is logged and monitored.</p>
          </div>

          {/* Credentials Guide Card */}
          <div className="p-3.5 rounded-lg bg-primary-500/10 border border-primary-500/30 mb-6 space-y-1.5 text-xs text-dark-300">
            <span className="font-bold text-white block uppercase tracking-wider text-[10px]">Authorized Access Credentials:</span>
            <div className="flex justify-between border-b border-dark-800 pb-1">
              <span className="text-dark-400">Email:</span>
              <code className="text-primary-300 select-all font-mono">inspector.verma@cybercrime.gov.in</code>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">Password:</span>
              <code className="text-primary-300 select-all font-mono">SecurePass@2026</code>
            </div>
            <span className="text-[10px] text-dark-400 block italic pt-1 text-center">
              (You must use these exact credentials to authenticate)
            </span>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-dark-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="officer@cybercrime.gov.in"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-dark-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10 pr-10"
                  placeholder="••••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-accent-red/10 border border-accent-red/20">
                <p className="text-xs text-accent-red">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-lg
                hover:from-primary-400 hover:to-primary-500 transition-all duration-200 shadow-glow-cyan
                disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Access Platform <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-dark-700/50 text-center">
            <p className="text-[10px] text-dark-500">Session secured with AES-256 encryption</p>
            <p className="text-[10px] text-dark-500 mt-1">NIST SP 800-53 Compliant • OWASP ASVS Level 2</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-[10px] text-dark-500">Government of India • Cyber Crime Investigation Cell</p>
          <p className="text-[10px] text-dark-600 mt-1">© 2026 LEATrace-X. For Official Use Only.</p>
        </div>
      </div>
    </div>
  );
};
