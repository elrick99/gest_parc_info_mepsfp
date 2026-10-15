export type Role =
  | 'ADMINISTRATEUR'
  | 'RESPONSABLE_PARC'
  | 'AGENT_BENEFICIAIRE'
  | 'DIRECTEUR';

export type EquipmentState =
  | 'DISPONIBLE'
  | 'AFFECTE'
  | 'EN_PANNE'
  | 'EN_MAINTENANCE'
  | 'HORS_SERVICE';

// Confirmé empiriquement contre le backend réel : VALIDEE (accord féminin sur
// "demande"/"acquisition") et REJETEE (pas "REFUSEE", malgré l'action POST "REFUSER").
export type RequestStatus =
  | 'EN_ATTENTE'
  | 'VALIDEE'
  | 'REJETEE';

export type MaintenanceType =
  | 'CORRECTIVE'
  | 'PREVENTIVE';

export type MaintenanceResult =
  | 'REPARE'
  | 'NON_REPARABLE'
  | 'EN_COURS';

export interface User {
  matricule: string;
  nom: string;
  prenom: string;
  role: Role;
  telephone?: string;
  access_token?: string;
}

// GET /admin/users/ (élément de `utilisateurs`)
export interface AdminUser extends User {
  is_active: boolean;
  dernier_login: string | null;
  date_creation: string;
  section: string | null;
  status: string; // libellé backend, ex. "jamais connecté"
}

export type AdminUserStatusFilter = 'all' | 'active' | 'inactive';

export interface UserFormData {
  matricule: string;
  nom: string;
  prenom: string;
  mot_de_passe?: string;
  role: Role;
  telephone: string;
}

export interface AuditEntry {
  id_historique: number;
  date_action: string;
  action: string;
  description: string;
  utilisateur: string;
}

// Normalisé par la couche services/api.ts (le backend renvoie parfois `id`
// au lieu de `id_equipement` selon l'endpoint - cf. GET /parc/equipements/).
export interface Equipment {
  id_equipement: number;
  code_inventaire: string;
  designation: string;
  marque?: string;
  modele?: string;
  etat: EquipmentState;
  description?: string;
  qr_code?: string;
  date_acquisition?: string;
  affecte_a?: string; // matricule agent, enrichi côté client via /parc/desaffectations/
}

// Vue Responsable Parc (GET /parc/demandes/traiter/) et vue Agent
// (GET /agent/demandes/suivi/) n'exposent pas exactement les mêmes champs.
export interface EquipmentRequest {
  id_demande: number;
  date_demande: string;
  designation_materiel: string;
  statut: RequestStatus;
  matricule_agent?: string; // présent côté vue Responsable Parc
  motif?: string; // libellé champ côté vue Responsable Parc
  motif_justification?: string; // libellé champ côté détail Agent
  traitee_par?: string; // présent côté détail Agent une fois traitée
  motif_rejet?: string;
}

// GET /parc/maintenances/ (Responsable Parc) : liste des pannes NON encore planifiées.
export interface BreakdownReport {
  id_panne: number;
  id_equipement: number;
  code_inventaire?: string; // enrichi côté client depuis la liste équipements
  designation_materiel?: string; // idem
  matricule_agent: string;
  date_panne: string;
  description: string;
  statut: string; // 'OUVERTE' observé
}

// Historique de maintenance d'un équipement, renvoyé par le scan et par
// /parc/suivi/{id}/. C'est ici que se trouve id_maintenance (nécessaire
// pour clôturer une intervention), pas dans un endpoint de listing dédié.
export interface MaintenanceHistoryEntry {
  id_maintenance: number;
  date: string;
  type: MaintenanceType;
  description: string;
  resultat: MaintenanceResult;
  cout: number;
  matricule_intervenant?: string;
  nom_intervenant?: string;
  prenom_intervenant?: string;
}

// Intervention "en cours" détectée via le scan d'un équipement EN_MAINTENANCE,
// enrichie des infos de l'équipement pour affichage/actions dans le dashboard RP.
export interface OpenMaintenance extends MaintenanceHistoryEntry {
  id_equipement: number;
  code_inventaire: string;
  designation: string;
}

export interface AcquisitionRequest {
  id_acquisition: number;
  designation_materiel: string;
  motif_justification: string;
  date_demande: string;
  statut: RequestStatus;
  motif_rejet?: string;
}

// GET /parc/historique-global/ (public) : pas d'id ni d'acteur côté backend.
export interface GlobalHistoryEntry {
  date: string;
  type_action: string;
  description: string;
}

// GET /directeur/dashboard/
export interface DashboardStats {
  total_disponibles: number;
  total_affectes: number;
  total_en_maintenance: number;
  total_hors_service: number;
  demandes_en_attente: number;
  pannes_non_resolues: number;
}

export interface ScanResult {
  fiche_equipement: {
    id_equipement: number;
    code_inventaire: string;
    designation: string;
    marque?: string;
    modele?: string;
    etat: EquipmentState;
    qr_code: string;
    description?: string;
    matricule_agent?: string | null;
    nom_agent?: string | null;
    prenom_agent?: string | null;
  };
  historique_maintenance: MaintenanceHistoryEntry[];
}

// GET /agent/espace-personnel/
export interface AgentPersonalSpace {
  historique_demandes: Array<{
    id_demande: number;
    date: string;
    materiel: string;
    statut: RequestStatus;
  }>;
  equipements_affectes: Array<{
    id_equipement: number;
    code_inventaire: string;
    designation: string;
    marque?: string;
    modele?: string;
    date_affectation: string;
  }>;
}
