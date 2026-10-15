import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import {
  Send,
  AlertCircle,
  CheckCircle2,
  Clock,
  Laptop,
  Plus,
  X,
  ShieldCheck
} from 'lucide-react';

export const AgentDashboard: React.FC = () => {
  const { myRequests, myEquipments, submitAgentRequest, reportBreakdown, isLoading, loadError } = useData();

  const [activeTab, setActiveTab] = useState<'requests' | 'myHardware' | 'reportBreakdown'>('requests');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Forms
  const [requestForm, setRequestForm] = useState({
    type: 'Ordinateur Portable',
    justification: ''
  });

  const [breakdownForm, setBreakdownForm] = useState({
    id_equipement: 0,
    description: ''
  });

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestForm.justification.trim()) return;

    const res = await submitAgentRequest(requestForm.type, requestForm.justification);
    if (res.success) {
      setMessage({ text: res.message, type: 'success' });
      setRequestForm({ type: 'Ordinateur Portable', justification: '' });
      setActiveTab('requests');
    } else {
      setMessage({ text: res.message, type: 'error' });
    }
  };

  const handleBreakdownSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!breakdownForm.id_equipement || !breakdownForm.description.trim()) return;

    const res = await reportBreakdown(breakdownForm.id_equipement, breakdownForm.description);
    if (res.success) {
      setMessage({ text: res.message, type: 'success' });
      setBreakdownForm({ id_equipement: 0, description: '' });
      setActiveTab('myHardware');
    } else {
      setMessage({ text: res.message, type: 'error' });
    }
  };

  return (
    <div className="space-y-6">

      {/* Banner */}
      <div className="hero-card animate-rise bg-surface border border-line-strong rounded-3xl p-6 sm:p-8 text-fg flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-card">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-900/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Espace Agent Bénéficiaire</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif text-fg tracking-tight">Mon Parc Informatique & Demandes</h2>
          <p className="text-sm text-muted mt-2 max-w-2xl leading-relaxed">
            Formulez vos besoins de matériel, suivez vos demandes en cours et signalez vos anomalies matérielles.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('reportBreakdown')}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 shadow-md"
        >
          <AlertCircle className="w-4 h-4" />
          <span>Signaler une Panne</span>
        </button>
      </div>

      {/* Message Toast */}
      {message && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between shadow-sm ${
          message.type === 'success'
            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-900/60'
            : 'bg-rose-950/60 text-rose-300 border border-rose-900/60'
        }`}>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {loadError && (
        <div className="p-4 rounded-xl text-xs font-semibold bg-rose-950/60 text-rose-300 border border-rose-900/60">
          Erreur de chargement : {loadError}
        </div>
      )}

      {isLoading && (
        <div className="text-xs text-subtle font-mono">Chargement de votre espace personnel...</div>
      )}

      {/* Nav Tabs */}
      <div className="flex gap-1 p-1 bg-elevated/70 border border-line rounded-xl w-fit max-w-full overflow-x-auto">
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'requests' ? 'bg-surface text-fg shadow-sm ring-1 ring-line-strong' : 'text-subtle hover:text-fg-2 hover:bg-surface/60'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Mes Demandes ({myRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('myHardware')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'myHardware' ? 'bg-surface text-fg shadow-sm ring-1 ring-line-strong' : 'text-subtle hover:text-fg-2 hover:bg-surface/60'
          }`}
        >
          <Laptop className="w-4 h-4" />
          <span>Matériels sous ma Responsabilité ({myEquipments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reportBreakdown')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'reportBreakdown' ? 'bg-surface text-fg shadow-sm ring-1 ring-line-strong' : 'text-subtle hover:text-fg-2 hover:bg-surface/60'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>Déclarer un Sinistre</span>
        </button>
      </div>

      {/* TAB 1: MY REQUESTS */}
      {activeTab === 'requests' && (
        <div className="space-y-6">

          {/* Form Card */}
          <div className="bg-surface border border-line-strong rounded-2xl p-5 shadow-card">
            <h3 className="text-sm font-bold text-fg mb-3 flex items-center space-x-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Soumettre une nouvelle demande d'équipement</span>
            </h3>

            <form onSubmit={handleRequestSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-muted font-semibold mb-1">Type de Matériel</label>
                  <select
                    value={requestForm.type}
                    onChange={(e) => setRequestForm({ ...requestForm, type: e.target.value })}
                    className="w-full bg-sunken border border-line-strong rounded-lg p-2.5 text-fg"
                  >
                    <option value="Ordinateur Portable">Ordinateur Portable</option>
                    <option value="Écran 27 Pouces 4K">Écran 27 Pouces 4K</option>
                    <option value="Clavier & Souris Sans Fil">Clavier & Souris Sans Fil</option>
                    <option value="Casque Audio / WebCam">Casque Audio / WebCam</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-muted font-semibold mb-1">Justification du Besoin</label>
                  <input
                    type="text"
                    required
                    value={requestForm.justification}
                    onChange={(e) => setRequestForm({ ...requestForm, justification: e.target.value })}
                    placeholder="Ex: Remplacement de mon matériel défectueux / Nouveau projet..."
                    className="w-full bg-sunken border border-line-strong rounded-lg p-2.5 text-fg"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-lg shadow-emerald-600/20 flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Envoyer la Demande</span>
                </button>
              </div>
            </form>
          </div>

          {/* List of Demandes */}
          <div className="bg-surface border border-line-strong rounded-2xl p-5 shadow-card">
            <h3 className="text-sm font-bold text-fg mb-3">Suivi de mes demandes enregistrées (/api/agent/demandes/suivi/)</h3>

            {myRequests.length === 0 ? (
              <p className="text-xs text-muted italic text-center py-6">
                Vous n'avez soumis aucune demande pour le moment.
              </p>
            ) : (
              <div className="space-y-3">
                {myRequests.map((r) => (
                  <div key={r.id_demande} className="bg-sunken p-4 rounded-xl border border-line-strong flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-bold text-fg font-mono">Demande #{r.id_demande}</span>
                        <span className="font-bold text-emerald-300">{r.designation_materiel}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.statut === 'EN_ATTENTE' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                          r.statut === 'VALIDEE' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                          'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}>
                          {r.statut}
                        </span>
                      </div>
                      {r.motif_justification && <p className="text-fg-2 italic">"{r.motif_justification}"</p>}
                      <p className="text-subtle text-[10px] mt-1">Soumis le {r.date_demande}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: MY HARDWARE */}
      {activeTab === 'myHardware' && (
        <div className="bg-surface border border-line-strong rounded-2xl p-5 shadow-card">
          <h3 className="text-sm font-bold text-fg mb-3">Équipements Physiques actuellement sous ma responsabilité</h3>

          {myEquipments.length === 0 ? (
            <p className="text-xs text-muted italic text-center py-6">
              Aucun équipement physique n'est actuellement affecté sous votre matricule.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myEquipments.map((e) => (
                <div key={e.id_equipement} className="bg-sunken p-4 rounded-2xl border border-line-strong relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-brand-950 text-brand-300 border border-brand-800">
                        {e.code_inventaire}
                      </span>
                      <h4 className="font-bold text-fg text-base mt-1">{e.designation}</h4>
                      <p className="text-xs text-muted">{e.marque} {e.modele}</p>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {e.etat}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-line-strong flex justify-end">
                    <button
                      onClick={() => {
                        setBreakdownForm({ id_equipement: e.id_equipement, description: '' });
                        setActiveTab('reportBreakdown');
                      }}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Signaler Panne sur cet Appareil</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REPORT BREAKDOWN */}
      {activeTab === 'reportBreakdown' && (
        <div className="bg-surface border border-line-strong rounded-2xl p-6 shadow-card max-w-xl mx-auto text-fg">
          <div className="flex items-center space-x-3 mb-4 border-b border-line-strong pb-3">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-fg">Signaler un Problème / Panne Matérielle</h3>
              <p className="text-xs text-muted">Route: /api/agent/pannes/signaler/</p>
            </div>
          </div>

          {myEquipments.length === 0 ? (
            <p className="text-xs text-muted italic text-center py-6">
              Vous n'avez aucun équipement affecté sur lequel signaler une panne.
            </p>
          ) : (
            <form onSubmit={handleBreakdownSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-fg-2 font-semibold mb-1">Sélectionner le Matériel Défectueux</label>
                <select
                  required
                  value={breakdownForm.id_equipement}
                  onChange={(e) => setBreakdownForm({ ...breakdownForm, id_equipement: parseInt(e.target.value) || 0 })}
                  className="w-full bg-sunken border border-line-strong rounded-lg p-2.5 text-fg"
                >
                  <option value={0}>-- Choisir un appareil --</option>
                  {myEquipments.map((e) => (
                    <option key={e.id_equipement} value={e.id_equipement}>
                      {e.code_inventaire} - {e.designation}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-fg-2 font-semibold mb-1">Description Détaillée de la Panne</label>
                <textarea
                  rows={4}
                  required
                  value={breakdownForm.description}
                  onChange={(e) => setBreakdownForm({ ...breakdownForm, description: e.target.value })}
                  placeholder="Ex: Le clavier ne répond plus, l'écran affiche des lignes verticales colorées..."
                  className="w-full bg-sunken border border-line-strong rounded-lg p-2.5 text-fg"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold shadow-lg shadow-rose-600/30 transition flex items-center space-x-1.5"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Soumettre le Signalement</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

    </div>
  );
};
