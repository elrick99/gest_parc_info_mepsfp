import {
  User,
  Equipment,
  EquipmentRequest,
  BreakdownReport,
  AcquisitionRequest,
  AuditEntry,
  GlobalHistoryEntry,
  DashboardStats,
  ScanResult,
  AgentPersonalSpace,
  AdminUser,
  AdminUserStatusFilter
} from '../types';

// URL de l'API configurée via VITE_API_URL. En dev, les appels passent par le
// proxy Vite (/api) car le backend ne renvoie pas d'en-têtes CORS.
export const API_URL = (import.meta.env.VITE_API_URL || 'https://api-parc.numerix.digital/api').replace(/\/$/, '');
export const getApiBaseUrl = (): string => (import.meta.env.DEV ? '/api' : API_URL);

// Ancienne surcharge manuelle (IP LAN) : ignorée désormais, on la purge pour
// qu'elle ne masque pas la configuration.
localStorage.removeItem('parc_info_base_url');

// Le backend ne renvoie pas les mêmes clés d'ID selon l'endpoint
// (`id` sur /parc/equipements/ et /parc/affectations/, `id_equipement`
// ailleurs). On normalise tout vers `id_equipement` dès la sortie de l'API.
function normalizeEquipment(raw: any): Equipment {
  return {
    id_equipement: raw.id_equipement ?? raw.id,
    code_inventaire: raw.code_inventaire,
    designation: raw.designation,
    marque: raw.marque,
    modele: raw.modele,
    etat: raw.etat,
    description: raw.description,
    qr_code: raw.qr_code,
    date_acquisition: raw.date_acquisition,
    affecte_a: raw.affecte_a ?? raw.agent_actuel
  };
}

