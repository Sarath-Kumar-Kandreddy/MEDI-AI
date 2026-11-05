import React from 'react';
import type { Language } from '../types';
import { Phone, Ambulance, ShieldCheck } from 'lucide-react';

interface HelplineFooterProps {
  language: Language;
}

export const HelplineFooter: React.FC<HelplineFooterProps> = ({ language }) => {
  return (
    <footer className="mt-20 border-t border-outline-subtle bg-primary text-white">
      {/* Official AP Government Health Helplines Banner */}
      <div className="bg-[#001428] py-8 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <span className="text-secondary-fixed text-xs sm:text-sm font-bold uppercase tracking-wider block">
              {language === 'te' ? 'ఆంధ్రప్రదేశ్ అధికారిక ఆరోగ్య హెల్ప్‌లైన్లు' : 'Official AP Government Health Helplines'}
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-white mt-1">
              Toll-free 24x7 government citizen care lines for Visakhapatnam residents
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {/* 104 */}
            <a
              href="tel:104"
              className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-error text-white flex items-center justify-center shrink-0">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-2xl font-black text-white font-mono block">104</span>
                  <span className="text-xs text-surface-dim font-medium">
                    {language === 'te' ? 'ఆరోగ్య సమాచార కేంద్రం (Health Information)' : 'Health Information Line'}
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-secondary-fixed group-hover:translate-x-1 transition-transform">
                →
              </span>
            </a>

            {/* 108 */}
            <a
              href="tel:108"
              className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-error text-white flex items-center justify-center shrink-0">
                  <Ambulance className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-2xl font-black text-white font-mono block">108</span>
                  <span className="text-xs text-surface-dim font-medium">
                    {language === 'te' ? 'అత్యవసర అంబులెన్స్ (Emergency)' : 'Emergency Ambulance'}
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-secondary-fixed group-hover:translate-x-1 transition-transform">
                →
              </span>
            </a>

            {/* 1800-425-1818 */}
            <a
              href="tel:18004251818"
              className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-secondary text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-lg font-black text-white font-mono block leading-tight">1800-425-1818</span>
                  <span className="text-xs text-surface-dim font-medium">
                    {language === 'te' ? 'డా. వైఎస్సార్ ఆరోగ్యశ్రీ ట్రస్ట్' : 'Dr. YSR Aarogyasri Trust'}
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-secondary-fixed group-hover:translate-x-1 transition-transform">
                →
              </span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Bottom Line */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-surface-dim">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-white">MEDI AI | మేడి ఏఐ</span>
            <span>•</span>
            <span>A Citizen Health Initiative by Team Apex • Visakhapatnam, Andhra Pradesh</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span>Dr. YSR Aarogyasri Trust Integration</span>
            <span>•</span>
            <span>King George Hospital (KGH) Node</span>
            <span>•</span>
            <span>VIMS Health City</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
