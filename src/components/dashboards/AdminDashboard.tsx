import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { AdminUser, UserFormData, Role } from '../../types';
import { 
  Users, 
  UserPlus, 
  Edit3, 
  Trash2, 
  ShieldAlert, 
  Search, 
  Clock, 
  CheckCircle2, 
  X,
  FileText
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { users, auditLogs, addUser, editUser, deleteUser, isLoading, loadError } = useData();

  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deletingMatricule, setDeletingMatricule] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<UserFormData>({
    matricule: '',
    nom: '',
    prenom: '',
    mot_de_passe: '',
    role: 'AGENT_BENEFICIAIRE',
    telephone: ''
  });

  const handleOpenAdd = () => {
    setFormData({
      matricule: `AG-2026-${Math.floor(100 + Math.random() * 900)}`,
      nom: '',
      prenom: '',
      mot_de_passe: 'Pass2026',
      role: 'AGENT_BENEFICIAIRE',
      telephone: '0102030405'
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (u: AdminUser) => {
    setEditingUser(u);
    setFormData({
      matricule: u.matricule,
      nom: u.nom,
      prenom: u.prenom,
      mot_de_passe: '',
      role: u.role,
      telephone: u.telephone || ''
    });
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await addUser(formData);
    if (res.success) {
      setMessage({ text: res.message, type: 'success' });
      setIsAddOpen(false);
    } else {
      setMessage({ text: res.message, type: 'error' });
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const payload: Partial<UserFormData> = {
      nom: formData.nom,
      prenom: formData.prenom,
      telephone: formData.telephone,
      role: formData.role
    };
    if (formData.mot_de_passe && formData.mot_de_passe.trim()) {
      payload.mot_de_passe = formData.mot_de_passe.trim();
    }
    const res = await editUser(editingUser.matricule, payload);
    if (res.success) {
      setMessage({ text: res.message, type: 'success' });
      setEditingUser(null);
    } else {
      setMessage({ text: res.message, type: 'error' });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingMatricule) return;
    const res = await deleteUser(deletingMatricule);
    setMessage({ text: res.message, type: 'success' });
    setDeletingMatricule(null);
  };

  const filteredUsers = users.filter(u => 
    u.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="hero-card animate-rise bg-surface border border-line-strong rounded-3xl p-6 sm:p-8 text-fg flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-card">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-950/60 text-rose-400 border border-rose-900/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Gouvernance & Administration System</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif text-fg tracking-tight">Gestion des Utilisateurs & Journal d'Audit</h2>
          <p className="text-sm text-muted mt-2 max-w-2xl leading-relaxed">
            Création, modification, suppression des comptes (POST/PUT/DELETE /api/admin/users/) et d'audit.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-inverse hover:bg-inverse/85 text-on-inverse rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 shadow-md"
        >
          <UserPlus className="w-4 h-4" />
          <span>Créer un Utilisateur</span>
        </button>
      </div>

      {/* Message Banner */}
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
        <div className="text-xs text-subtle font-mono">Chargement du journal d'audit...</div>
      )}

      {/* Nav Tabs */}
      <div className="flex gap-1 p-1 bg-elevated/70 border border-line rounded-xl w-fit max-w-full overflow-x-auto">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'users' 
              ? 'bg-surface text-fg shadow-sm ring-1 ring-line-strong' 
              : 'text-subtle hover:text-fg-2 hover:bg-surface/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Comptes Utilisateurs ({users.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'audit' 
              ? 'bg-surface text-fg shadow-sm ring-1 ring-line-strong' 
              : 'text-subtle hover:text-fg-2 hover:bg-surface/60'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Journal d'Audit ({auditLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: USERS LIST */}
      {activeTab === 'users' && (
        <div className="bg-surface border border-line-strong rounded-2xl shadow-card overflow-hidden">

          {/* Search bar */}
          <div className="p-4 border-b border-line bg-sunken/60 flex items-center justify-between">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-subtle absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par matricule, nom, rôle..."
                className="w-full bg-sunken border border-line-strong focus:border-accent rounded-xl pl-9 pr-3 py-1.5 text-xs text-fg focus:outline-none transition font-mono"
              />
            </div>
            <span className="text-xs text-subtle font-mono">
              Total: {filteredUsers.length} utilisateurs
            </span>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-fg-2">
              <thead className="bg-sunken text-subtle uppercase font-bold text-[10px] tracking-[0.2em] border-b border-line">
                <tr>
                  <th className="px-4 py-3">Matricule</th>
                  <th className="px-4 py-3">Nom & Prénom</th>
                  <th className="px-4 py-3">Rôle</th>
                  <th className="px-4 py-3">Téléphone</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredUsers.map((u) => (
                  <tr key={u.matricule} className="hover:bg-hover transition">
                    <td className="px-4 py-3 font-mono font-bold text-fg">{u.matricule}</td>
                    <td className="px-4 py-3 font-medium text-fg">{u.nom} {u.prenom}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                        u.role === 'ADMINISTRATEUR' ? 'bg-rose-950/60 text-rose-300 border-rose-800/80' :
                        u.role === 'RESPONSABLE_PARC' ? 'bg-brand-950/60 text-brand-300 border-brand-800/80' :
                        u.role === 'DIRECTEUR' ? 'bg-amber-950/60 text-amber-300 border-amber-800/80' :
                        'bg-elevated text-fg-2 border-line-strong'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-muted">{u.telephone || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${u.is_active ? 'text-emerald-300 border-emerald-900/60' : 'text-subtle border-line-strong'}`}>
                        {u.is_active ? 'ACTIF' : 'INACTIF'}
                      </span>
                      <div className="text-[10px] text-subtle font-mono mt-1">{u.status}</div>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="p-1.5 text-muted hover:text-fg hover:bg-hover-strong rounded-lg transition"
                        title="Modifier"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingMatricule(u.matricule)}
                        className="p-1.5 text-muted hover:text-rose-400 hover:bg-hover-strong rounded-lg transition"
                        title="Désactiver"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB 2: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-surface border border-line-strong rounded-2xl shadow-card overflow-hidden p-4">
          <div className="flex items-center space-x-2 text-[10px] font-bold text-subtle uppercase tracking-[0.2em] mb-4">
            <FileText className="w-3.5 h-3.5 text-muted" />
            <span>Historique des opérations d'administration (/api/admin/audit-journal/)</span>
          </div>

          {/* CRITICAL UML RULE: Display exact text message "aucune entrée trouvée" when array is empty */}
          {auditLogs.length === 0 ? (
            <div className="p-8 text-center bg-sunken rounded-xl border border-line-strong">
              <p className="text-xs font-semibold text-muted uppercase tracking-widest font-mono">
                aucune entrée trouvée
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-fg-2">
                <thead className="bg-sunken text-subtle uppercase font-bold text-[10px] tracking-[0.2em] border-b border-line">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Date Action</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Utilisateur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {auditLogs.map((log) => (
                    <tr key={log.id_historique} className="hover:bg-hover transition">
                      <td className="px-4 py-3 font-mono font-bold text-subtle">#{log.id_historique}</td>
                      <td className="px-4 py-3 font-mono text-muted">{log.date_action}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-elevated text-fg-2 font-mono text-[10px] border border-line-strong">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-fg">{log.description}</td>
                      <td className="px-4 py-3 font-mono text-brand-400">{log.utilisateur}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CREATE USER MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface border border-line-strong rounded-2xl max-w-md w-full p-6 text-fg shadow-2xl">
            <div className="flex justify-between items-center border-b border-line pb-3 mb-4">
              <h3 className="font-serif text-base text-fg">Créer un Nouvel Utilisateur</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-subtle hover:text-fg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdd} className="space-y-4 text-xs">
              <div>
                <label className="block text-muted font-bold mb-1 uppercase tracking-wider text-[10px]">Matricule</label>
                <input
                  type="text"
                  required
                  value={formData.matricule}
                  onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
                  className="w-full bg-sunken border border-line-strong focus:border-accent rounded-xl p-2.5 text-fg font-mono focus:outline-none transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted font-bold mb-1 uppercase tracking-wider text-[10px]">Nom</label>
                  <input
                    type="text"
                    required
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full bg-sunken border border-line-strong focus:border-accent rounded-xl p-2.5 text-fg focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-muted font-bold mb-1 uppercase tracking-wider text-[10px]">Prénom</label>
                  <input
                    type="text"
                    required
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    className="w-full bg-sunken border border-line-strong focus:border-accent rounded-xl p-2.5 text-fg focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted font-bold mb-1 uppercase tracking-wider text-[10px]">Mot de passe</label>
                  <input
                    type="password"
                    required
                    value={formData.mot_de_passe}
                    onChange={(e) => setFormData({ ...formData, mot_de_passe: e.target.value })}
                    className="w-full bg-sunken border border-line-strong focus:border-accent rounded-xl p-2.5 text-fg focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-muted font-bold mb-1 uppercase tracking-wider text-[10px]">Téléphone</label>
                  <input
                    type="text"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    className="w-full bg-sunken border border-line-strong rounded-lg p-2.5 text-fg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted font-bold mb-1 uppercase tracking-wider text-[10px]">Rôle System</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                  className="w-full bg-sunken border border-line-strong focus:border-accent rounded-xl p-2.5 text-fg focus:outline-none transition"
                >
                  <option value="AGENT_BENEFICIAIRE">AGENT_BENEFICIAIRE</option>
                  <option value="RESPONSABLE_PARC">RESPONSABLE_PARC</option>
                  <option value="DIRECTEUR">DIRECTEUR</option>
                  <option value="ADMINISTRATEUR">ADMINISTRATEUR</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-muted hover:text-fg transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-inverse hover:bg-inverse/85 text-on-inverse font-bold text-xs rounded-xl shadow transition"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface border border-line-strong rounded-2xl max-w-md w-full p-6 text-fg shadow-2xl">
            <div className="flex justify-between items-center border-b border-line pb-3 mb-4">
              <h3 className="font-serif text-base text-fg">Modifier Compte ({editingUser.matricule})</h3>
              <button onClick={() => setEditingUser(null)} className="text-subtle hover:text-fg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted font-bold mb-1 uppercase tracking-wider text-[10px]">Nom</label>
                  <input
                    type="text"
                    required
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full bg-sunken border border-line-strong focus:border-accent rounded-xl p-2.5 text-fg focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-muted font-bold mb-1 uppercase tracking-wider text-[10px]">Prénom</label>
                  <input
                    type="text"
                    required
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    className="w-full bg-sunken border border-line-strong focus:border-accent rounded-xl p-2.5 text-fg focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted font-bold mb-1 uppercase tracking-wider text-[10px]">Téléphone</label>
                <input
                  type="text"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  className="w-full bg-sunken border border-line-strong focus:border-accent rounded-xl p-2.5 text-fg font-mono focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-muted font-bold mb-1 uppercase tracking-wider text-[10px]">Rôle</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                  className="w-full bg-sunken border border-line-strong focus:border-accent rounded-xl p-2.5 text-fg focus:outline-none transition"
                >
                  <option value="AGENT_BENEFICIAIRE">AGENT_BENEFICIAIRE</option>
                  <option value="RESPONSABLE_PARC">RESPONSABLE_PARC</option>
                  <option value="DIRECTEUR">DIRECTEUR</option>
                  <option value="ADMINISTRATEUR">ADMINISTRATEUR</option>
                </select>
              </div>

              <div>
                <label className="block text-muted font-bold mb-1 uppercase tracking-wider text-[10px]">
                  Réinitialiser le mot de passe (optionnel)
                </label>
                <input
                  type="password"
                  value={formData.mot_de_passe}
                  onChange={(e) => setFormData({ ...formData, mot_de_passe: e.target.value })}
                  placeholder="Laisser vide pour ne pas changer"
                  className="w-full bg-sunken border border-line-strong focus:border-accent rounded-xl p-2.5 text-fg font-mono focus:outline-none transition"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-muted hover:text-fg transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-inverse hover:bg-inverse/85 text-on-inverse font-bold text-xs rounded-xl shadow transition"
                >
                  Mettre à jour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingMatricule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface border border-line-strong rounded-2xl max-w-sm w-full p-6 text-fg shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-950/60 text-rose-400 flex items-center justify-center mx-auto border border-rose-900/40">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-base text-fg">Désactiver l'Utilisateur ?</h3>
              <p className="text-xs text-muted mt-1">
                Êtes-vous sûr de vouloir désactiver le compte <span className="font-mono text-rose-300 font-bold">{deletingMatricule}</span> ?
              </p>
            </div>
            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setDeletingMatricule(null)}
                className="flex-1 py-2.5 bg-elevated hover:bg-hover-strong text-fg-2 rounded-xl text-xs font-semibold border border-line-strong transition"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-md"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
