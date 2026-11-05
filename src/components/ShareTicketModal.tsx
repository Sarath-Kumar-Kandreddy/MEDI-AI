import React, { useState } from 'react';
import type { Language, OPDToken } from '../types';
import { Share2, X, Check, Copy, MessageSquare, Send } from 'lucide-react';

interface ShareTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: OPDToken | null;
  language: Language;
}

export const ShareTicketModal: React.FC<ShareTicketModalProps> = ({
  isOpen,
  onClose,
  token,
  language,
}) => {
  const [copied, setCopied] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  if (!isOpen || !token) return null;

  const shareText = `🏥 *AROGYA BANDHU - VISAKHAPATNAM OPD PASS*
🎫 *Token Number:* ${token.tokenNumber}
👤 *Patient:* ${token.patientName} (${token.age} Yrs)
🏥 *Hospital:* ${token.hospital}
🚪 *Department / Room:* ${token.department}
⏰ *Time Slot:* ${token.timeSlot}
⏳ *Live Queue Status:* ${token.status} (Now Serving: ${token.nowServing}, ~${token.estimatedWaitMins} mins wait)
📍 *Reporting Desk:* KGH OPD Counter No. 3
✅ *Aarogyasri Health ID:* ${token.aarogyasriNumber} (100% Cashless Free Booking)
Govt Health Helpline: 104 / 108`;

  // WhatsApp share
  const handleWhatsAppShare = () => {
    const encoded = encodeURIComponent(shareText);
    const url = phoneNumber.trim() 
      ? `https://api.whatsapp.com/send?phone=91${phoneNumber.replace(/\D/g, '')}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  };

  // SMS share
  const handleSMSShare = () => {
    const encoded = encodeURIComponent(shareText);
    const smsUrl = phoneNumber.trim() 
      ? `sms:${phoneNumber.trim()}?body=${encoded}`
      : `sms:?body=${encoded}`;
    window.open(smsUrl, '_blank');
  };

  // Copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Native share
  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `OPD Pass: ${token.tokenNumber} - ${token.patientName}`,
        text: shareText
      }).catch(() => {});
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border-2 border-outline-subtle relative flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 border-b border-outline-subtle flex items-center justify-between bg-surface-container-low rounded-t-3xl">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-secondary" />
            <h3 className="font-extrabold text-lg sm:text-xl text-primary">
              {language === 'te' ? 'OPD టికెట్ షేర్ చేయండి' : 'Share OPD Ticket'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Ticket Snapshot Card */}
          <div className="p-4 rounded-2xl bg-surface-container-low border border-secondary/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-secondary uppercase tracking-wider">
                Digital Pass Summary
              </span>
              <span className="font-mono text-sm font-black text-secondary px-2.5 py-0.5 rounded-full bg-secondary-container">
                {token.tokenNumber}
              </span>
            </div>
            <h4 className="text-xl font-bold text-primary">{token.patientName} ({token.age} Yrs)</h4>
            <p className="text-xs text-on-surface-variant font-medium">
              {token.hospital.split('•')[0]} • {token.department}
            </p>
            <p className="text-xs text-secondary font-semibold">
              Slot: {token.timeSlot}
            </p>
          </div>

          {/* Optional phone number input for direct WhatsApp/SMS dispatch */}
          <div>
            <label className="block text-sm font-bold text-primary mb-1">
              {language === 'te' ? 'మొబైల్ నంబర్ (ఐచ్ఛికం - నేరుగా పంపడానికి)' : 'Mobile Phone Number (Optional)'}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-on-surface-variant">
                +91
              </span>
              <input
                type="tel"
                maxLength={10}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="9876543210 (Patient / Attendant Phone)"
                className="input-tactile w-full pl-14 text-base"
              />
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              {language === 'te' 
                ? 'రోగి లేదా కుటుంబ సభ్యుల ఫోన్‌కు వాట్సాప్ లేదా SMS ద్వారా పంపండి.' 
                : 'Send directly to patient or relative so they have the token pass on arrival.'}
            </p>
          </div>

          {/* Sharing Channels Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* WhatsApp */}
            <button
              onClick={handleWhatsAppShare}
              className="p-4 rounded-2xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border-2 border-[#25D366] text-[#075E54] font-bold text-base flex items-center justify-center gap-2.5 transition-all shadow-sm group"
            >
              <Send className="w-5 h-5 text-[#25D366] group-hover:scale-110 transition-transform" />
              <span>{language === 'te' ? 'WhatsApp లో పంపండి' : 'Send via WhatsApp'}</span>
            </button>

            {/* SMS */}
            <button
              onClick={handleSMSShare}
              className="p-4 rounded-2xl bg-surface hover:bg-surface-container border-2 border-primary/30 text-primary font-bold text-base flex items-center justify-center gap-2.5 transition-all shadow-sm group"
            >
              <MessageSquare className="w-5 h-5 text-secondary group-hover:scale-110 transition-transform" />
              <span>{language === 'te' ? 'SMS పంపండి' : 'Send via SMS'}</span>
            </button>

            {/* Copy to Clipboard */}
            <button
              onClick={handleCopy}
              className="p-4 rounded-2xl bg-surface hover:bg-surface-container border-2 border-outline-variant text-primary font-bold text-base flex items-center justify-center gap-2.5 transition-all shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 text-secondary" />
                  <span className="text-secondary">{language === 'te' ? 'కాపీ చేయబడింది!' : 'Copied!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 text-on-surface-variant" />
                  <span>{language === 'te' ? 'వివరాలు కాపీ చేయండి' : 'Copy Token Info'}</span>
                </>
              )}
            </button>

            {/* Native Mobile Share */}
            <button
              onClick={handleNativeShare}
              className="p-4 rounded-2xl bg-primary text-white hover:bg-primary/95 font-bold text-base flex items-center justify-center gap-2.5 transition-all shadow-sm"
            >
              <Share2 className="w-5 h-5 text-secondary-fixed" />
              <span>{language === 'te' ? 'షేర్ మెనూ' : 'Share Menu'}</span>
            </button>
          </div>

          {copied && (
            <div className="p-3 rounded-xl bg-secondary-container text-on-secondary-container text-xs font-bold text-center border border-secondary animate-fade-in">
              ✓ {language === 'te' ? 'టోకెన్ వివరాలు క్లిప్‌బోర్డ్‌కి కాపీ అయ్యాయి! ఎక్కడైనా పేస్ట్ చేసుకోవచ్చు.' : 'OPD Token details copied to clipboard! Ready to paste into any chat.'}
            </div>
          )}

          {/* Preview Box */}
          <div>
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
              Message Preview
            </span>
            <div className="p-3 rounded-xl bg-surface-container-low text-xs font-mono text-on-surface leading-relaxed border border-outline-subtle whitespace-pre-line max-h-36 overflow-y-auto">
              {shareText}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-outline-subtle bg-surface-container-low flex justify-end rounded-b-3xl">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full bg-primary text-white font-bold text-sm hover:bg-primary/90"
          >
            {language === 'te' ? 'పూర్తయ్యింది' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
