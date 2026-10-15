import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  UserFormData,
  OpenMaintenance,
  AdminUser
} from '../types';
import { useAuth } from './AuthContext';
import { apiService } from '../services/api';
import { extractScanCode } from '../services/qr';

type ActionResult = { success: boolean; message: string };

interface DataContextType {
  isLoading: boolean;
  loadError: string | null;

  // Admin
  users: AdminUser[];
  auditLogs: AuditEntry[];

  // Responsable Parc
  equipments: Equipment[];
  pendingRequests: EquipmentRequest[];
  openBreakdowns: BreakdownReport[];
  openMaintenances: OpenMaintenance[];

  // Directeur
  dashboardStats: DashboardStats | null;
  acquisitions: AcquisitionRequest[];
  globalHistory: GlobalHistoryEntry[];
  fetchDirectorDashboard: (date_debut?: string, date_fin?: string) => Promise<void>;

  // Agent
  myRequests: EquipmentRequest[];
  myEquipments: Equipment[];

  refreshData: () => Promise<void>;

  addUser: (data: UserFormData) => Promise<ActionResult>;
  editUser: (matricule: string, data: Partial<UserFormData>) => Promise<ActionResult>;
  deleteUser: (matricule: string) => Promise<ActionResult>;

  addEquipment: (data: Omit<Equipment, 'id_equipement'>) => Promise<ActionResult>;
  updateEquipment: (id: number, data: Partial<Equipment>) => Promise<ActionResult>;
  affectEquipment: (id_equipement: number, matricule_agent: string) => Promise<ActionResult>;
  desaffectEquipment: (id_equipement: number, motif: string) => Promise<ActionResult>;

  submitAgentRequest: (type: string, justification: string) => Promise<ActionResult>;
  processRequest: (id_demande: number, action: 'VALIDER' | 'REFUSER', motif_rejet?: string) => Promise<ActionResult>;

  reportBreakdown: (id_equipement: number, description: string) => Promise<ActionResult>;
  planMaintenance: (id_panne: number, type_maintenance: 'CORRECTIVE' | 'PREVENTIVE', description?: string) => Promise<ActionResult>;
  closeMaintenance: (id_maintenance: number, cout: number, resultat: 'REPARE' | 'NON_REPARABLE') => Promise<ActionResult>;
  decommissionEquipment: (id_equipement: number) => Promise<ActionResult>;

  submitAcquisition: (designation_materiel: string, motif: string) => Promise<ActionResult>;
  processAcquisition: (id_acquisition: number, action: 'VALIDER' | 'REFUSER', motif_rejet?: string) => Promise<ActionResult>;