class ApiService {
  private getHeaders(token?: string) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private buildUrl(endpoint: string) {
    return `${getApiBaseUrl()}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  }

  private async request<T>(
    endpoint: string,
    method: string = 'GET',
    body?: any,
    token?: string
  ): Promise<T> {
    const url = this.buildUrl(endpoint);

    const response = await fetch(url, {
      method,
      headers: this.getHeaders(token),
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || data.message || `Erreur HTTP ${response.status}`);
    }

    return data;
  }

  // Téléchargement d'un export XLSX généré par le backend (?format=excel).
  private async downloadFile(endpoint: string, fallbackName: string, token?: string) {
    const response = await fetch(this.buildUrl(endpoint), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || data.message || `Erreur HTTP ${response.status}`);
    }
    const disposition = response.headers.get('Content-Disposition') || '';
    const filename = /filename="?([^";]+)"?/.exec(disposition)?.[1] || fallbackName;
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Authentification
  async login(matricule: string, mot_de_passe: string): Promise<User> {
    return this.request<User>('/login/', 'POST', { matricule, mot_de_passe });
  }

  // Admin - Gestion des utilisateurs
  // GET /admin/users/ est paginé ({page, size, total_pages, utilisateurs}) :
  // on agrège toutes les pages.
  async getUsers(token: string, status: AdminUserStatusFilter = 'all'): Promise<AdminUser[]> {
    const all: AdminUser[] = [];
    let page = 1;
    let totalPages = 1;
    do {
      const res = await this.request<{ total_pages: number; utilisateurs: AdminUser[] }>(
        `/admin/users/?status=${status}&page=${page}&size=100`, 'GET', undefined, token
      );
      all.push(...res.utilisateurs);
      totalPages = res.total_pages;
      page++;
    } while (page <= totalPages);
    return all;
  }

  async createUser(userData: any, token: string) {
    return this.request<{ message: string }>('/admin/users/', 'POST', userData, token);
  }

  async updateUser(matricule: string, userData: any, token: string) {
    return this.request<{ message: string }>(`/admin/users/${matricule}/`, 'PUT', userData, token);
  }

  async resetUserPassword(matricule: string, mot_de_passe: string, token: string) {
    return this.request<{ message: string }>(`/admin/users/${matricule}/`, 'PATCH', { mot_de_passe }, token);
  }

  // Suppression logique côté backend : le compte passe inactif.
  async deleteUser(matricule: string, token: string) {
    return this.request<{ message: string }>(`/admin/users/${matricule}/`, 'DELETE', undefined, token);
  }

  async getAuditJournal(token: string): Promise<AuditEntry[]> {
    return this.request<AuditEntry[]>('/admin/audit-journal/', 'GET', undefined, token);
  }

  // Responsable Parc - Inventaire
  async getEquipments(token: string, etat?: string): Promise<Equipment[]> {
    const query = etat ? `?etat=${encodeURIComponent(etat)}` : '';
    const raw = await this.request<any[]>(`/parc/equipements/${query}`, 'GET', undefined, token);
    return raw.map(normalizeEquipment);
  }

  async exportEquipmentsExcel(token: string) {
    return this.downloadFile('/parc/equipements/?format=excel', 'inventaire_parc_informatique.xlsx', token);
  }

  async addEquipment(equipment: any, token: string) {
    return this.request<{ message: string }>('/parc/equipements/', 'POST', equipment, token);
  }

  async updateEquipment(id: number, equipment: any, token: string) {
    return this.request<{ message: string }>(`/parc/equipements/${id}/`, 'PUT', equipment, token);
  }

  // Equipements disponibles pour affectation / actuellement affectés (pour désaffectation)
  async getAvailableEquipments(token: string): Promise<Equipment[]> {
    const raw = await this.request<any[]>('/parc/affectations/', 'GET', undefined, token);
    return raw.map(normalizeEquipment);
  }

  async getAssignedEquipments(token: string): Promise<Equipment[]> {
    const raw = await this.request<any[]>('/parc/desaffectations/', 'GET', undefined, token);
    return raw.map(normalizeEquipment);
  }

  async affectEquipment(id_equipement: number, matricule_agent: string, token: string) {
    return this.request<{ message: string }>('/parc/affectations/', 'POST', { id_equipement, matricule_agent }, token);
  }

  async desaffectEquipment(id_equipement: number, motif: string, token: string) {
    return this.request<{ message: string }>('/parc/desaffectations/', 'POST', { id_equipement, motif }, token);
  }

  // Traitement des demandes d'équipement
  async getPendingRequests(token: string): Promise<EquipmentRequest[]> {
    return this.request<EquipmentRequest[]>('/parc/demandes/traiter/', 'GET', undefined, token);
  }

  async processRequest(id_demande: number, action: 'VALIDER' | 'REFUSER', motif_rejet: string | undefined, token: string) {
    return this.request<{ message: string }>('/parc/demandes/traiter/', 'POST', { id_demande, action, motif_rejet }, token);
  }

  // Acquisitions
  async submitAcquisition(designation_materiel: string, motif: string, token: string) {
    return this.request<{ message: string }>('/parc/acquisitions/', 'POST', { designation_materiel, motif }, token);
  }

  async getAcquisitionsDirector(token: string): Promise<AcquisitionRequest[]> {
    return this.request<AcquisitionRequest[]>('/directeur/acquisitions/', 'GET', undefined, token);
  }

  async processAcquisitionDirector(id_acquisition: number, action: 'VALIDER' | 'REFUSER', motif_rejet: string | undefined, token: string) {
    return this.request<{ message: string }>('/directeur/acquisitions/', 'POST', { id_acquisition, action, motif_rejet }, token);
  }

  // Pannes & Maintenances (Responsable Parc)
  // GET /parc/maintenances/ ne renvoie que les pannes NON encore planifiées.
  async getOpenBreakdowns(token: string): Promise<BreakdownReport[]> {
    return this.request<BreakdownReport[]>('/parc/maintenances/', 'GET', undefined, token);
  }

  async planMaintenance(id_panne: number, type_maintenance: string, description: string | undefined, token: string) {
    return this.request<{ message: string }>('/parc/maintenances/', 'POST', {
      action: 'PLANIFIER',
      id_panne,
      type_maintenance,
      description
    }, token);
  }

  async closeMaintenance(id_maintenance: number, cout: number, resultat: string, token: string) {
    return this.request<{ message: string }>('/parc/maintenances/', 'POST', {
      action: 'CLOTURER',
      id_maintenance,
      cout,
      resultat
    }, token);
  }

  async setDecommissioned(id_equipement: number, token: string) {
    return this.request<{ message: string }>('/parc/maintenances/', 'POST', { action: 'HORS_SERVICE', id_equipement }, token);
  }

  // Agent
  async submitAgentRequest(type: string, justification: string, token: string) {
    return this.request<{ message: string }>('/agent/demandes/', 'POST', { type, justification }, token);
  }

  async getAgentRequests(token: string): Promise<EquipmentRequest[]> {
    return this.request<EquipmentRequest[]>('/agent/demandes/suivi/', 'GET', undefined, token);
  }

  async reportBreakdown(id_equipement: number, description: string, token: string) {
    return this.request<{ message: string }>('/agent/pannes/signaler/', 'POST', { id_equipement, description }, token);
  }

  async getAgentPersonalSpace(token: string): Promise<AgentPersonalSpace> {
    return this.request<AgentPersonalSpace>('/agent/espace-personnel/', 'GET', undefined, token);
  }

  // Scan QR Code / Code Inventaire (public, transversal, sans authentification)
  async scanEquipment(param: { qr_code?: string; code_inventaire?: string }): Promise<ScanResult> {
    const query = param.qr_code
      ? `?qr_code=${encodeURIComponent(param.qr_code)}`
      : `?code_inventaire=${encodeURIComponent(param.code_inventaire || '')}`;
    return this.request<ScanResult>(`/equipements/scan/${query}`, 'GET');
  }

  // Directeur - Analytique
  async getDirectorDashboard(token: string, date_debut?: string, date_fin?: string): Promise<DashboardStats> {
    let query = '';
    if (date_debut && date_fin) {
      query = `?date_debut=${date_debut}&date_fin=${date_fin}`;
    }
    const raw = await this.request<any>(`/directeur/dashboard/${query}`, 'GET', undefined, token);
    return {
      total_disponibles: raw.kpis_equipements?.total_disponibles ?? 0,
      total_affectes: raw.kpis_equipements?.total_affectes ?? 0,
      total_en_maintenance: raw.kpis_equipements?.total_en_maintenance ?? 0,
      total_hors_service: raw.kpis_equipements?.total_hors_service ?? 0,
      demandes_en_attente: raw.kpis_demandes_et_pannes?.demandes_en_attente ?? 0,
      pannes_non_resolues: raw.kpis_demandes_et_pannes?.pannes_non_resolues ?? 0,
    };
  }

  // Historique global (public)
  async getGlobalHistory(): Promise<GlobalHistoryEntry[]> {
    return this.request<GlobalHistoryEntry[]>('/parc/historique-global/', 'GET');
  }

  async exportGlobalHistoryExcel(token?: string) {
    return this.downloadFile('/parc/historique-global/?format=excel', 'historique_parc_informatique.xlsx', token);
  }
}

export const apiService = new ApiService();
