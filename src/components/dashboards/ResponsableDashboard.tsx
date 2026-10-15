import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Equipment, EquipmentState, MaintenanceType } from '../../types';
import {
  Package,
  Plus,
  ArrowLeftRight,
  Clock,
  ShoppingBag,
  Wrench,
  Filter,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X
} from 'lucide-react';

export const ResponsableDashboard: React.FC = () => {
  const {
    equipments,
    pendingRequests,
    openBreakdowns,
    openMaintenances,
    isLoading,
    loadError,
    addEquipment,
    updateEquipment,
    affectEquipment,
    desaffectEquipment,
    processRequest,
    submitAcquisition,
    planMaintenance,
    closeMaintenance,
  } = useData();

  const [activeTab, setActiveTab] = useState<'inventory' | 'requests' | 'breakdowns' | 'maintenances' | 'acquisitions'>('inventory');
  const [filterState, setFilterState] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modals
  const [isAddEqOpen, setIsAddEqOpen] = useState(false);
  const [editingEq, setEditingEq] = useState<Equipment | null>(null);
  const [affectingEq, setAffectingEq] = useState<Equipment | null>(null);
  const [desaffectingEq, setDesaffectingEq] = useState<Equipment | null>(null);
  const [planningPanneId, setPlanningPanneId] = useState<number | null>(null);
  const [closingMaintId, setClosingMaintId] = useState<number | null>(null);
  const [isAcquisitionOpen, setIsAcquisitionOpen] = useState(false);

  // Forms State
  const [eqForm, setEqForm] = useState({
    code_inventaire: '',
    designation: '',
    marque: '',
    modele: '',
    etat: 'DISPONIBLE' as EquipmentState,
    description: ''
  });

  const [affectMatricule, setAffectMatricule] = useState('');
  const [desaffectMotif, setDesaffectMotif] = useState('');
  const [acquisitionData, setAcquisitionData] = useState({ designation_materiel: '', motif: '' });
  const [planMaintData, setPlanMaintData] = useState({ type: 'CORRECTIVE' as MaintenanceType, description: '' });
  const [closeMaintData, setCloseMaintData] = useState({ cout: 45000, resultat: 'REPARE' as 'REPARE' | 'NON_REPARABLE' });

  const showResult = (res: { success: boolean; message: string }) => {
    setMessage({ text: res.message, type: res.success ? 'success' : 'error' });
  };

  // Open Add Equipment
  const handleOpenAddEq = () => {
    setEqForm({
      code_inventaire: `INV-LAP-${Math.floor(100 + Math.random() * 900)}`,
      designation: '',
      marque: '',
      modele: '',
      etat: 'DISPONIBLE',
      description: ''
    });
    setIsAddEqOpen(true);
  };

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await addEquipment(eqForm);
    showResult(res);
    if (res.success) setIsAddEqOpen(false);
  };

  const handleUpdateEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEq) return;
    const res = await updateEquipment(editingEq.id_equipement, eqForm);
    showResult(res);
    if (res.success) setEditingEq(null);
  };

  const handleAffectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!affectingEq || !affectMatricule.trim()) return;
    const res = await affectEquipment(affectingEq.id_equipement, affectMatricule.trim());
    showResult(res);
    if (res.success) {
      setAffectingEq(null);
      setAffectMatricule('');
    }
  };

  const handleDesaffectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desaffectingEq) return;
    const res = await desaffectEquipment(desaffectingEq.id_equipement, desaffectMotif);
    showResult(res);
    if (res.success) {
      setDesaffectingEq(null);
      setDesaffectMotif('');
    }
  };

  const handleProcessRequest = async (id: number, action: 'VALIDER' | 'REFUSER', motif_rejet?: string) => {
    showResult(await processRequest(id, action, motif_rejet));
  };

  const handleAcquisitionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await submitAcquisition(acquisitionData.designation_materiel, acquisitionData.motif);
    showResult(res);
    if (res.success) {
      setIsAcquisitionOpen(false);
      setAcquisitionData({ designation_materiel: '', motif: '' });
    }
  };

  const handlePlanMaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planningPanneId) return;
    const res = await planMaintenance(planningPanneId, planMaintData.type, planMaintData.description);
    showResult(res);
    if (res.success) setPlanningPanneId(null);
  };

  const handleCloseMaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closingMaintId) return;
    const res = await closeMaintenance(closingMaintId, closeMaintData.cout, closeMaintData.resultat);
    showResult(res);
    if (res.success) setClosingMaintId(null);
  };

  const filteredEquipments = equipments.filter(e => {
    const matchesFilter = filterState === 'ALL' || e.etat === filterState;
    const matchesSearch = e.code_inventaire.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (e.marque || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingDemandes = pendingRequests;

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="hero-card animate-rise bg-surface border border-line-strong rounded-3xl p-6 sm:p-8 text-fg flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-card">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-950/60 text-brand-400 border border-brand-900/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">
            <Package className="w-3.5 h-3.5" />
            <span>Gestionnaire du Parc Informatique</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif text-fg tracking-tight">Stock, Affectations & Maintenances</h2>
          <p className="text-sm text-muted mt-2 max-w-2xl leading-relaxed">
            Gérez l'inventaire matériel, traitez les demandes, planifiez les interventions et formulez les besoins d'acquisition.
          </p>
        </div>

        <div className="flex space-x-2 shrink-0">
          <button
            onClick={() => setIsAcquisitionOpen(true)}
            className="px-3.5 py-2.5 bg-elevated hover:bg-hover-strong text-fg rounded-xl text-xs font-semibold border border-line-strong transition flex items-center space-x-1.5"
          >
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <span>Demander Acquisition</span>
          </button>
          <button
            onClick={handleOpenAddEq}
            className="px-4 py-2.5 bg-inverse hover:bg-inverse/85 text-on-inverse rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter Équipement</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
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
        <div className="text-xs text-subtle font-mono">Chargement des données du parc...</div>
      )}

      {/* Nav Tabs */}
      <div className="flex gap-1 p-1 bg-elevated/70 border border-line rounded-xl w-fit max-w-full overflow-x-auto">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition flex items-center space-x-2 whitespace-nowrap shrink-0 ${
            activeTab === 'inventory' ? 'bg-surface text-fg shadow-sm ring-1 ring-line-strong' : 'text-subtle hover:text-fg-2 hover:bg-surface/60'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Inventaire ({equipments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition flex items-center space-x-2 whitespace-nowrap shrink-0 ${
            activeTab === 'requests' ? 'bg-surface text-fg shadow-sm ring-1 ring-line-strong' : 'text-subtle hover:text-fg-2 hover:bg-surface/60'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Demandes Agents {pendingDemandes.length > 0 && <span className="ml-1.5 px-2 py-0.5 rounded-full bg-amber-400 text-black text-[10px] font-mono font-bold">{pendingDemandes.length}</span>}</span>
        </button>

        <button
          onClick={() => setActiveTab('breakdowns')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition flex items-center space-x-2 whitespace-nowrap shrink-0 ${
            activeTab === 'breakdowns' ? 'bg-surface text-fg shadow-sm ring-1 ring-line-strong' : 'text-subtle hover:text-fg-2 hover:bg-surface/60'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Pannes Ouvertes {openBreakdowns.length > 0 && <span className="ml-1.5 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-mono font-bold">{openBreakdowns.length}</span>}</span>
        </button>

        <button
          onClick={() => setActiveTab('maintenances')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition flex items-center space-x-2 whitespace-nowrap shrink-0 ${
            activeTab === 'maintenances' ? 'bg-surface text-fg shadow-sm ring-1 ring-line-strong' : 'text-subtle hover:text-fg-2 hover:bg-surface/60'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Interventions en cours ({openMaintenances.length})</span>
        </button>
      </div>

      {/* TAB 1: INVENTORY */}
      {activeTab === 'inventory' && (
        <div className="bg-surface border border-line-strong rounded-2xl shadow-card overflow-hidden">

          {/* Controls Bar */}
          <div className="p-4 border-b border-line-strong bg-sunken/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-subtle absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par code inventaire, désignation..."
                className="w-full bg-sunken border border-line-strong rounded-lg pl-9 pr-3 py-1.5 text-xs text-fg focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-3.5 h-3.5 text-muted" />
              <select
                value={filterState}
                onChange={(e) => setFilterState(e.target.value)}
                className="bg-sunken border border-line-strong rounded-lg px-2.5 py-1.5 text-xs text-fg-2 focus:outline-none"
              >
                <option value="ALL">Tous les états</option>
                <option value="DISPONIBLE">DISPONIBLE</option>
                <option value="AFFECTE">AFFECTE</option>
                <option value="EN_PANNE">EN_PANNE</option>
                <option value="EN_MAINTENANCE">EN_MAINTENANCE</option>
                <option value="HORS_SERVICE">HORS_SERVICE</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-fg-2">
              <thead className="bg-sunken text-muted uppercase font-semibold text-[10px] tracking-wider border-b border-line-strong">
                <tr>
                  <th className="px-4 py-3">Code Inventaire</th>
                  <th className="px-4 py-3">Désignation</th>
                  <th className="px-4 py-3">Marque / Modèle</th>
                  <th className="px-4 py-3">État</th>
                  <th className="px-4 py-3">Affecté À</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredEquipments.map((e) => (
                  <tr key={e.id_equipement} className="hover:bg-hover transition">
                    <td className="px-4 py-3 font-mono font-bold text-brand-300">{e.code_inventaire}</td>
                    <td className="px-4 py-3 font-medium text-fg">{e.designation}</td>
                    <td className="px-4 py-3 text-muted">{e.marque} {e.modele}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        e.etat === 'DISPONIBLE' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                        e.etat === 'AFFECTE' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                        e.etat === 'EN_PANNE' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        e.etat === 'EN_MAINTENANCE' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                        'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}>
                        {e.etat}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-fg-2">
                      {e.affecte_a || '-'}
                    </td>
                    <td className="px-4 py-3 text-right space-x-1.5">
                      {e.etat === 'DISPONIBLE' && (
                        <button
                          onClick={() => { setAffectingEq(e); setAffectMatricule(''); }}
                          className="px-2 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 rounded border border-emerald-800 text-[11px] font-bold"
                          title="Affecter à un agent"
                        >
                          Affecter
                        </button>
                      )}
                      {e.etat === 'AFFECTE' && (
                        <button
                          onClick={() => { setDesaffectingEq(e); setDesaffectMotif('Fin de mission'); }}
                          className="px-2 py-1 bg-elevated hover:bg-hover-strong text-fg-2 rounded border border-line-strong text-[11px] font-bold"
                          title="Désaffecter & retourner au stock"
                        >
                          Désaffecter
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditingEq(e);
                          setEqForm({
                            code_inventaire: e.code_inventaire,
                            designation: e.designation,
                            marque: e.marque || '',
                            modele: e.modele || '',
                            etat: e.etat,
                            description: e.description || ''
                          });
                        }}
                        className="px-2 py-1 bg-elevated hover:bg-hover-strong text-fg-2 rounded border border-line-strong text-[11px] font-bold"
                      >
                        Éditer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB 2: REQUESTS PROCESSING */}
      {activeTab === 'requests' && (
        <div className="bg-surface border border-line-strong rounded-2xl shadow-card overflow-hidden p-4">
          <div className="flex items-center space-x-2 text-xs font-semibold text-muted uppercase tracking-wider mb-4">
            <Clock className="w-4 h-4 text-brand-400" />
            <span>Traitement des demandes d'équipement (/api/parc/demandes/traiter/)</span>
          </div>

          {pendingRequests.length === 0 ? (
            <p className="text-xs text-muted italic text-center py-6">
              Aucune demande en attente.
            </p>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((r) => (
                <div key={r.id_demande} className="bg-sunken p-4 rounded-xl border border-line-strong flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-bold text-fg text-sm">{r.designation_materiel}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                        {r.statut}
                      </span>
                    </div>
                    <p className="text-muted">Demandeur: <span className="text-fg font-semibold">{r.matricule_agent}</span> le {r.date_demande}</p>
                    {r.motif && <p className="text-fg-2 italic mt-1">"{r.motif}"</p>}
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => handleProcessRequest(r.id_demande, 'VALIDER')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center space-x-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Valider</span>
                    </button>
                    <button
                      onClick={() => handleProcessRequest(r.id_demande, 'REFUSER', 'Non justifié / Stock vide')}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold flex items-center space-x-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Refuser</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BREAKDOWNS REPORTED */}
      {activeTab === 'breakdowns' && (
        <div className="bg-surface border border-line-strong rounded-2xl shadow-card p-4">
          <div className="flex items-center space-x-2 text-xs font-semibold text-muted uppercase tracking-wider mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Pannes Ouvertes Signalées par les Agents (/api/parc/maintenances/)</span>
          </div>

          {openBreakdowns.length === 0 ? (
            <p className="text-xs text-muted italic text-center py-6">
              Aucune panne ouverte pour le moment.
            </p>
          ) : (
            <div className="space-y-3">
              {openBreakdowns.map((b) => (
                <div key={b.id_panne} className="bg-sunken p-4 rounded-xl border border-line-strong flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-bold text-amber-300 font-mono">Panne #{b.id_panne}</span>
                      {b.code_inventaire && <span className="text-muted font-mono">[{b.code_inventaire}]</span>}
                      {b.designation_materiel && <span className="font-bold text-fg">{b.designation_materiel}</span>}
                    </div>
                    <p className="text-fg-2 mt-1">{b.description}</p>
                    <p className="text-subtle text-[11px] mt-1">Signalé par {b.matricule_agent} le {b.date_panne}</p>
                  </div>

                  <button
                    onClick={() => { setPlanningPanneId(b.id_panne); setPlanMaintData({ type: 'CORRECTIVE', description: 'Intervention corrective' }); }}
                    className="px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-bold shadow flex items-center space-x-1.5 shrink-0"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Planifier Intervention</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: OPEN MAINTENANCES */}
      {activeTab === 'maintenances' && (
        <div className="bg-surface border border-line-strong rounded-2xl shadow-card p-4">
          <div className="flex items-center space-x-2 text-xs font-semibold text-muted uppercase tracking-wider mb-4">
            <Wrench className="w-4 h-4 text-brand-400" />
            <span>Interventions actuellement en cours</span>
          </div>

          {openMaintenances.length === 0 ? (
            <p className="text-xs text-muted italic text-center py-6">
              Aucune intervention en cours. Historique complet consultable via le Scan QR / Code Inventaire.
            </p>
          ) : (
            <div className="space-y-3">
              {openMaintenances.map((m) => (
                <div key={m.id_maintenance} className="bg-sunken p-4 rounded-xl border border-line-strong flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-bold text-brand-300 font-mono">Maint #{m.id_maintenance}</span>
                      <span className="font-mono text-muted">[{m.code_inventaire}]</span>
                      <span className="px-2 py-0.5 rounded bg-brand-950 text-brand-300 border border-brand-800 text-[10px] font-bold">
                        {m.type}
                      </span>
                    </div>
                    <p className="text-fg">{m.designation} — {m.description}</p>
                    <p className="text-subtle text-[11px] mt-1">Démarrée le {m.date}</p>
                  </div>

                  <button
                    onClick={() => { setClosingMaintId(m.id_maintenance); setCloseMaintData({ cout: 35000, resultat: 'REPARE' }); }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow shrink-0"
                  >
                    Clôturer Intervention
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD / EDIT EQUIPMENT */}
      {(isAddEqOpen || editingEq) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface border border-line-strong rounded-2xl max-w-md w-full p-6 text-fg shadow-2xl">
            <div className="flex justify-between items-center border-b border-line-strong pb-3 mb-4">
              <h3 className="font-bold text-base text-fg">{editingEq ? 'Modifier Équipement' : 'Ajouter un Équipement'}</h3>
              <button onClick={() => { setIsAddEqOpen(false); setEditingEq(null); }} className="text-muted hover:text-fg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingEq ? handleUpdateEquipment : handleAddEquipment} className="space-y-4 text-xs">
              <div>
                <label className="block text-muted font-semibold mb-1">Code Inventaire / N° Série</label>
                <input
                  type="text"
                  required
                  disabled={!!editingEq}
                  value={eqForm.code_inventaire}
                  onChange={(e) => setEqForm({ ...eqForm, code_inventaire: e.target.value })}
                  className="w-full bg-sunken border border-line-strong rounded-lg p-2.5 text-fg font-mono"
                />
              </div>

              <div>
                <label className="block text-muted font-semibold mb-1">Désignation</label>
                <input
                  type="text"
                  required
                  value={eqForm.designation}
                  onChange={(e) => setEqForm({ ...eqForm, designation: e.target.value })}
                  placeholder="Ex: MacBook Pro, Imprimante..."
                  className="w-full bg-sunken border border-line-strong rounded-lg p-2.5 text-fg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted font-semibold mb-1">Marque</label>
                  <input
                    type="text"
                    value={eqForm.marque}
                    onChange={(e) => setEqForm({ ...eqForm, marque: e.target.value })}
                    className="w-full bg-sunken border border-line-strong rounded-lg p-2.5 text-fg"
                  />
                </div>
                <div>
                  <label className="block text-muted font-semibold mb-1">Modèle</label>
                  <input
                    type="text"
                    value={eqForm.modele}
                    onChange={(e) => setEqForm({ ...eqForm, modele: e.target.value })}
                    className="w-full bg-sunken border border-line-strong rounded-lg p-2.5 text-fg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted font-semibold mb-1">État Initial</label>
                <select
                  value={eqForm.etat}
                  onChange={(e) => setEqForm({ ...eqForm, etat: e.target.value as EquipmentState })}
                  className="w-full bg-sunken border border-line-strong rounded-lg p-2.5 text-fg"
                >
                  <option value="DISPONIBLE">DISPONIBLE</option>
                  <option value="EN_PANNE">EN_PANNE</option>
                  <option value="HORS_SERVICE">HORS_SERVICE</option>
                </select>
              </div>

              <div>
                <label className="block text-muted font-semibold mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={eqForm.description}
                  onChange={(e) => setEqForm({ ...eqForm, description: e.target.value })}
                  className="w-full bg-sunken border border-line-strong rounded-lg p-2.5 text-fg"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => { setIsAddEqOpen(false); setEditingEq(null); }}
                  className="px-3 py-2 text-muted hover:text-fg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-bold shadow"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AFFECTATION */}
      {affectingEq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface border border-line-strong rounded-2xl max-w-sm w-full p-6 text-fg shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-fg">Affecter l'Équipement ({affectingEq.code_inventaire})</h3>
            <form onSubmit={handleAffectSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-muted font-semibold mb-1">Matricule de l'Agent Destinataire</label>
                <div className="relative">
                  <ArrowLeftRight className="w-4 h-4 text-subtle absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    autoFocus
                    value={affectMatricule}
                    onChange={(e) => setAffectMatricule(e.target.value)}
                    placeholder="Ex: AG-2026-001"
                    className="w-full bg-sunken border border-line-strong rounded-lg pl-9 pr-2.5 py-2.5 text-fg font-mono"
                  />
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAffectingEq(null)}
                  className="flex-1 py-2 bg-elevated hover:bg-hover-strong text-fg-2 rounded-lg font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold"
                >
                  Confirmer Affectation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DÉSAFFECTATION */}
      {desaffectingEq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface border border-line-strong rounded-2xl max-w-sm w-full p-6 text-fg shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-fg">Désaffecter l'Équipement ({desaffectingEq.code_inventaire})</h3>
            <form onSubmit={handleDesaffectSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-muted font-semibold mb-1">Motif du retour</label>
                <input
                  type="text"
                  required
                  value={desaffectMotif}
                  onChange={(e) => setDesaffectMotif(e.target.value)}
                  className="w-full bg-sunken border border-line-strong rounded-lg p-2.5 text-fg"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDesaffectingEq(null)}
                  className="flex-1 py-2 bg-elevated hover:bg-hover-strong text-fg-2 rounded-lg font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold"
                >
                  Confirmer Retour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ACQUISITION REQUEST */}
      {isAcquisitionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface border border-line-strong rounded-2xl max-w-md w-full p-6 text-fg shadow-2xl">
            <div className="flex justify-between items-center border-b border-line-strong pb-3 mb-4">
              <h3 className="font-bold text-base text-fg">Faire une Demande d'Acquisition au Directeur</h3>
              <button onClick={() => setIsAcquisitionOpen(false)} className="text-muted hover:text-fg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAcquisitionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-muted font-semibold mb-1">Désignation du Matériel Souhaité</label>
                <input
                  type="text"
                  required
                  value={acquisitionData.designation_materiel}
                  onChange={(e) => setAcquisitionData({ ...acquisitionData, designation_materiel: e.target.value })}
                  placeholder="Ex: Écran Incurvé 34 pouces, Serveur..."
                  className="w-full bg-sunken border border-line-strong rounded-lg p-2.5 text-fg"
                />
              </div>

              <div>
                <label className="block text-muted font-semibold mb-1">Motif / Justification</label>
                <textarea
                  rows={3}
                  required
                  value={acquisitionData.motif}
                  onChange={(e) => setAcquisitionData({ ...acquisitionData, motif: e.target.value })}
                  placeholder="Plus aucun écran en stock pour le pôle..."
                  className="w-full bg-sunken border border-line-strong rounded-lg p-2.5 text-fg"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAcquisitionOpen(false)}
                  className="px-3 py-2 text-muted hover:text-fg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold shadow"
                >
                  Soumettre au Directeur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PLAN MAINTENANCE */}
      {planningPanneId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface border border-line-strong rounded-2xl max-w-sm w-full p-6 text-fg shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-fg">Planifier Intervention</h3>
            <form onSubmit={handlePlanMaintSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-muted font-semibold mb-1">Type Maintenance</label>
                <select
                  value={planMaintData.type}
                  onChange={(e) => setPlanMaintData({ ...planMaintData, type: e.target.value as MaintenanceType })}
                  className="w-full bg-sunken border border-line-strong rounded-lg p-2.5 text-fg"
                >
                  <option value="CORRECTIVE">CORRECTIVE</option>
                  <option value="PREVENTIVE">PREVENTIVE</option>
                </select>
              </div>

              <div>
                <label className="block text-muted font-semibold mb-1">Description Intervention</label>
                <input
                  type="text"
                  value={planMaintData.description}
                  onChange={(e) => setPlanMaintData({ ...planMaintData, description: e.target.value })}
                  className="w-full bg-sunken border border-line-strong rounded-lg p-2.5 text-fg"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPlanningPanneId(null)}
                  className="flex-1 py-2 bg-elevated hover:bg-hover-strong text-fg-2 rounded-lg font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-bold"
                >
                  Planifier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CLOSE MAINTENANCE */}
      {closingMaintId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface border border-line-strong rounded-2xl max-w-sm w-full p-6 text-fg shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-fg">Clôturer Intervention</h3>
            <form onSubmit={handleCloseMaintSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-muted font-semibold mb-1">Coût Réparation (FCFA)</label>
                <input
                  type="number"
                  required
                  value={closeMaintData.cout}
                  onChange={(e) => setCloseMaintData({ ...closeMaintData, cout: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-sunken border border-line-strong rounded-lg p-2.5 text-fg font-mono"
                />
              </div>

              <div>
                <label className="block text-muted font-semibold mb-1">Résultat</label>
                <select
                  value={closeMaintData.resultat}
                  onChange={(e) => setCloseMaintData({ ...closeMaintData, resultat: e.target.value as any })}
                  className="w-full bg-sunken border border-line-strong rounded-lg p-2.5 text-fg"
                >
                  <option value="REPARE">RÉPARÉ (Remettre en stock)</option>
                  <option value="NON_REPARABLE">NON RÉPARABLE (Mettre hors service)</option>
                </select>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setClosingMaintId(null)}
                  className="flex-1 py-2 bg-elevated hover:bg-hover-strong text-fg-2 rounded-lg font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold"
                >
                  Clôturer & Valider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
