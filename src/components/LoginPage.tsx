import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Monitor,
  Shield,
  User,
  Briefcase,
  Lock,
  Key,
  Sparkles,
  AlertCircle,
  QrCode,
  Wrench,
  BarChart3,
  ArrowRight
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

const demoAccounts = [
  { label: 'Admin', matricule: 'ADM-2026-001', password: 'AdminUltraSafe', icon: Shield, tone: 'text-rose-400 bg-rose-500/10' },
  { label: 'Responsable', matricule: 'RP-2026-001', password: 'RPPass2026', icon: Monitor, tone: 'text-brand-400 bg-brand-500/10' },
  { label: 'Agent', matricule: 'AG-2026-001', password: 'AgentPass2026', icon: User, tone: 'text-emerald-400 bg-emerald-500/10' },
  { label: 'Directeur', matricule: 'DIR-2026-001', password: 'DirPass2026', icon: Briefcase, tone: 'text-amber-400 bg-amber-500/10' },
];

const features = [
  { icon: QrCode, title: 'Inventaire traçable', text: 'Chaque équipement identifié par QR code et numéro de série.' },
  { icon: Wrench, title: 'Maintenance suivie', text: 'Pannes, interventions et coûts historisés de bout en bout.' },
  { icon: BarChart3, title: 'Pilotage décisionnel', text: 'Indicateurs clés et validation des acquisitions.' },
];

export const LoginPage: React.FC = () => {
  const { login, loginError, isLoggingIn } = useAuth();

  const [matricule, setMatricule] = useState('ADM-2026-001');
  const [motDePasse, setMotDePasse] = useState('AdminUltraSafe');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(matricule, motDePasse);
  };

  const setQuickFill = (m: string, p: string) => {
    setMatricule(m);
    setMotDePasse(p);
  };

  return (
    <div className="min-h-screen text-fg-2 flex relative overflow-hidden">

      {/* Theme switch */}
      <div className="absolute top-5 right-5 z-20">
        <ThemeToggle />
      </div>

      {/* Left brand panel (desktop) */}
      <aside className="hidden lg:flex lg:w-[46%] relative flex-col justify-between p-12 border-r border-line bg-surface/60 overflow-hidden">
        <div className="tricolor absolute top-0 inset-x-0 h-1" />
        <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-brand-500/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[380px] h-[380px] rounded-full bg-orange-500/15 blur-[120px] pointer-events-none" />

        <div className="relative logo-plate rounded-2xl px-5 py-4 shadow-card border border-line-strong max-w-md">
          <img
            src="/logo-meps.png"
            alt="Ministère de l'Emploi, de la Protection Sociale et de la Formation Professionnelle"
            className="w-full h-auto"
          />
        </div>

        <div className="relative space-y-10 animate-rise">
          <div className="space-y-4">
            <h2 className="font-serif text-4xl xl:text-5xl leading-[1.1] tracking-tight text-gradient">
              Le parc informatique du Ministère, maîtrisé de bout en bout.
            </h2>
            <p className="text-sm text-muted max-w-md leading-relaxed">
              Affectations, demandes, pannes et acquisitions réunies dans un seul espace, adapté à chaque rôle.
            </p>
          </div>

          <ul className="space-y-5">
            {features.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start space-x-4">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-surface border border-line-strong shadow-card flex items-center justify-center text-accent">
                  <Icon className="w-[18px] h-[18px]" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-fg">{title}</div>
                  <div className="text-xs text-muted mt-0.5">{text}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[11px] text-subtle">© 2026 Système de Gestion du Parc Informatique · République de Côte d'Ivoire</p>
      </aside>

      {/* Right: form */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 relative">
        <div className="lg:hidden absolute top-1/4 left-1/2 -translate-x-1/2 w-[420px] h-[420px] rounded-full bg-brand-500/15 blur-[120px] pointer-events-none" />

        <div className="max-w-md w-full space-y-6 relative z-10 animate-rise">

          {/* Brand Header */}
          <div className="space-y-2">
            <div className="lg:hidden logo-plate rounded-2xl px-4 py-3 shadow-card border border-line-strong mb-6">
              <img
                src="/logo-meps.png"
                alt="Ministère de l'Emploi, de la Protection Sociale et de la Formation Professionnelle"
                className="w-full h-auto"
              />
            </div>
            <div className="tricolor w-14 h-1 rounded-full mb-3" />
            <h1 className="text-3xl font-serif text-fg tracking-tight">Connexion</h1>
            <p className="text-sm text-muted">
              Connectez-vous avec votre matricule pour accéder à votre espace.
            </p>
          </div>

          {/* Login Box */}
          <div className="bg-surface border border-line-strong rounded-3xl p-7 shadow-card space-y-5 border-t-4 border-t-brand-500">

            {loginError && (
              <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-900/60 text-rose-300 text-xs flex items-center space-x-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-fg-2 font-semibold mb-1.5 text-xs">
                  Matricule
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-subtle absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={matricule}
                    onChange={(e) => setMatricule(e.target.value)}
                    placeholder="ADM-2026-001"
                    className="w-full bg-sunken border border-line-strong rounded-xl pl-10 pr-3.5 py-3 text-sm text-fg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-fg-2 font-semibold mb-1.5 text-xs">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-subtle absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    value={motDePasse}
                    onChange={(e) => setMotDePasse(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-sunken border border-line-strong rounded-xl pl-10 pr-3.5 py-3 text-sm text-fg"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="group w-full py-3 brand-gradient text-white font-semibold text-sm rounded-xl shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:brightness-110 transition flex items-center justify-center space-x-2 mt-2"
              >
                {isLoggingIn ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    <span>Se connecter</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Fast Login Credentials for Demo */}
          {/* <div className="bg-surface/70 backdrop-blur border border-line rounded-2xl p-4 space-y-3">
            <div className="flex items-center space-x-2 text-[10px] font-bold text-subtle uppercase tracking-[0.2em]">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span>Comptes de test rapide</span>
            </div>

           
          </div> */}

        </div>
      </main>
    </div>
  );
};
