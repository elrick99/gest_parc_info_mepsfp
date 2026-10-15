import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Monitor,
  User,
  Briefcase,
  QrCode,
  Server,
  LogOut
} from 'lucide-react';
import { Role } from '../types';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  onOpenBackendSettings: () => void;
  onOpenQrScanner: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenBackendSettings,
  onOpenQrScanner
}) => {
  const { currentUser, logout } = useAuth();

  const getRoleBadge = (role?: Role) => {
    switch (role) {
      case 'ADMINISTRATEUR':
        return { label: 'Administrateur', icon: Shield, tone: 'text-rose-400 bg-rose-500/10 ring-rose-500/20' };
      case 'RESPONSABLE_PARC':
        return { label: 'Responsable Parc', icon: Monitor, tone: 'text-brand-400 bg-brand-500/10 ring-brand-500/20' };
      case 'AGENT_BENEFICIAIRE':
        return { label: 'Agent Bénéficiaire', icon: User, tone: 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20' };
      case 'DIRECTEUR':
        return { label: 'Directeur', icon: Briefcase, tone: 'text-amber-400 bg-amber-500/10 ring-amber-500/20' };
      default:
        return { label: 'Invité', icon: User, tone: 'text-muted bg-elevated ring-line-strong' };
    }
  };

  const badge = getRoleBadge(currentUser?.role);
  const BadgeIcon = badge.icon;
  const initials = currentUser
    ? `${currentUser.prenom?.[0] ?? ''}${currentUser.nom?.[0] ?? ''}`.toUpperCase()
    : '';

  return (
    <header className="sticky top-0 z-30 bg-canvas/75 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo & App Title */}
          <div className="flex items-center space-x-3 min-w-0">
            <div className="logo-plate w-11 h-11 shrink-0 rounded-xl p-1 border border-line-strong shadow-sm">
              <img
                src="/armoiries.png"
                alt="Armoiries de la République de Côte d'Ivoire"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h1 className="font-serif font-semibold text-lg sm:text-xl text-fg tracking-tight truncate">
                  Parc Informatique
                </h1>
                <span className="hidden md:inline-block px-2 py-0.5 text-[9px] font-bold tracking-[0.2em] uppercase bg-brand-500/10 text-brand-400 rounded-md border border-brand-500/25">
                  MEPS
                </span>
              </div>
              <p className="text-[11px] text-subtle hidden sm:block truncate">
                Ministère de l'Emploi, de la Protection Sociale et de la Formation Professionnelle
              </p>
            </div>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">

            {/* QR Scanner Trigger */}
            <button
              onClick={onOpenQrScanner}
              className="flex items-center space-x-2 h-9 px-3 rounded-xl text-xs font-semibold bg-surface hover:bg-hover text-fg border border-line-strong transition shadow-sm"
              title="Scan QR Code ou Code Inventaire"
            >
              <QrCode className="w-4 h-4 text-accent" />
              <span className="hidden sm:inline">Scan QR / Série</span>
            </button>

            {/* Backend Settings */}
            <button
              onClick={onOpenBackendSettings}
              className="flex items-center space-x-2 h-9 px-3 rounded-xl text-xs font-semibold border transition bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
              title="Configuration du Backend Django"
            >
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500" />
              </span>
              <Server className="w-3.5 h-3.5 hidden md:block" />
              <span className="hidden md:inline text-[11px]">Backend</span>
            </button>

            <ThemeToggle />

            {/* Current User Info & Logout */}
            {currentUser && (
              <div className="flex items-center space-x-2.5 pl-2.5 ml-0.5 border-l border-line">
                <div className="flex items-center space-x-2.5">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-elevated border border-line-strong flex items-center justify-center text-xs font-bold text-fg">
                      {initials || <User className="w-4 h-4" />}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-canvas ${badge.tone}`}>
                      <BadgeIcon className="w-2.5 h-2.5" />
                    </span>
                  </div>
                  <div className="hidden lg:block text-xs leading-tight">
                    <div className="font-semibold text-fg">{currentUser.prenom} {currentUser.nom}</div>
                    <div className="text-[10px] text-subtle">
                      {badge.label} · <span className="font-mono">{currentUser.matricule}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="p-2 rounded-xl text-subtle hover:text-rose-400 hover:bg-rose-500/10 transition"
                  title="Déconnexion"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

          </div>

        </div>
      </div>
      <div className="tricolor h-[3px] w-full" />
    </header>
  );
};
