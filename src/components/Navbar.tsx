import React from 'react';
import type { Language } from '../types';
import { Phone, Globe, Sparkles, Key, Stethoscope } from 'lucide-react';

interface NavbarProps {
  language: Language;
  onLanguageToggle: () => void;
  activeTab: 'schemes' | 'tokens' | 'prescription' | 'about';
  onTabChange: (tab: 'schemes' | 'tokens' | 'prescription' | 'about') => void;
  onOpenApiKeyModal: () => void;
  hasCustomKey: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  language,
  onLanguageToggle,
  activeTab,
  onTabChange,
  onOpenApiKeyModal,
  hasCustomKey,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-outline-subtle shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div 
            onClick={() => onTabChange('about')}
            className="flex items-center gap-3 cursor-pointer group shrink-0"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-tactile group-hover:bg-primary-container transition-all">
              <Stethoscope className="w-6 h-6 text-secondary-fixed" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl md:text-2xl text-primary tracking-tight">MEDI AI</span>
                <span className="text-sm font-semibold text-secondary px-1.5 py-0.5 rounded bg-secondary-container/60">
                  {language === 'te' ? 'మేడి ఏఐ' : 'AP Pilot'}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant font-medium hidden sm:block">
                {language === 'te' ? 'వైజాగ్ ఆరోగ్య & సంక్షేమ పథకాలు' : 'Healthcare & Welfare • Visakhapatnam'}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            <button
              onClick={() => onTabChange('schemes')}
              className={`px-4 py-2.5 rounded-full text-base font-semibold transition-all flex flex-col items-center ${
                activeTab === 'schemes'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface hover:bg-surface-container text-on-surface-variant'
              }`}
            >
              <span>{language === 'te' ? 'ఆరోగ్యశ్రీ & పథకాలు' : 'Scheme Finder'}</span>
              <span className="text-xs opacity-80">{language === 'te' ? 'ఆధార్ స్కాన్' : 'Aadhaar Scanner'}</span>
            </button>

            <button
              onClick={() => onTabChange('tokens')}
              className={`px-4 py-2.5 rounded-full text-base font-semibold transition-all flex flex-col items-center ${
                activeTab === 'tokens'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface hover:bg-surface-container text-on-surface-variant'
              }`}
            >
              <span>{language === 'te' ? 'ఆసుపత్రి టోకెన్' : 'Token Queue'}</span>
              <span className="text-xs opacity-80">{language === 'te' ? 'కేజీహెచ్ లైవ్' : 'OPD Pass'}</span>
            </button>

            <button
              onClick={() => onTabChange('prescription')}
              className={`px-4 py-2.5 rounded-full text-base font-semibold transition-all flex flex-col items-center ${
                activeTab === 'prescription'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface hover:bg-surface-container text-on-surface-variant'
              }`}
            >
              <span>{language === 'te' ? 'ప్రిస్క్రిప్షన్ & మందులు' : 'Prescription & Medicines'}</span>
              <span className="text-xs opacity-80">{language === 'te' ? 'AI OCR & డెలివరీ' : 'OCR & Map'}</span>
            </button>

            <button
              onClick={() => onTabChange('about')}
              className={`px-4 py-2.5 rounded-full text-base font-semibold transition-all flex flex-col items-center ${
                activeTab === 'about'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface hover:bg-surface-container text-on-surface-variant'
              }`}
            >
              <span>{language === 'te' ? 'మా గురించి' : 'About Apex'}</span>
              <span className="text-xs opacity-80">{language === 'te' ? 'లక్ష్యం & డేటా' : 'Mission & Data'}</span>
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Bilingual Switcher */}
            <button
              onClick={onLanguageToggle}
              className="px-3 sm:px-4 py-2 rounded-full border border-outline-variant bg-surface-container-low hover:bg-surface-container text-primary font-bold text-sm sm:text-base flex items-center gap-1.5 transition-all shadow-sm"
              title="Toggle Telugu / English"
            >
              <Globe className="w-4 h-4 text-secondary" />
              <span>{language === 'te' ? 'English' : 'తెలుగు'}</span>
            </button>

            {/* Gemini API Key Indicator & Configuration */}
            <button
              onClick={onOpenApiKeyModal}
              className={`px-2.5 sm:px-3 py-2 rounded-full border text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all ${
                hasCustomKey
                  ? 'border-secondary bg-secondary-container/40 text-on-secondary-container'
                  : 'border-tertiary-saffron/40 bg-tertiary-fixed/40 text-tertiary-saffron'
              }`}
              title="Google Gemini API & Firebase Settings"
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {hasCustomKey ? 'Gemini 1.5 Active' : 'Gemini Key'}
              </span>
              <Sparkles className="w-3.5 h-3.5" />
            </button>

            {/* 104 / 108 Emergency Helpline Pill Button */}
            <a
              href="tel:104"
              className="bg-error hover:bg-error/90 text-white font-bold px-3 sm:px-4 py-2 rounded-full flex items-center gap-1.5 sm:gap-2 shadow-tactile text-sm sm:text-base transition-all transform hover:scale-[1.02]"
              title="AP Government Health Helpline"
            >
              <Phone className="w-4 h-4 animate-pulse" />
              <span>104 / 108</span>
              <span className="hidden xl:inline text-xs font-normal opacity-90">
                {language === 'te' ? 'ఆరోగ్య హెల్ప్‌లైన్' : 'Aarogyasri Helpline'}
              </span>
            </a>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="lg:hidden flex items-center justify-around py-2.5 border-t border-outline-subtle overflow-x-auto gap-1">
          <button
            onClick={() => onTabChange('schemes')}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold shrink-0 ${
              activeTab === 'schemes' ? 'bg-primary text-white' : 'text-on-surface-variant'
            }`}
          >
            {language === 'te' ? 'పథకాలు' : 'Schemes'}
          </button>
          <button
            onClick={() => onTabChange('tokens')}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold shrink-0 ${
              activeTab === 'tokens' ? 'bg-primary text-white' : 'text-on-surface-variant'
            }`}
          >
            {language === 'te' ? 'టోకెన్ క్యూ' : 'OPD Token'}
          </button>
          <button
            onClick={() => onTabChange('prescription')}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold shrink-0 ${
              activeTab === 'prescription' ? 'bg-primary text-white' : 'text-on-surface-variant'
            }`}
          >
            {language === 'te' ? 'మందులు & OCR' : 'Medicines & OCR'}
          </button>
          <button
            onClick={() => onTabChange('about')}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold shrink-0 ${
              activeTab === 'about' ? 'bg-primary text-white' : 'text-on-surface-variant'
            }`}
          >
            {language === 'te' ? 'మా గురించి' : 'About'}
          </button>
        </div>
      </div>
    </header>
  );
};
