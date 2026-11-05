import React, { useState } from 'react';
import type { Language } from '../types';
import { getStoredGeminiKey, setStoredGeminiKey } from '../services/gemini';
import { isFirebaseLive } from '../services/firebase';
import { Key, Sparkles, CheckCircle2, ExternalLink, X, Database } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, language }) => {
  const [apiKey, setApiKey] = useState(getStoredGeminiKey());
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setStoredGeminiKey(apiKey);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1000);
  };

  const handleClear = () => {
    setStoredGeminiKey('');
    setApiKey('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-outline-border space-y-6 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-surface text-outline hover:text-primary transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-primary">
              {language === 'te' ? 'జెమిని AI & ఫైర్‌బేస్ సెట్టింగ్స్' : 'Google Gemini API & Firebase'}
            </h3>
            <p className="text-xs text-on-surface-variant">
              {language === 'te' ? 'ఉచిత జెమిని మోడల్స్ (gemini-1.5-flash) నిర్వహణ' : 'Configure Google Developer Gemini free models'}
            </p>
          </div>
        </div>

        {/* Gemini Key Input */}
        <div className="space-y-3">
          <label className="block text-sm font-bold text-primary">
            {language === 'te' ? 'గూగుల్ జెమిని API కీ (Google Gemini API Key)' : 'Google Gemini API Key'}
          </label>
          <div className="relative">
            <Key className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" />
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="input-tactile w-full pl-11 font-mono text-sm"
            />
          </div>
          <p className="text-xs text-on-surface-variant flex items-center justify-between">
            <span>Free tier models: gemini-1.5-flash / gemini-2.0-flash</span>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary font-bold flex items-center gap-1 hover:underline"
            >
              Get Free Key <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>

        {/* Firebase Ecosystem Status */}
        <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-subtle space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-4 h-4 text-secondary" />
              Firebase Backend Ecosystem
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              isFirebaseLive
                ? 'bg-secondary-container text-on-secondary-container'
                : 'bg-surface-container text-primary'
            }`}>
              {isFirebaseLive ? 'Firestore Live Sync' : 'Offline / Local Cache'}
            </span>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Cloud Firestore, Firebase Authentication, Storage, and TypeScript Cloud Functions v2 configured in <code className="bg-white px-1.5 py-0.5 rounded border">functions/src/index.ts</code>.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            className="btn-pill-primary flex-1 py-3 text-base flex items-center justify-center gap-2"
          >
            {isSaved ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-secondary-fixed" />
                <span>{language === 'te' ? 'భద్రపరచబడింది!' : 'Key Saved!'}</span>
              </>
            ) : (
              <span>{language === 'te' ? 'కీ భద్రపరచండి' : 'Save & Activate'}</span>
            )}
          </button>

          {apiKey && (
            <button
              onClick={handleClear}
              className="px-4 py-3 rounded-full border border-outline-border text-sm font-semibold text-outline hover:text-error hover:border-error transition-all"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
