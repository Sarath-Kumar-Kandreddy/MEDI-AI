import React, { useState } from 'react';
import type { Language, CitizenProfile } from '../types';
import { SAMPLE_CITIZENS } from '../data/mockData';
import { 
  Shield, Award, AlertTriangle, CheckCircle, 
  Trash2, Hospital, ArrowRight 
} from 'lucide-react';

interface AboutSectionProps {
  language: Language;
  onNavigateToSchemes: () => void;
  onNavigateToTokens: () => void;
  onNavigateToPrescription?: () => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({
  language,
  onNavigateToSchemes,
  onNavigateToTokens,
}) => {
  const [citizenRecords, setCitizenRecords] = useState<CitizenProfile[]>(SAMPLE_CITIZENS);
  const [dataCleared, setDataCleared] = useState(false);

  const handleClearData = () => {
    if (confirm(language === 'te' ? 'మీ పరికరంలో ఉన్న తాత్కాలిక డెమో డేటాను తొలగించాలా?' : 'Are you sure you want to clear simulated local citizen records?')) {
      setCitizenRecords([]);
      setDataCleared(true);
      localStorage.removeItem('arogya_bandhu_booked_tokens');
      localStorage.removeItem('arogya_bandhu_recent_prescriptions');
    }
  };

  const handleResetData = () => {
    setCitizenRecords(SAMPLE_CITIZENS);
    setDataCleared(false);
  };

  return (
    <div className="space-y-12">
      {/* Hero Banner from Screenshot 1 */}
      <div className="bg-primary text-white rounded-3xl p-6 sm:p-10 relative overflow-hidden shadow-tactile">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-secondary/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary-container text-on-secondary-container text-xs sm:text-sm font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
            <span>Team Apex • DevsEdge Spit 2.0</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold border border-white/10">
              King George Hospital (KGH) Node: Active
            </span>
            <span className="px-3 py-1 rounded-full bg-white/10 text-secondary-fixed text-xs font-semibold border border-white/10">
              GVMC Civic Health Link
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Built with Heart in Visakhapatnam, Andhra Pradesh.
            </h1>
            <p className="text-secondary-fixed text-lg sm:text-xl font-bold">
              ఆంధ్ర మరియు వైజాగ్ ప్రజల ప్రతి ఇంటి గుండెకు చేర్చే సంకల్పం
            </p>
            <p className="text-surface-dim text-base sm:text-lg leading-relaxed max-w-2xl">
              Millions of elderly and middle-aged citizens in Andhra Pradesh miss out on life-saving government schemes like Aarogyasri simply because eligibility rules are complex, hospital queues are punishing, and pharmacy access is difficult. <strong>MEDI AI (ఆరోగ్య బంధు)</strong> bridges this gap with an intuitive AI-powered scanner, a zero-wait OPD token queue, and instant online medicine sourcing directly to your doorstep in Visakhapatnam.
            </p>

            <div className="flex flex-wrap gap-3 pt-3">
              <button
                onClick={onNavigateToSchemes}
                className="btn-pill-secondary py-3 px-6 text-base font-bold flex items-center gap-2"
              >
                <span>{language === 'te' ? 'ఆధార్ స్కాన్ చేసి అర్హత చూడండి' : 'Check Aadhaar Eligibility'}</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={onNavigateToTokens}
                className="btn-pill-outline py-3 px-6 text-base font-bold text-white border-white hover:bg-white/10 flex items-center gap-2"
              >
                <span>{language === 'te' ? 'కేజీహెచ్ టోకెన్ బుకింగ్' : 'Book KGH OPD Token'}</span>
              </button>
            </div>
          </div>

          {/* Right Card: Team Apex Mission */}
          <div className="lg:col-span-4">
            <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center">
                  <Award className="w-6 h-6 text-secondary" />
                </div>
                <h4 className="text-lg font-bold text-white">Team Apex Mission</h4>
              </div>
              <p className="text-xs sm:text-sm text-surface-dim leading-relaxed">
                A non-profit grassroots health-tech initiative originating from Andhra University College of Engineering & local healthcare advocates in Vizag.
              </p>
              <div className="pt-3 border-t border-white/15 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-white shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-white">
                  Zero Fees, Direct Access to Super Specialities
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Metric Summary Cards from Screenshot 1 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-8 border-t border-white/15">
          <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
            <span className="text-white font-black text-2xl sm:text-3xl block">₹38.5+ Lakhs</span>
            <span className="text-secondary-fixed text-sm font-bold block mt-1">Welfare Savings Unlocked</span>
            <p className="text-xs text-surface-dim mt-0.5">వైజాగ్ కుటుంబాలకు లబ్ధి చేకూర్చబడింది</p>
          </div>

          <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
            <span className="text-secondary-container font-black text-2xl sm:text-3xl block">4,820+ Hours</span>
            <span className="text-secondary-fixed text-sm font-bold block mt-1">OPD Standing Time Saved</span>
            <p className="text-xs text-surface-dim mt-0.5">కేజీహెచ్ ఆసుపత్రి లైన్ సమయం ఆదా</p>
          </div>

          <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
            <span className="text-tertiary-fixed font-black text-2xl sm:text-3xl block">99.4%</span>
            <span className="text-secondary-fixed text-sm font-bold block mt-1">Medicine Match Index</span>
            <p className="text-xs text-surface-dim mt-0.5">సరైన మందులు, జనరిక్ ఆదా</p>
          </div>
        </div>
      </div>

      {/* Ground Reality vs MEDI AI Solution (from Screenshot 1) */}
      <div className="card-tactile p-6 sm:p-8 bg-white border border-outline-border rounded-3xl">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="text-xs font-bold text-secondary uppercase tracking-wider block">
            వాస్తవ పరిస్థితి vs మేడి ఏఐ
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-primary mt-1">
            The Ground Reality vs. MEDI AI Solution
          </h2>
          <p className="text-base text-on-surface-variant mt-2">
            Navigating public healthcare in coastal AP shouldn't require exhausting physical queues, endless photocopies, or technical hurdles.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bottlenecks Column (Pinkish border container) */}
          <div className="p-6 rounded-3xl bg-error-container/20 border-2 border-error/30 space-y-5">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-full bg-error-container text-on-error-container">
                <AlertTriangle className="w-6 h-6 text-error" />
              </span>
              <div>
                <h3 className="font-extrabold text-xl text-error">The Bottlenecks (సమస్యలు)</h3>
                <p className="text-xs text-on-surface-variant">What elderly patients face in Vizag government clinics</p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-2xl bg-white border border-error/20">
                <h4 className="font-bold text-primary text-base">Aarogyasri Scheme Ambiguity</h4>
                <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
                  Families pay out-of-pocket for treatments that are 100% free under Dr. YSR Aarogyasri simply due to confusing eligibility criteria and lack of Telugu guidance.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-error/20">
                <h4 className="font-bold text-primary text-base">Exhausting OPD Line Stand-ings</h4>
                <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
                  Middle-aged and senior patients stand 3 to 5 hours starting at 6:30 AM at KGH and regional clinics just to secure an OPD consultation slip.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-error/20">
                <h4 className="font-bold text-primary text-base">Disjointed Pharmacy Sourcing</h4>
                <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
                  Prescriptions handwritten by specialists require visits to multiple medical stores in Jagadamba or Dwaraka Nagar to find all prescribed brands.
                </p>
              </div>
            </div>
          </div>

          {/* Solution Column (Minty / Cyan container) */}
          <div className="p-6 rounded-3xl bg-secondary-container/30 border-2 border-secondary/40 space-y-5">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-full bg-secondary text-white">
                <CheckCircle className="w-6 h-6" />
              </span>
              <div>
                <h3 className="font-extrabold text-xl text-secondary">The MEDI AI Bridge (పరిష్కారం)</h3>
                <p className="text-xs text-on-surface-variant">Autonomous, dignified civic digital infrastructure</p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-2xl bg-white border border-secondary/20">
                <h4 className="font-bold text-primary text-base">Instant Eligibility AI Voice</h4>
                <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
                  Upload any name card, one voice, or document scan. The engine verifies state-in-scope Telugu eligibility metrics in under 12 seconds.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-secondary/20">
                <h4 className="font-bold text-primary text-base">Zero-Wait Digital Tokens</h4>
                <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
                  Generate verified queue tokens from home. Track real-time live token alerts via SMS and arrive in patience for the designated consultation.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-secondary/20">
                <h4 className="font-bold text-primary text-base">Centralised E-Store Dispatch</h4>
                <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
                  Optical character parsing deciphers doctor handwriting, compares pricing across Apollo, Netmeds, Tata 1mg, Jan Aushadhi, and dispatches directly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Why It Matters to Coastal Andhra (from Screenshot 1) */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">నిజమైన ప్రభావం</span>
            <h3 className="text-2xl font-extrabold text-primary">Why It Matters to Coastal Andhra</h3>
          </div>
          <span className="text-xs text-on-surface-variant font-medium">
            Verified public deployment in Ward 16 & Ward 28, GVMC
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-tactile p-6 bg-white border border-outline-border rounded-3xl">
            <span className="text-4xl font-black text-primary block">72%</span>
            <h4 className="font-bold text-lg text-primary mt-2">Seniors Act Without Help</h4>
            <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
              Thanks to audio prompts in Telugu and oversized tactile elements, elderly succeed to determine scheme eligibility without depending on family members.
            </p>
            <div className="mt-4 pt-3 border-t border-outline-subtle text-xs font-bold text-secondary flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Telugu Voice Guidance Enabled
            </div>
          </div>

          <div className="card-tactile p-6 bg-white border border-outline-border rounded-3xl">
            <span className="text-4xl font-black text-primary block">100%</span>
            <h4 className="font-bold text-lg text-primary mt-2">Zero Cloud Lock-In</h4>
            <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
              Your Aadhaar identifiers, prescription images, and health records stay right on your browser sandbox, not forever mined by ad-tech or commercial data brokers.
            </p>
            <div className="mt-4 pt-3 border-t border-outline-subtle text-xs font-bold text-secondary flex items-center gap-1">
              <Shield className="w-4 h-4" />
              On-Device Privacy First
            </div>
          </div>

          <div className="card-tactile p-6 bg-white border border-outline-border rounded-3xl">
            <span className="text-4xl font-black text-primary block">14</span>
            <h4 className="font-bold text-lg text-primary mt-2">Govt Hospitals Linked</h4>
            <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
              Direct telemetry protocols with KGH, Victoria Hospital for Women and Children, ENT Hospital Pedda Waltair, and primary Urban Health Centers.
            </p>
            <div className="mt-4 pt-3 border-t border-outline-subtle text-xs font-bold text-secondary flex items-center gap-1">
              <Hospital className="w-4 h-4" />
              Visakhapatnam District Network
            </div>
          </div>
        </div>
      </div>

      {/* Patient Data Management Table (from Screenshot 1) */}
      <div className="card-tactile p-6 sm:p-8 bg-white border border-outline-border rounded-3xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-outline-subtle gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-secondary" />
              <span className="text-xs font-bold text-secondary uppercase tracking-wider">
                Local Browser Storage & Citizen Transparency
              </span>
            </div>
            <h3 className="text-2xl font-bold text-primary mt-1">Patient Data Management</h3>
            <p className="text-sm text-on-surface-variant mt-0.5">
              Inspect currently cached appointments, active summaries, and sample hospital cards. You can permanently wipe your device cache at any time.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {dataCleared ? (
              <button
                onClick={handleResetData}
                className="px-4 py-2.5 rounded-full bg-secondary text-white font-bold text-sm"
              >
                Restore Records (పునరుద్ధరించండి)
              </button>
            ) : (
              <button
                onClick={handleClearData}
                className="px-4 py-2.5 rounded-full bg-error text-white font-bold text-sm flex items-center gap-1.5 shadow-sm hover:bg-error/90"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear My Data (డేటా తొలగించండి)</span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-on-surface-variant mb-2">
          <span className="font-bold text-primary">
            Pre-loaded Visakhapatnam Citizen Records ({citizenRecords.length} Sample Profiles)
          </span>
          <span>All entries below are simulated demonstration records</span>
        </div>

        {/* Records Table */}
        <div className="overflow-x-auto border border-outline-subtle rounded-2xl">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-surface-container text-on-surface font-bold border-b border-outline-subtle">
                <th className="py-3 px-4">Citizen Name & Age</th>
                <th className="py-3 px-4">Aadhaar / Card ID</th>
                <th className="py-3 px-4">Locality (Visakhapatnam)</th>
                <th className="py-3 px-4">Hospital & Department</th>
                <th className="py-3 px-4">Queue Token</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-subtle">
              {citizenRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-on-surface-variant">
                    No records stored. Click "Restore Records" to repopulate demonstration profiles.
                  </td>
                </tr>
              ) : (
                citizenRecords.map(cit => (
                  <tr key={cit.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-primary block">{cit.fullName} ({cit.age}y)</span>
                      <span className="text-xs text-secondary">{cit.nameTe}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs text-on-surface-variant block">{cit.aadhaarCardId}</span>
                      <span className="text-[11px] bg-surface-container px-2 py-0.5 rounded font-semibold text-primary">
                        BPL / White
                      </span>
                    </td>
                    <td className="py-3 px-4 text-on-surface text-sm">
                      {cit.locality}
                    </td>
                    <td className="py-3 px-4 text-on-surface text-sm font-medium">
                      {cit.recommendedHospital}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-secondary text-base">
                      {cit.slotQueueToken}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        cit.consultationStatus === 'Done'
                          ? 'bg-secondary-container text-on-secondary-container'
                          : cit.consultationStatus === 'Consulted'
                          ? 'bg-surface-container text-primary'
                          : cit.consultationStatus?.includes('Queue')
                          ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                          : 'bg-primary text-white'
                      }`}>
                        {cit.consultationStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
