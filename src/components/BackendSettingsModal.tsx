import React, { useState } from 'react';
import { X, Server, CheckCircle2, AlertTriangle, Terminal, Wifi } from 'lucide-react';
import { API_URL, getApiBaseUrl } from '../services/api';

interface BackendSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackendSettingsModal: React.FC<BackendSettingsModalProps> = ({ isOpen, onClose }) => {
  const baseUrl = API_URL;
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage('Tentative de connexion au serveur Django...');

    try {
      const cleanUrl = baseUrl;
      // Route publique : valide l'accessibilité réelle (proxy Vite compris en dev).
      const res = await fetch(`${getApiBaseUrl()}/parc/historique-global/`);

      if (res.ok) {
        setTestStatus('success');
        setTestMessage(`Serveur Django accessible sur ${cleanUrl}`);
      } else {
        setTestStatus('error');
        setTestMessage(`Code HTTP reçu: ${res.status}. Vérifiez les paramètres CORS et l'URL.`);
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(`Impossible de joindre le serveur Django (${err.message}). Si vous êtes sur 2 PC séparés, suivez le protocole ci-dessous.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-surface border border-line-strong text-fg rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-line pb-4 mb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-elevated text-fg border border-line-strong">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif text-fg">Connexion Backend Django REST</h2>
              <p className="text-xs text-subtle font-mono">Configuration réseau de l'API</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-subtle hover:text-fg hover:bg-hover transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Base URL Field */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-subtle mb-1.5">
              URL de Base de l'API (Base URL)
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={baseUrl}
                readOnly
                className="flex-1 bg-sunken border border-line-strong focus:border-accent rounded-xl px-3.5 py-2 text-sm text-fg font-mono focus:outline-none transition"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                className="px-4 py-2 bg-elevated hover:bg-hover-strong text-fg rounded-xl text-xs font-semibold border border-line-strong transition flex items-center space-x-1.5"
              >
                <Wifi className="w-3.5 h-3.5 text-muted" />
                <span>Tester</span>
              </button>
            </div>
          </div>

          {/* Connection Test Output */}
          {testStatus !== 'idle' && (
            <div className={`p-3.5 rounded-xl text-xs flex items-start space-x-2.5 ${
              testStatus === 'testing' ? 'bg-blue-950/60 text-blue-300 border border-blue-900/60' :
              testStatus === 'success' ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-900/60' :
              'bg-rose-950/60 text-rose-300 border border-rose-900/60'
            }`}>
              {testStatus === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
              {testStatus === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
              {testStatus === 'testing' && <div className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin shrink-0" />}
              <div>{testMessage}</div>
            </div>
          )}
        </div>

        <p className="text-[11px] text-subtle font-mono">
          Configurée via la variable <code className="text-brand-300">VITE_API_URL</code> (fichier .env).
        </p>

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-end space-x-3 border-t border-line pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-muted hover:text-fg transition"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
