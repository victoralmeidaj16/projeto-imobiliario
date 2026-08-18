"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading, login, signup } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("123indizionhos@gmail.com");
  const [password, setPassword] = useState("123indizionhos@gmail.com");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Preencha o e-mail e a senha.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (isSignup) {
        await signup(email, password);
      } else {
        await login(email, password);
      }
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Erro na autenticação:", err);
      setError(err.message || "Ocorreu um erro ao processar seu acesso. Tente novamente.");
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <main className="min-h-screen bg-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-accent" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-xs text-muted font-light tracking-[0.2em] uppercase">Carregando...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-primary flex items-center justify-center relative overflow-hidden">
      {/* Background ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent/5 blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-warm-highlight/5 blur-[80px]" />
        <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-accent/4 blur-[100px]" />
      </div>

      {/* Decorative lines */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

      <div className="relative w-full max-w-[420px] mx-4">
        {/* Card */}
        <div className="bg-secondary border border-accent/20 rounded-2xl p-10 shadow-2xl shadow-black/50">
          {/* Logo area */}
          <div className="text-center mb-8">
            {/* Gold line decoration above */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-accent/50" />
              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-accent/50" />
            </div>

            <h1
              className="text-4xl font-light tracking-widest text-text-primary uppercase"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              CASAL CORRETOR
            </h1>
            <p className="mt-2 text-[10px] font-medium tracking-[0.35em] text-accent uppercase">
              Portal do Corretor
            </p>
            <p className="mt-3 text-xs text-muted font-light tracking-wider">
              {isSignup ? "Criar novo acesso para corretor" : "Área exclusiva para corretores"}
            </p>

            {/* Mode switch tabs */}
            <div className="flex items-center justify-center gap-2 mt-6 p-1 bg-primary/60 border border-accent/15 rounded-lg">
              <button
                type="button"
                onClick={() => { setIsSignup(false); setError(null); }}
                className={`flex-1 py-1.5 text-xs font-medium tracking-wider uppercase rounded transition-all duration-200 ${
                  !isSignup ? "bg-accent text-primary font-semibold" : "text-muted hover:text-text-primary"
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => { setIsSignup(true); setError(null); }}
                className={`flex-1 py-1.5 text-xs font-medium tracking-wider uppercase rounded transition-all duration-200 ${
                  isSignup ? "bg-accent text-primary font-semibold" : "text-muted hover:text-text-primary"
                }`}
              >
                Criar Conta
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-950/20 border border-red-500/30 text-red-200 text-xs rounded-lg p-3 text-center tracking-wide font-light">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold tracking-[0.2em] text-muted uppercase">
                E-mail / Login
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full bg-primary/80 border border-accent/20 rounded-lg px-4 py-3 text-sm text-text-primary placeholder-muted/40 font-light
                  focus:border-accent/60 focus:shadow-[0_0_0_3px_rgba(201,151,77,0.12)] transition-all duration-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold tracking-[0.2em] text-muted uppercase">
                Senha
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-primary/80 border border-accent/20 rounded-lg px-4 py-3 text-sm text-text-primary placeholder-muted/40 font-light
                  focus:border-accent/60 focus:shadow-[0_0_0_3px_rgba(201,151,77,0.12)] transition-all duration-200"
              />
            </div>

            {!isSignup && (
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  className="text-xs text-accent/70 hover:text-accent transition-colors duration-200 font-light"
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:bg-warm-highlight disabled:opacity-70 text-primary font-semibold text-sm tracking-[0.2em] uppercase
                py-3.5 rounded-lg transition-all duration-300 hover:shadow-[0_0_24px_rgba(201,151,77,0.4)] mt-2 cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {isSignup ? "Cadastrando..." : "Entrando..."}
                </span>
              ) : (
                isSignup ? "Criar Conta & Entrar" : "Entrar"
              )}
            </button>
          </form>

          <p className="text-center text-xs text-muted/50 font-light mt-8">
            Acesso restrito a corretores autorizados
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-muted/30 mt-6 tracking-wider">
          © 2024 CASAL CORRETOR · Todos os direitos reservados
        </p>
      </div>
    </main>
  );
}