  scanEquipment: (codeOrQr: string) => Promise<ScanResult | null>;
  exportHistoryExcel: () => Promise<ActionResult>;
  exportEquipmentsExcel: () => Promise<ActionResult>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, token } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);

  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [pendingRequests, setPendingRequests] = useState<EquipmentRequest[]>([]);
  const [openBreakdowns, setOpenBreakdowns] = useState<BreakdownReport[]>([]);
  const [openMaintenances, setOpenMaintenances] = useState<OpenMaintenance[]>([]);

  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [acquisitions, setAcquisitions] = useState<AcquisitionRequest[]>([]);
  const [globalHistory, setGlobalHistory] = useState<GlobalHistoryEntry[]>([]);

  const [myRequests, setMyRequests] = useState<EquipmentRequest[]>([]);
  const [myEquipments, setMyEquipments] = useState<Equipment[]>([]);

  // Enrichit les équipements AFFECTE avec le matricule agent (GET /parc/equipements/
  // ne l'expose pas ; il faut croiser avec /parc/desaffectations/).
  const fetchEquipmentsEnriched = async (tok: string): Promise<Equipment[]> => {
    const [list, assigned] = await Promise.all([
      apiService.getEquipments(tok),
      apiService.getAssignedEquipments(tok).catch(() => [] as Equipment[])
    ]);
    const assignedMap = new Map(assigned.map(a => [a.id_equipement, a.affecte_a]));
    return list.map(e => ({ ...e, affecte_a: assignedMap.get(e.id_equipement) ?? e.affecte_a }));
  };

  // Enrichit les pannes ouvertes avec code_inventaire / désignation depuis la liste équipements.
  const enrichBreakdowns = (breakdowns: BreakdownReport[], eqList: Equipment[]): BreakdownReport[] => {
    const eqMap = new Map(eqList.map(e => [e.id_equipement, e]));
    return breakdowns.map(b => {
      const eq = eqMap.get(b.id_equipement);
      return {
        ...b,
        code_inventaire: eq?.code_inventaire,
        designation_materiel: eq?.designation
      };
    });
  };

  // Il n'existe pas d'endpoint listant les interventions en cours : on les
  // retrouve en scannant chaque équipement EN_MAINTENANCE (historique_maintenance
  // contient l'entrée resultat=EN_COURS avec son id_maintenance, nécessaire à la clôture).
  const fetchOpenMaintenances = async (eqList: Equipment[]): Promise<OpenMaintenance[]> => {
    const inMaintenance = eqList.filter(e => e.etat === 'EN_MAINTENANCE');
    const results = await Promise.all(inMaintenance.map(async (eq) => {
      try {
        const scan = await apiService.scanEquipment({ code_inventaire: eq.code_inventaire });
        const ongoing = scan.historique_maintenance.find(m => m.resultat === 'EN_COURS');
        if (!ongoing) return null;
        const entry: OpenMaintenance = {
          ...ongoing,
          id_equipement: eq.id_equipement,
          code_inventaire: eq.code_inventaire,
          designation: eq.designation
        };
        return entry;
      } catch {
        return null;
      }
    }));
    return results.filter((r): r is OpenMaintenance => r !== null);
  };

  const fetchDirectorDashboard = useCallback(async (date_debut?: string, date_fin?: string) => {
    if (!token) return;
    try {
      const stats = await apiService.getDirectorDashboard(token, date_debut, date_fin);
      setDashboardStats(stats);
    } catch (err: any) {
      setLoadError(err.message);
    }
  }, [token]);

  const refreshData = useCallback(async () => {
    if (!token || !currentUser) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      if (currentUser.role === 'ADMINISTRATEUR') {
        const [userList, audit] = await Promise.all([
          apiService.getUsers(token),
          apiService.getAuditJournal(token)
        ]);
        setUsers(userList);
        setAuditLogs(audit);
      }

      if (currentUser.role === 'RESPONSABLE_PARC') {
        const eqList = await fetchEquipmentsEnriched(token);
        setEquipments(eqList);

        const [reqList, breakdowns] = await Promise.all([
          apiService.getPendingRequests(token),
          apiService.getOpenBreakdowns(token)
        ]);
        setPendingRequests(reqList);
        setOpenBreakdowns(enrichBreakdowns(breakdowns, eqList));
        setOpenMaintenances(await fetchOpenMaintenances(eqList));
      }

      if (currentUser.role === 'DIRECTEUR') {
        const today = new Date().toISOString().substring(0, 10);
        const yearStart = `${new Date().getFullYear()}-01-01`;
        await fetchDirectorDashboard(yearStart, today);
        const [acqList, history] = await Promise.all([
          apiService.getAcquisitionsDirector(token),
          apiService.getGlobalHistory()
        ]);
        setAcquisitions(acqList);
        setGlobalHistory(history);
      }

      if (currentUser.role === 'AGENT_BENEFICIAIRE') {
        const [reqList, space] = await Promise.all([
          apiService.getAgentRequests(token),
          apiService.getAgentPersonalSpace(token)
        ]);
        setMyRequests(reqList);
        setMyEquipments(space.equipements_affectes.map(e => ({
          id_equipement: e.id_equipement,
          code_inventaire: e.code_inventaire,
          designation: e.designation,
          marque: e.marque,
          modele: e.modele,
          etat: 'AFFECTE',
          affecte_a: currentUser.matricule
        })));
      }
    } catch (err: any) {
      setLoadError(err.message || 'Erreur de communication avec le serveur.');
    } finally {
      setIsLoading(false);
    }
  }, [token, currentUser, fetchDirectorDashboard]);

  useEffect(() => {
    if (currentUser && token) {
      refreshData();
    } else {
      setUsers([]);
      setAuditLogs([]);
      setEquipments([]);
      setPendingRequests([]);
      setOpenBreakdowns([]);
      setOpenMaintenances([]);
      setDashboardStats(null);
      setAcquisitions([]);
      setGlobalHistory([]);
      setMyRequests([]);
      setMyEquipments([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.matricule, token]);

  // 1. Gestion des utilisateurs (Admin)
  const reloadAdminData = async (tok: string) => {
    const [userList, audit] = await Promise.all([
      apiService.getUsers(tok),
      apiService.getAuditJournal(tok)
    ]);
    setUsers(userList);
    setAuditLogs(audit);
  };

  const addUser = async (data: UserFormData): Promise<ActionResult> => {
    if (!token) return { success: false, message: 'Non authentifié.' };
    try {
      const res = await apiService.createUser(data, token);
      await reloadAdminData(token);
      return { success: true, message: res.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  const editUser = async (matricule: string, data: Partial<UserFormData>): Promise<ActionResult> => {
    if (!token) return { success: false, message: 'Non authentifié.' };
    try {
      const { mot_de_passe, ...fields } = data;
      const res = await apiService.updateUser(matricule, fields, token);
      // Réinitialisation du mot de passe : endpoint dédié PATCH /admin/users/{matricule}/
      if (mot_de_passe) {
        await apiService.resetUserPassword(matricule, mot_de_passe, token);
      }
      await reloadAdminData(token);
      return { success: true, message: res.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  const deleteUser = async (matricule: string): Promise<ActionResult> => {
    if (!token) return { success: false, message: 'Non authentifié.' };
    try {
      const res = await apiService.deleteUser(matricule, token);
      await reloadAdminData(token);
      return { success: true, message: res?.message || `Compte ${matricule} désactivé.` };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  // 2. Inventaire (Responsable Parc)
  const addEquipment = async (data: Omit<Equipment, 'id_equipement'>): Promise<ActionResult> => {
    if (!token) return { success: false, message: 'Non authentifié.' };
    try {
      const res = await apiService.addEquipment(data, token);
      setEquipments(await fetchEquipmentsEnriched(token));
      return { success: true, message: res.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  const updateEquipment = async (id: number, data: Partial<Equipment>): Promise<ActionResult> => {
    if (!token) return { success: false, message: 'Non authentifié.' };
    try {
      const res = await apiService.updateEquipment(id, data, token);
      setEquipments(await fetchEquipmentsEnriched(token));
      return { success: true, message: res.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  const affectEquipment = async (id_equipement: number, matricule_agent: string): Promise<ActionResult> => {
    if (!token) return { success: false, message: 'Non authentifié.' };
    try {
      const res = await apiService.affectEquipment(id_equipement, matricule_agent, token);
      setEquipments(await fetchEquipmentsEnriched(token));
      return { success: true, message: res.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  const desaffectEquipment = async (id_equipement: number, motif: string): Promise<ActionResult> => {
    if (!token) return { success: false, message: 'Non authentifié.' };
    try {
      const res = await apiService.desaffectEquipment(id_equipement, motif, token);
      setEquipments(await fetchEquipmentsEnriched(token));
      return { success: true, message: res.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  // 3. Demandes agent
  const submitAgentRequest = async (type: string, justification: string): Promise<ActionResult> => {
    if (!token) return { success: false, message: 'Non authentifié.' };
    try {
      const res = await apiService.submitAgentRequest(type, justification, token);
      setMyRequests(await apiService.getAgentRequests(token));
      return { success: true, message: res.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  const processRequest = async (id_demande: number, action: 'VALIDER' | 'REFUSER', motif_rejet?: string): Promise<ActionResult> => {
    if (!token) return { success: false, message: 'Non authentifié.' };
    try {
      const res = await apiService.processRequest(id_demande, action, motif_rejet, token);
      setPendingRequests(await apiService.getPendingRequests(token));
      return { success: true, message: res.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  // 4. Pannes & Maintenances
  const reportBreakdown = async (id_equipement: number, description: string): Promise<ActionResult> => {
    if (!token) return { success: false, message: 'Non authentifié.' };
    try {
      const res = await apiService.reportBreakdown(id_equipement, description, token);
      if (currentUser?.role === 'AGENT_BENEFICIAIRE') {
        const space = await apiService.getAgentPersonalSpace(token);
        setMyEquipments(space.equipements_affectes.map(e => ({
          id_equipement: e.id_equipement,
          code_inventaire: e.code_inventaire,
          designation: e.designation,
          marque: e.marque,
          modele: e.modele,
          etat: 'AFFECTE',
          affecte_a: currentUser.matricule
        })));
      }
      return { success: true, message: res.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  const planMaintenance = async (id_panne: number, type_maintenance: 'CORRECTIVE' | 'PREVENTIVE', description?: string): Promise<ActionResult> => {
    if (!token) return { success: false, message: 'Non authentifié.' };
    try {
      const res = await apiService.planMaintenance(id_panne, type_maintenance, description, token);
      const eqList = await fetchEquipmentsEnriched(token);
      setEquipments(eqList);
      setOpenBreakdowns(enrichBreakdowns(await apiService.getOpenBreakdowns(token), eqList));
      setOpenMaintenances(await fetchOpenMaintenances(eqList));
      return { success: true, message: res.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  const closeMaintenance = async (id_maintenance: number, cout: number, resultat: 'REPARE' | 'NON_REPARABLE'): Promise<ActionResult> => {
    if (!token) return { success: false, message: 'Non authentifié.' };
    try {
      const res = await apiService.closeMaintenance(id_maintenance, cout, resultat, token);
      const eqList = await fetchEquipmentsEnriched(token);
      setEquipments(eqList);
      setOpenMaintenances(await fetchOpenMaintenances(eqList));
      return { success: true, message: res.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  const decommissionEquipment = async (id_equipement: number): Promise<ActionResult> => {
    if (!token) return { success: false, message: 'Non authentifié.' };
    try {
      const res = await apiService.setDecommissioned(id_equipement, token);
      setEquipments(await fetchEquipmentsEnriched(token));
      return { success: true, message: res.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  // 5. Acquisitions
  const submitAcquisition = async (designation_materiel: string, motif: string): Promise<ActionResult> => {
    if (!token) return { success: false, message: 'Non authentifié.' };
    try {
      const res = await apiService.submitAcquisition(designation_materiel, motif, token);
      return { success: true, message: res.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  const processAcquisition = async (id_acquisition: number, action: 'VALIDER' | 'REFUSER', motif_rejet?: string): Promise<ActionResult> => {
    if (!token) return { success: false, message: 'Non authentifié.' };
    try {
      const res = await apiService.processAcquisitionDirector(id_acquisition, action, motif_rejet, token);
      setAcquisitions(await apiService.getAcquisitionsDirector(token));
      return { success: true, message: res.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  // 6. Scan QR / Code Inventaire (transversal)
  const scanEquipment = async (codeOrQr: string): Promise<ScanResult | null> => {
    try {
      // `qr_code` : le backend y accepte la valeur QR, avec ou sans préfixe
      // `QR_`, ainsi que le code inventaire.
      return await apiService.scanEquipment({ qr_code: extractScanCode(codeOrQr) });
    } catch {
      return null;
    }
  };

  // 7. Exports XLSX générés par le backend (?format=excel)
  const exportHistoryExcel = async (): Promise<ActionResult> => {
    try {
      await apiService.exportGlobalHistoryExcel(token ?? undefined);
      return { success: true, message: 'Historique exporté.' };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  const exportEquipmentsExcel = async (): Promise<ActionResult> => {
    if (!token) return { success: false, message: 'Non authentifié.' };
    try {
      await apiService.exportEquipmentsExcel(token);
      return { success: true, message: 'Inventaire exporté.' };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  return (
    <DataContext.Provider value={{
      isLoading,
      loadError,
      users,
      auditLogs,
      equipments,
      pendingRequests,
      openBreakdowns,
      openMaintenances,
      dashboardStats,
      acquisitions,
      globalHistory,
      fetchDirectorDashboard,
      myRequests,
      myEquipments,
      refreshData,
      addUser,
      editUser,
      deleteUser,
      addEquipment,
      updateEquipment,
      affectEquipment,
      desaffectEquipment,
      submitAgentRequest,
      processRequest,
      reportBreakdown,
      planMaintenance,
      closeMaintenance,
      decommissionEquipment,
      submitAcquisition,
      processAcquisition,
      scanEquipment,
      exportHistoryExcel,
      exportEquipmentsExcel
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
