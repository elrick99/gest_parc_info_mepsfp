import React, { useEffect, useState } from 'react';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Briefcase,
  CheckCircle2,
  XCircle,
  Download,
  Calendar,
  TrendingUp,
  Monitor,
  Wrench,
  FileText,
  AlertTriangle,
  X
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export const DirecteurDashboard: React.FC = () => {
  const {
    acquisitions,
    globalHistory,
    dashboardStats,
    fetchDirectorDashboard,
    processAcquisition,
    exportHistoryExcel,
    isLoading,
    loadError
  } = useData();

  const { theme } = useTheme();
  // Les attributs SVG de recharts n'acceptent pas var(--…) : couleurs résolues selon le thème
  const chart = theme === 'dark'
    ? { axis: '#71717a', grid: '#1c1c20', cursor: 'rgba(255,255,255,0.04)' }
    : { axis: '#7c8598', grid: '#eceef3', cursor: 'rgba(15,23,42,0.04)' };
  const tooltipStyle = {
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--line-strong)',
    borderRadius: '12px',
    color: 'var(--fg)',
    fontSize: '12px',
    boxShadow: 'var(--card-shadow)',
  };

  const [dateDebut, setDateDebut] = useState(`${new Date().getFullYear()}-01-01`);
  const [dateFin, setDateFin] = useState(new Date().toISOString().substring(0, 10));
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchDirectorDashboard(dateDebut, dateFin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateDebut, dateFin]);

  const handleProcessAcquisition = async (id: number, action: 'VALIDER' | 'REFUSER', motif_rejet?: string) => {
    const res = await processAcquisition(id, action, motif_rejet);
    setMessage({ text: res.message, type: res.success ? 'success' : 'error' });
  };

  const stats = dashboardStats;
  const totalEquipements = stats
    ? stats.total_disponibles + stats.total_affectes + stats.total_en_maintenance + stats.total_hors_service
    : 0;

  const stateDistribution = stats ? [
    { name: 'Disponibles', value: stats.total_disponibles, color: '#10b981' },
    { name: 'Affectés', value: stats.total_affectes, color: '#3b82f6' },
    { name: 'En Maintenance', value: stats.total_en_maintenance, color: '#a855f7' },
    { name: 'Hors Service', value: stats.total_hors_service, color: '#f43f5e' },
  ] : [];

  const pendingAcquisitions = acquisitions.filter(a => a.statut === 'EN_ATTENTE');

  return (
    <div className="space-y-6">

      {/* Banner */}
      <div className="hero-card animate-rise bg-surface border border-line-strong rounded-3xl p-6 sm:p-8 text-fg flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-card">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-950/60 text-amber-400 border border-amber-900/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Pilotage Analytique & Direction Cabinet</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif text-fg tracking-tight">Tableau de Bord Stratégique & Acquisitions</h2>
          <p className="text-sm text-muted mt-2 max-w-2xl leading-relaxed">
            Validation des demandes d'acquisition budgétaires, analyse décisionnelle du parc et téléchargement de l'historique global (Excel).
          </p>
        </div>

        <button
          onClick={async () => { const r = await exportHistoryExcel(); if (!r.success) setMessage({ text: r.message, type: 'error' }); }}
          className="px-4 py-2.5 bg-elevated hover:bg-hover-strong text-amber-300 rounded-xl text-xs font-bold border border-line-strong transition flex items-center space-x-2 shadow shrink-0"
        >
          <Download className="w-4 h-4 text-amber-400" />
          <span>Exporter Historique (.XLSX)</span>
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

      {/* Date Range Filter Bar */}
      <div className="bg-surface border border-line-strong rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 text-fg-2 font-semibold">
          <Calendar className="w-4 h-4 text-amber-400" />
          <span>Filtre Période d'Analyse :</span>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="date"
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
            className="bg-sunken border border-line-strong rounded-lg px-3 py-1.5 text-xs text-fg font-mono"
          />
          <span className="text-subtle">à</span>
          <input
            type="date"
            value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
            className="bg-sunken border border-line-strong rounded-lg px-3 py-1.5 text-xs text-fg font-mono"
          />
        </div>
      </div>

      {isLoading && !stats && (
        <div className="text-xs text-subtle font-mono">Chargement du tableau de bord...</div>
      )}

      {stats && (
        <>
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

            <div className="bg-surface border border-line-strong p-4 rounded-2xl shadow-card transition hover:-translate-y-0.5 hover:border-accent/40">
              <div className="flex justify-between items-start">
                <span className="text-xs text-muted font-semibold uppercase tracking-wider">Total Parc</span>
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                  <Monitor className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-bold tracking-tight text-fg mt-2 font-mono">{totalEquipements}</div>
              <p className="text-[11px] text-emerald-400 mt-1 font-semibold">{stats.total_disponibles} Disponibles</p>
            </div>

            <div className="bg-surface border border-line-strong p-4 rounded-2xl shadow-card transition hover:-translate-y-0.5 hover:border-accent/40">
              <div className="flex justify-between items-start">
                <span className="text-xs text-muted font-semibold uppercase tracking-wider">En Service / Affectés</span>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-bold tracking-tight text-fg mt-2 font-mono">{stats.total_affectes}</div>
              <p className="text-[11px] text-muted mt-1">Actuellement déployés</p>
            </div>

            <div className="bg-surface border border-line-strong p-4 rounded-2xl shadow-card transition hover:-translate-y-0.5 hover:border-accent/40">
              <div className="flex justify-between items-start">
                <span className="text-xs text-muted font-semibold uppercase tracking-wider">Maintenances</span>
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                  <Wrench className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-bold tracking-tight text-amber-300 mt-2 font-mono">{stats.total_en_maintenance}</div>
              <p className="text-[11px] text-muted mt-1">En réparation</p>
            </div>

            <div className="bg-surface border border-line-strong p-4 rounded-2xl shadow-card transition hover:-translate-y-0.5 hover:border-accent/40">
              <div className="flex justify-between items-start">
                <span className="text-xs text-muted font-semibold uppercase tracking-wider">Pannes non résolues</span>
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-bold tracking-tight text-rose-400 mt-2 font-mono">{stats.pannes_non_resolues}</div>
              <p className="text-[11px] text-muted mt-1">{stats.demandes_en_attente} demandes en attente</p>
            </div>

          </div>

          {/* Visual Analytics Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Pie Distribution */}
            <div className="bg-surface border border-line-strong rounded-2xl p-5 shadow-card">
              <h3 className="text-xs font-bold text-fg-2 uppercase tracking-wider mb-4">
                Répartition des Équipements par État
              </h3>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stateDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      cornerRadius={6}
                      stroke="none"
                      dataKey="value"
                    >
                      {stateDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: 'var(--fg)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-wrap justify-center gap-3 mt-2 text-[11px]">
                {stateDistribution.map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-fg-2 font-medium">{item.name} ({item.value})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bar Chart */}
            <div className="bg-surface border border-line-strong rounded-2xl p-5 shadow-card">
              <h3 className="text-xs font-bold text-fg-2 uppercase tracking-wider mb-4">
                Volume des Flux & Volumes en Attente
              </h3>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Disponibles', count: stats.total_disponibles },
                    { name: 'Affectés', count: stats.total_affectes },
                    { name: 'Maintenances', count: stats.total_en_maintenance },
                    { name: 'Pannes', count: stats.pannes_non_resolues },
                    { name: 'Demandes', count: stats.demandes_en_attente },
                    { name: 'Acquisitions', count: pendingAcquisitions.length }
                  ]}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#6366f1" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke={chart.grid} />
                    <XAxis dataKey="name" stroke={chart.axis} fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke={chart.axis} fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: chart.cursor }} itemStyle={{ color: 'var(--fg)' }} />
                    <Bar dataKey="count" name="Total" fill="url(#barGradient)" radius={[6, 6, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </>
      )}

      {/* SECTION: ACQUISITION VALIDATIONS */}
      <div className="bg-surface border border-line-strong rounded-2xl p-5 shadow-card">
        <div className="flex items-center justify-between border-b border-line-strong pb-3 mb-4">
          <div className="flex items-center space-x-2 text-xs font-bold text-fg uppercase tracking-wider">
            <Briefcase className="w-4 h-4 text-amber-400" />
            <span>Demandes d'Acquisition de Matériel (/api/directeur/acquisitions/)</span>
          </div>
          {pendingAcquisitions.length > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-extrabold">
              {pendingAcquisitions.length} en attente
            </span>
          )}
        </div>

        {acquisitions.length === 0 ? (
          <p className="text-xs text-muted italic text-center py-6">
            Aucune demande d'acquisition en attente pour le moment.
          </p>
        ) : (
          <div className="space-y-3">
            {acquisitions.map((a) => (
              <div key={a.id_acquisition} className="bg-sunken p-4 rounded-xl border border-line-strong flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-bold text-fg text-sm">{a.designation_materiel}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      a.statut === 'EN_ATTENTE' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                      a.statut === 'VALIDEE' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                      'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}>
                      {a.statut}
                    </span>
                  </div>
                  <p className="text-muted">Soumise le {a.date_demande}</p>
                  <p className="text-fg-2 italic mt-1">"{a.motif_justification}"</p>
                </div>

                {a.statut === 'EN_ATTENTE' && (
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => handleProcessAcquisition(a.id_acquisition, 'VALIDER')}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center space-x-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Valider l'Achat</span>
                    </button>
                    <button
                      onClick={() => handleProcessAcquisition(a.id_acquisition, 'REFUSER', 'Budget non alloué')}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold flex items-center space-x-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Refuser</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION: GLOBAL HISTORY LOG TABLE */}
      <div className="bg-surface border border-line-strong rounded-2xl p-5 shadow-card">
        <div className="flex items-center justify-between border-b border-line-strong pb-3 mb-4">
          <div className="flex items-center space-x-2 text-xs font-bold text-fg uppercase tracking-wider">
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Historique Global du Parc Informatique (/api/parc/historique-global/)</span>
          </div>

          <button
            onClick={async () => { const r = await exportHistoryExcel(); if (!r.success) setMessage({ text: r.message, type: 'error' }); }}
            className="px-3 py-1.5 bg-elevated hover:bg-hover-strong text-amber-300 rounded-lg text-xs font-semibold border border-line-strong flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Télécharger Excel</span>
          </button>
        </div>

        {globalHistory.length === 0 ? (
          <p className="text-xs text-muted italic text-center py-6">
            Aucune entrée d'historique disponible.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-fg-2">
              <thead className="bg-sunken text-muted uppercase font-semibold text-[10px] tracking-wider border-b border-line-strong">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type Action</th>
                  <th className="px-4 py-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {globalHistory.map((h, idx) => (
                  <tr key={idx} className="hover:bg-hover transition">
                    <td className="px-4 py-3 font-mono text-muted">{h.date}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-elevated text-amber-300 font-mono text-[10px] border border-line-strong">
                        {h.type_action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-fg">{h.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
