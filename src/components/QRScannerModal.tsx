import React, { useRef, useState } from 'react';
import { X, QrCode, Search, Printer, Wrench, CheckCircle2, AlertOctagon, History, Camera, ImageUp } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useData } from '../context/DataContext';
import { ScanResult } from '../types';
import { QRCameraScanner } from './QRCameraScanner';
import { decodeQrFromFile, extractScanCode } from '../services/qr';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose }) => {
  const { scanEquipment } = useData();
  const [searchInput, setSearchInput] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // `raw` peut être une saisie manuelle ou le contenu d'un QR code (URL de
  // l'étiquette) : seule la valeur attendue par l'API est conservée.
  const runScan = async (raw: string) => {
    const code = extractScanCode(raw);
    setSearchInput(code);
    setDecodeError(null);
    setIsSearching(true);
    const res = await scanEquipment(code);
    setResult(res);
    setHasSearched(true);
    setIsSearching(false);
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchInput.trim()) return;
    runScan(searchInput);
  };

  const handleCameraDetected = (value: string) => {
    setIsCameraOn(false);
    runScan(value);
  };

  const handleImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setIsCameraOn(false);
    try {
      const value = await decodeQrFromFile(file);
      if (value) {
        runScan(value);
        return;
      }
      setDecodeError('Aucun QR code lisible dans cette image.');
    } catch {
      setDecodeError("Impossible de lire cette image.");
    }
    setHasSearched(false);
  };

  const handleClose = () => {
    setIsCameraOn(false);
    onClose();
  };

  const handlePrintLabel = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-surface border border-line-strong text-fg rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line pb-4 mb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-elevated text-fg border border-line-strong">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif text-fg">Scan QR Code & Numéro de Série</h2>
              <p className="text-xs text-subtle font-mono">Inspection instantanée du cycle de vie matériel</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="p-1.5 rounded-lg text-subtle hover:text-fg hover:bg-hover transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSearch} className="space-y-4 mb-6">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-subtle mb-1.5">
              Code Inventaire ou Valeur QR Code
            </label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-subtle absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Ex: INV-LAP-099 ou QR_INV-LAP-099"
                  className="w-full bg-sunken border border-line-strong focus:border-accent rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-fg font-mono focus:outline-none transition"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="px-5 py-2.5 bg-inverse hover:bg-inverse/85 text-on-inverse font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-1.5"
              >
                <span>{isSearching ? 'Recherche...' : 'Inspecter'}</span>
              </button>
            </div>
          </div>

          {/* Camera / Image Scan Triggers */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-elevated p-3 rounded-xl border border-line-strong text-xs text-muted">
            <div className="flex items-center space-x-2">
              <Camera className="w-4 h-4 text-fg-2" />
              <span className="font-mono text-[11px]">Scanner l'étiquette QR :</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsCameraOn(on => !on)}
                className="px-2.5 py-1 bg-elevated hover:bg-hover-strong text-fg rounded-lg text-[11px] font-mono border border-line-strong transition flex items-center space-x-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{isCameraOn ? 'Arrêter la caméra' : 'Ouvrir la caméra'}</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 bg-elevated hover:bg-hover-strong text-fg rounded-lg text-[11px] font-mono border border-line-strong transition flex items-center space-x-1.5"
              >
                <ImageUp className="w-3.5 h-3.5" />
                <span>Importer une photo</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageSelected}
                className="hidden"
              />
            </div>
          </div>

          {isCameraOn && <QRCameraScanner onDetected={handleCameraDetected} />}

          {decodeError && (
            <p className="text-xs text-amber-300 font-mono">{decodeError}</p>
          )}
        </form>

        {/* Scan Results Output */}
        {hasSearched && (
          <div>
            {!result ? (
              <div className="p-6 text-center bg-sunken rounded-xl border border-line-strong text-muted text-sm">
                <AlertOctagon className="w-8 h-8 text-amber-400 mx-auto mb-2 opacity-80" />
                <p>Aucun équipement trouvé avec la clé : <span className="font-mono text-amber-300">{searchInput}</span></p>
              </div>
            ) : (
              <div id="printable-qr-card" className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
                
                {/* Equipment Fiche Card */}
                <div className="bg-sunken p-5 rounded-2xl border border-line-strong relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-elevated text-fg-2 border border-line-strong">
                          {result.fiche_equipement.code_inventaire}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-elevated text-emerald-400 border border-line-strong">
                          {result.fiche_equipement.etat}
                        </span>
                      </div>
                      <h3 className="text-lg font-serif text-fg mt-1">{result.fiche_equipement.designation}</h3>
                      <p className="text-xs text-muted">
                        {result.fiche_equipement.marque} {result.fiche_equipement.modele}
                      </p>
                      {result.fiche_equipement.matricule_agent && (
                        <p className="text-xs text-fg-2 mt-2 font-medium">
                          Affecté à : <span className="font-mono font-bold text-fg">
                            {[result.fiche_equipement.prenom_agent, result.fiche_equipement.nom_agent].filter(Boolean).join(' ')}
                            {' '}({result.fiche_equipement.matricule_agent})
                          </span>
                        </p>
                      )}
                    </div>

                    {/* QR Code Graphic Badge */}
                    <div className="bg-white p-3 rounded-xl shadow-md flex flex-col items-center justify-center shrink-0">
                      <QRCodeSVG value={result.fiche_equipement.qr_code} size={88} />
                      <span className="text-[9px] font-mono font-bold text-black mt-1">
                        {result.fiche_equipement.qr_code}
                      </span>
                    </div>

                  </div>
                </div>

                {/* Maintenance History Timeline */}
                <div className="bg-sunken rounded-2xl p-4 border border-line-strong">
                  <div className="flex items-center space-x-2 text-[10px] font-bold text-subtle uppercase tracking-[0.2em] mb-3">
                    <History className="w-3.5 h-3.5 text-muted" />
                    <span>Historique des Maintenances ({result.historique_maintenance.length})</span>
                  </div>

                  {result.historique_maintenance.length === 0 ? (
                    <p className="text-xs text-subtle italic p-3 text-center bg-elevated rounded-xl border border-line">
                      Aucune intervention de maintenance enregistrée pour cet appareil.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {result.historique_maintenance.map((m, idx) => (
                        <div key={idx} className="bg-elevated p-3 rounded-xl border border-line-strong flex items-start justify-between text-xs">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-fg">{m.type}</span>
                              <span className="text-faint">•</span>
                              <span className="text-muted font-mono text-[11px]">{m.date}</span>
                            </div>
                            <p className="text-fg-2">{m.description}</p>
                            <div className="text-[11px] text-muted font-semibold">
                              Résultat: <span className="text-fg">{m.resultat}</span>
                            </div>
                          </div>
                          <div className="font-mono font-bold text-emerald-400 text-right">
                            {m.cout.toLocaleString()} FCFA
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Print Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handlePrintLabel}
                    className="px-4 py-2 bg-elevated hover:bg-hover-strong text-fg rounded-xl text-xs font-semibold border border-line-strong transition flex items-center space-x-1.5"
                  >
                    <Printer className="w-3.5 h-3.5 text-muted" />
                    <span>Imprimer Étiquette QR</span>
                  </button>
                </div>

              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
