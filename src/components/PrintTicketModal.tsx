import React from 'react';
import type { Language, OPDToken } from '../types';
import { Printer, X, CheckCircle2 } from 'lucide-react';

interface PrintTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: OPDToken | null;
  language: Language;
}

export const PrintTicketModal: React.FC<PrintTicketModalProps> = ({
  isOpen,
  onClose,
  token,
  language,
}) => {
  if (!isOpen || !token) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border-2 border-outline-subtle relative flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header Actions (Excluded from print) */}
        <div className="p-4 sm:p-5 border-b border-outline-subtle flex items-center justify-between no-print bg-surface-container-low rounded-t-3xl">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-secondary" />
            <h3 className="font-extrabold text-lg sm:text-xl text-primary">
              {language === 'te' ? 'అధికారిక OPD పాస్ ప్రింట్' : 'Official OPD Pass Print Preview'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="btn-pill-primary py-2 px-4 text-sm flex items-center gap-2 shadow-sm"
            >
              <Printer className="w-4 h-4 text-secondary-fixed" />
              <span>{language === 'te' ? 'ఇప్పుడే ప్రింట్ చేయండి' : 'Print Ticket Now'}</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Ticket Area */}
        <div className="p-6 sm:p-8 space-y-6 print-area bg-white text-primary">
          {/* Official Govt & Hospital Header */}
          <div className="border-b-2 border-primary pb-4 text-center space-y-1">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="w-3 h-3 rounded-full bg-secondary inline-block" />
              <span className="text-xs font-black uppercase tracking-widest text-secondary">
                GOVERNMENT OF ANDHRA PRADESH
              </span>
              <span className="w-3 h-3 rounded-full bg-secondary inline-block" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-primary tracking-tight">
              HEALTH, MEDICAL & FAMILY WELFARE DEPARTMENT
            </h2>
            <p className="text-xs text-on-surface-variant font-semibold">
              District Hospital Telemetry Network • Visakhapatnam Node
            </p>
            <div className="inline-block mt-1 px-3 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-black">
              DR. YSR AAROGYASRI 100% CASHLESS OPD PASS
            </div>
          </div>

          {/* Token Big Highlight Banner */}
          <div className="p-5 rounded-2xl bg-surface-container-low border-2 border-primary/20 text-center space-y-1">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">
              {language === 'te' ? 'కేటాయించిన టోకెన్ నంబర్' : 'CONFIRMED QUEUE TOKEN NUMBER'}
            </span>
            <span className="text-4xl sm:text-5xl font-black text-primary font-mono tracking-tight block py-1">
              {token.tokenNumber}
            </span>
            <div className="flex items-center justify-center gap-4 text-xs font-semibold text-secondary">
              <span>● Status: {token.status}</span>
              <span>● Room: {token.roomNumber}</span>
              <span>● Est. Wait: ~{token.estimatedWaitMins} Mins</span>
            </div>
          </div>

          {/* Barcode & QR Code Graphic Representation */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-dashed border-outline-variant bg-surface">
            {/* SVG Barcode */}
            <div className="text-center sm:text-left">
              <svg className="w-48 h-12 mx-auto sm:mx-0" viewBox="0 0 190 48" fill="currentColor">
                <rect x="0" y="0" width="3" height="40" />
                <rect x="5" y="0" width="2" height="40" />
                <rect x="10" y="0" width="4" height="40" />
                <rect x="16" y="0" width="1" height="40" />
                <rect x="20" y="0" width="3" height="40" />
                <rect x="26" y="0" width="5" height="40" />
                <rect x="33" y="0" width="2" height="40" />
                <rect x="38" y="0" width="4" height="40" />
                <rect x="44" y="0" width="1" height="40" />
                <rect x="48" y="0" width="3" height="40" />
                <rect x="54" y="0" width="6" height="40" />
                <rect x="62" y="0" width="2" height="40" />
                <rect x="67" y="0" width="4" height="40" />
                <rect x="73" y="0" width="3" height="40" />
                <rect x="78" y="0" width="2" height="40" />
                <rect x="83" y="0" width="5" height="40" />
                <rect x="90" y="0" width="1" height="40" />
                <rect x="94" y="0" width="4" height="40" />
                <rect x="100" y="0" width="2" height="40" />
                <rect x="105" y="0" width="4" height="40" />
                <rect x="112" y="0" width="3" height="40" />
                <rect x="117" y="0" width="1" height="40" />
                <rect x="121" y="0" width="5" height="40" />
                <rect x="128" y="0" width="2" height="40" />
                <rect x="133" y="0" width="4" height="40" />
                <rect x="140" y="0" width="2" height="40" />
                <rect x="145" y="0" width="3" height="40" />
                <rect x="150" y="0" width="5" height="40" />
                <rect x="158" y="0" width="2" height="40" />
                <rect x="163" y="0" width="4" height="40" />
                <rect x="170" y="0" width="2" height="40" />
                <rect x="175" y="0" width="4" height="40" />
                <rect x="182" y="0" width="2" height="40" />
              </svg>
              <span className="text-[10px] font-mono tracking-widest text-outline block mt-1">
                {token.aarogyasriNumber}
              </span>
            </div>

            {/* Quick QR Code representation */}
            <div className="flex items-center gap-2">
              <div className="w-16 h-16 border-2 border-primary p-1 bg-white flex flex-wrap gap-0.5 items-center justify-center">
                <div className="w-5 h-5 bg-primary" />
                <div className="w-3 h-3 bg-secondary" />
                <div className="w-3 h-3 bg-primary" />
                <div className="w-5 h-5 bg-primary" />
              </div>
              <div className="text-left">
                <span className="text-[11px] font-bold text-primary block">Triage Fast-Scan</span>
                <span className="text-[10px] text-on-surface-variant block">Counter 3 Gateway</span>
              </div>
            </div>
          </div>

          {/* Patient & Clinic Specifications Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm border-t border-b border-outline-subtle py-4">
            <div>
              <span className="text-xs text-on-surface-variant block font-medium">Patient Full Name</span>
              <strong className="text-base text-primary font-bold block">{token.patientName}</strong>
              <span className="text-xs text-secondary font-semibold">{token.patientNameTe}</span>
            </div>

            <div>
              <span className="text-xs text-on-surface-variant block font-medium">Age & Locality</span>
              <strong className="text-base text-primary font-bold block">{token.age} Years • Senior Pass</strong>
              <span className="text-xs text-on-surface-variant">{token.locality}</span>
            </div>

            <div>
              <span className="text-xs text-on-surface-variant block font-medium">Assigned Hospital</span>
              <strong className="text-base text-primary font-bold block">{token.hospital}</strong>
            </div>

            <div>
              <span className="text-xs text-on-surface-variant block font-medium">Department & Room</span>
              <strong className="text-base text-secondary font-bold block">{token.department}</strong>
            </div>

            <div>
              <span className="text-xs text-on-surface-variant block font-medium">OPD Consultation Time</span>
              <strong className="text-base text-primary font-bold block">{token.timeSlot}</strong>
            </div>

            <div>
              <span className="text-xs text-on-surface-variant block font-medium">Health Scheme & Card ID</span>
              <strong className="text-base text-primary font-mono font-bold block">{token.aarogyasriNumber}</strong>
            </div>
          </div>

          {/* Hospital Instructions */}
          <div className="p-4 rounded-xl bg-surface text-xs space-y-1.5 text-on-surface-variant">
            <h5 className="font-bold text-primary text-sm flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-secondary" />
              <span>{language === 'te' ? 'రోగులకు ముఖ్య గమనిక:' : 'Essential Patient Instructions:'}</span>
            </h5>
            <p>1. Please arrive 15 minutes prior to your designated slot window at King George Hospital (KGH).</p>
            <p>2. Show this digital or printed pass directly at <strong>OPD Counter No. 3 (Aarogyasri Green Channel)</strong>.</p>
            <p>3. Senior citizens aged 60+ receive immediate priority wheelchair assistance at Main Gate Counter.</p>
            <p>4. 100% Free consultation, standard diagnostics, and generic medicines under Dr. YSR Aarogyasri Trust.</p>
          </div>

          {/* Footer Note */}
          <div className="pt-2 text-center text-[11px] text-outline border-t border-outline-subtle flex items-center justify-between">
            <span>Generated via MEDI AI (ఆరోగ్య బంధు)</span>
            <span>Issued: {new Date().toLocaleDateString('en-GB')} • Authorized Digital Node</span>
          </div>
        </div>

        {/* Modal Bottom Print Button (No-print) */}
        <div className="p-4 sm:p-5 border-t border-outline-subtle bg-surface-container-low flex items-center justify-between no-print rounded-b-3xl">
          <span className="text-xs text-on-surface-variant">
            Standard A4 / Thermal Slip Compatible
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-outline-variant hover:bg-surface text-sm font-semibold text-primary"
            >
              {language === 'te' ? 'మూసివేయండి' : 'Close'}
            </button>
            <button
              onClick={handlePrint}
              className="btn-pill-primary py-2.5 px-6 text-base flex items-center gap-2"
            >
              <Printer className="w-4 h-4 text-secondary-fixed" />
              <span>{language === 'te' ? 'పాస్ ప్రింట్ చేయండి' : 'Print OPD Pass'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
