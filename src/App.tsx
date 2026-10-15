import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { Header } from './components/Header';
import { LoginPage } from './components/LoginPage';
import { BackendSettingsModal } from './components/BackendSettingsModal';
import { QRScannerModal } from './components/QRScannerModal';

// Dashboards
import { AdminDashboard } from './components/dashboards/AdminDashboard';
import { ResponsableDashboard } from './components/dashboards/ResponsableDashboard';
import { AgentDashboard } from './components/dashboards/AgentDashboard';
import { DirecteurDashboard } from './components/dashboards/DirecteurDashboard';

const MainAppContent: React.FC = () => {
  const { currentUser } = useAuth();
  const [isBackendModalOpen, setIsBackendModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  if (!currentUser) {
    return <LoginPage />;
  }

  const renderDashboardByRole = () => {
    switch (currentUser.role) {
      case 'ADMINISTRATEUR':
        return <AdminDashboard />;
      case 'RESPONSABLE_PARC':
        return <ResponsableDashboard />;
      case 'AGENT_BENEFICIAIRE':
        return <AgentDashboard />;
      case 'DIRECTEUR':
        return <DirecteurDashboard />;
      default:
        return <AgentDashboard />;
    }
  };

  return (
    <div className="min-h-screen text-fg-2 flex flex-col font-sans">
      
      {/* Top Navigation Bar */}
      <Header 
        onOpenBackendSettings={() => setIsBackendModalOpen(true)}
        onOpenQrScanner={() => setIsQrModalOpen(true)}
      />

      {/* Main Dashboard Content */}
      <main key={currentUser.role} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-rise">
        {renderDashboardByRole()}
      </main>

      {/* Footer */}
      <footer className="bg-surface/50 backdrop-blur pb-5 text-center text-xs text-subtle">
        <div className="tricolor h-[3px] w-full mb-5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <img src="/armoiries.png" alt="" className="logo-plate w-7 h-7 rounded-md p-0.5 border border-line-strong" />
            <p className="text-muted">© 2026 Ministère de l'Emploi, de la Protection Sociale et de la Formation Professionnelle · Gestion du Parc Informatique</p>
          </div>
          {/* <p className="font-mono text-[10px] text-faint tracking-wider">AUTEUR BACKEND: KOUASSI ASSAMOI CHRIS EMMANUEL</p> */}
        </div>
      </footer>

      {/* Modals */}
      <BackendSettingsModal 
        isOpen={isBackendModalOpen}
        onClose={() => setIsBackendModalOpen(false)}
      />

      <QRScannerModal 
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />

    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MainAppContent />
      </DataProvider>
    </AuthProvider>
  );
}
