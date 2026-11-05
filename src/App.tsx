import { useState } from 'react';
import type { Language, CitizenProfile } from './types';
import { Navbar } from './components/Navbar';
import { SchemeFinderScanner } from './components/SchemeFinderScanner';
import { OPDTokenBooking } from './components/OPDTokenBooking';
import { PrescriptionScanner } from './components/PrescriptionScanner';
import { AboutSection } from './components/AboutSection';
import { HelplineFooter } from './components/HelplineFooter';
import { ApiKeyModal } from './components/ApiKeyModal';
import { TeluguVoiceModal } from './components/TeluguVoiceModal';
import { getStoredGeminiKey } from './services/gemini';
import { Mic } from 'lucide-react';

export function App() {
  const [language, setLanguage] = useState<Language>('en');
  const [activeTab, setActiveTab] = useState<'schemes' | 'tokens' | 'prescription' | 'about'>('schemes');
  const [prefillProfile, setPrefillProfile] = useState<CitizenProfile | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  const hasCustomKey = Boolean(getStoredGeminiKey());

  const handleLanguageToggle = () => {
    setLanguage(prev => (prev === 'en' ? 'te' : 'en'));
  };

  // When Scheme Finder scanner moves the user to the next step: OPD consultation booking
  const handleProceedToBooking = (profile: CitizenProfile) => {
    setPrefillProfile(profile);
    setActiveTab('tokens');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Voice assistant handler
  const handleVoiceAction = (actionType: 'bookToken' | 'orderMedicine' | 'checkSchemes') => {
    if (actionType === 'bookToken') setActiveTab('tokens');
    else if (actionType === 'orderMedicine') setActiveTab('prescription');
    else if (actionType === 'checkSchemes') setActiveTab('schemes');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`min-h-screen flex flex-col bg-surface text-on-surface ${language === 'te' ? 'telugu-text' : ''}`} lang={language}>
      {/* Top Main Navigation Bar */}
      <Navbar
        language={language}
        onLanguageToggle={handleLanguageToggle}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        hasCustomKey={hasCustomKey}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        {activeTab === 'schemes' && (
          <SchemeFinderScanner
            language={language}
            onProceedToBooking={handleProceedToBooking}
          />
        )}

        {activeTab === 'tokens' && (
          <OPDTokenBooking
            language={language}
            prefillProfile={prefillProfile}
            onOpenVoiceAssist={() => setIsVoiceModalOpen(true)}
          />
        )}

        {activeTab === 'prescription' && (
          <PrescriptionScanner
            language={language}
            onOpenVoiceAssist={() => setIsVoiceModalOpen(true)}
          />
        )}

        {activeTab === 'about' && (
          <AboutSection
            language={language}
            onNavigateToSchemes={() => {
              setActiveTab('schemes');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateToTokens={() => {
              setActiveTab('tokens');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateToPrescription={() => {
              setActiveTab('prescription');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </main>

      {/* Persistent Floating Voice & Bilingual Action Bar (from Design Specs) */}
      <aside aria-label="Quick Voice Assistant" className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsVoiceModalOpen(true)}
          className="btn-pill-primary py-3.5 px-6 shadow-floating flex items-center gap-3 border-2 border-secondary-fixed/50 transform hover:scale-105 active:scale-95 transition-all"
          title="Telugu / English Voice Assistant"
        >
          <div className="relative">
            <Mic className="w-6 h-6 text-secondary-fixed animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-secondary animate-ping" />
          </div>
          <div className="text-left hidden sm:block">
            <span className="text-xs text-secondary-fixed font-bold block leading-tight">
              {language === 'te' ? 'తెలుగు వాయిస్ సాయం' : 'Speak in Telugu / English'}
            </span>
            <span className="text-sm font-extrabold text-white">Voice Assistant</span>
          </div>
        </button>
      </aside>

      {/* Official AP Government Health Helplines Footer */}
      <HelplineFooter language={language} />

      {/* Modals */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        language={language}
      />

      <TeluguVoiceModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        language={language}
        onVoiceAction={handleVoiceAction}
      />
    </div>
  );
}

export default App;
