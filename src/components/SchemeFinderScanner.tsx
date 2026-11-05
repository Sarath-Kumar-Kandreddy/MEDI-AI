import React, { useState, useRef } from 'react';
import type { Language, CitizenProfile, Scheme } from '../types';
import { PRESET_AADHAAR_SAMPLES, SAMPLE_CITIZENS, VIZAG_HOSPITALS } from '../data/mockData';
import { analyzeAadhaarWithGemini, calculateEligibleSchemes } from '../services/gemini';
import { saveCitizenRecord } from '../services/firebase';
import { 
  Scan, Camera, CheckCircle2, ArrowRight, 
  Hospital, ShieldCheck, HeartPulse, Calendar, MapPin, Search, ChevronRight, Sparkles 
} from 'lucide-react';

interface SchemeFinderScannerProps {
  language: Language;
  onProceedToBooking: (profile: CitizenProfile) => void;
  onSelectCitizenFromDirectory?: (citizen: CitizenProfile) => void;
}

export const SchemeFinderScanner: React.FC<SchemeFinderScannerProps> = ({
  language,
  onProceedToBooking,
}) => {
  const [activeMode, setActiveMode] = useState<'ocr' | 'manual'>('ocr');
  const [isScanning, setIsScanning] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('sample-appala');
  const [currentProfile, setCurrentProfile] = useState<CitizenProfile>({
    id: 'cit-initial',
    fullName: PRESET_AADHAAR_SAMPLES[0].fullName,
    nameTe: PRESET_AADHAAR_SAMPLES[0].nameTe,
    age: PRESET_AADHAAR_SAMPLES[0].age,
    yearOfBirth: PRESET_AADHAAR_SAMPLES[0].yearOfBirth,
    gender: PRESET_AADHAAR_SAMPLES[0].gender,
    maskedAadhaar: PRESET_AADHAAR_SAMPLES[0].maskedAadhaar,
    aadhaarCardId: 'aadh-VZ-582104',
    locality: PRESET_AADHAAR_SAMPLES[0].locality,
    rationCategory: PRESET_AADHAAR_SAMPLES[0].rationCategory,
    chronicIllnessFlags: PRESET_AADHAAR_SAMPLES[0].chronicIllnessFlags,
    recommendedHospital: 'King George Hospital (KGH) - Maharani Peta',
    recommendedDepartment: 'Geriatric Care • Room 14'
  });

  const [schemes, setSchemes] = useState<Scheme[]>(calculateEligibleSchemes(PRESET_AADHAAR_SAMPLES[0]));
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);

  // Manual form state
  const [manualName, setManualName] = useState('Appala Naidu');
  const [manualYob, setManualYob] = useState('1954');
  const [manualLocality, setManualLocality] = useState('Maharani Peta, Vizag');
  const [manualRation, setManualRation] = useState<'BPL White Card' | 'Pink Card'>('BPL White Card');

  // Directory filter state
  const [directoryFilter, setDirectoryFilter] = useState<'all' | 'elderly' | 'chronic'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle preset Aadhaar card selection
  const handleSelectPreset = (preset: typeof PRESET_AADHAAR_SAMPLES[0]) => {
    setSelectedPresetId(preset.id);
    const profile: CitizenProfile = {
      id: `cit-${Date.now()}`,
      fullName: preset.fullName,
      nameTe: preset.nameTe,
      age: preset.age,
      yearOfBirth: preset.yearOfBirth,
      gender: preset.gender,
      maskedAadhaar: preset.maskedAadhaar,
      aadhaarCardId: `aadh-VZ-${Math.floor(100000 + Math.random() * 900000)}`,
      locality: preset.locality,
      rationCategory: preset.rationCategory,
      chronicIllnessFlags: preset.chronicIllnessFlags,
      recommendedHospital: 'King George Hospital (KGH) - Maharani Peta',
      recommendedDepartment: preset.age >= 60 ? 'Geriatric Care • Room 14' : 'General Medicine'
    };
    setCurrentProfile(profile);
    setSchemes(calculateEligibleSchemes(profile));
    setUploadedImagePreview(null);
  };

  // Handle file upload and trigger Gemini Vision OCR
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setUploadedImagePreview(base64);
      triggerAadhaarScan(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  // Trigger Gemini API analysis
  const triggerAadhaarScan = async (base64Img?: string, mimeType?: string) => {
    setIsScanning(true);

    try {
      const imgToUse = base64Img || uploadedImagePreview || '';
      const result = await analyzeAadhaarWithGemini(imgToUse, mimeType || 'image/jpeg');
      setCurrentProfile(result.profile);
      setSchemes(result.schemes);
      await saveCitizenRecord(result.profile);
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  // Handle manual submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const age = new Date().getFullYear() - Number(manualYob);
    const profile: CitizenProfile = {
      id: `cit-${Date.now()}`,
      fullName: manualName,
      nameTe: manualName,
      age: age,
      yearOfBirth: Number(manualYob),
      gender: 'Male',
      maskedAadhaar: 'XXXX-XXXX-9912',
      aadhaarCardId: `aadh-VZ-${Math.floor(100000 + Math.random() * 900000)}`,
      locality: manualLocality,
      rationCategory: manualRation,
      chronicIllnessFlags: age >= 60 ? ['Geriatric Care', 'Hypertension'] : ['General Health'],
      recommendedHospital: 'King George Hospital (KGH) - Maharani Peta',
      recommendedDepartment: age >= 60 ? 'Geriatric Care • Room 14' : 'General Medicine'
    };
    setCurrentProfile(profile);
    setSchemes(calculateEligibleSchemes(profile));
  };

  // Filter citizen directory
  const filteredCitizens = SAMPLE_CITIZENS.filter(c => {
    const matchesSearch = 
      c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.locality.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.aadhaarCardId || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    if (directoryFilter === 'elderly') return matchesSearch && c.age >= 60;
    if (directoryFilter === 'chronic') return matchesSearch && c.chronicIllnessFlags.length > 1;
    return matchesSearch;
  });

  return (
    <div className="space-y-10">
      {/* Top Banner and Stats from Screenshot 4 */}
      <div className="bg-primary text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-tactile">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-secondary/15 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-white text-xs sm:text-sm font-bold tracking-wide">
            <ShieldCheck className="w-4 h-4" />
            <span>AP GOVT SCHEME LINKED • Visakhapatnam District Health Node</span>
          </div>
          <span className="text-secondary-fixed text-xs sm:text-sm font-semibold">
            {language === 'te' ? 'తెలుగు వాయిస్ సాయం అందుబాటులో ఉంది' : 'Telugu Voice Guidance Active'}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2">
          {language === 'te' ? 'ఆధార్ కార్డు ద్వారా పథకాల అర్హత తనిఖీ' : 'AI Aadhaar & Age Eligibility Scanner'}
        </h1>
        <p className="text-surface-dim text-base sm:text-lg max-w-3xl leading-relaxed">
          {language === 'te'
            ? 'మీ ఆధార్ లేదా రేషన్ కార్డును స్కాన్ చేయండి. డా. వైఎస్సార్ ఆరోగ్యశ్రీ ₹25 లక్షల ఉచిత చికిత్స, సీనియర్ సిటిజన్ పింఛను మరియు కేజీహెచ్ ఆసుపత్రి దర్శన స్లాట్‌ను నేరుగా బుక్ చేసుకోండి.'
            : 'Upload your Aadhaar photo or enter your details. Instant AI checks your eligibility for Dr. YSR Aarogyasri ₹25 Lakhs cashless cover, geriatric pension grants, and enables instant hospital OPD booking.'}
        </p>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-secondary-fixed font-black text-2xl sm:text-3xl block">1.42+ Cr</span>
            <span className="text-white font-bold text-sm sm:text-base block mt-1">AP Families in Dr. YSR Aarogyasri</span>
            <p className="text-xs text-surface-dim mt-1">
              100% cashless treatment across 3,257 procedures with zero out-of-pocket costs.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-tertiary-fixed font-black text-2xl sm:text-3xl block">68%</span>
            <span className="text-white font-bold text-sm sm:text-base block mt-1">Seniors Delayed by Paperwork</span>
            <p className="text-xs text-surface-dim mt-1">
              Elder patients face desk evaluation rejections simply due to lack of bilingual awareness.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-secondary-container font-black text-2xl sm:text-3xl block">450+</span>
            <span className="text-white font-bold text-sm sm:text-base block mt-1">Empanelled Network Hospitals</span>
            <p className="text-xs text-surface-dim mt-1">
              Dedicated Aarogyasri Free desks functioning in KGH, VIMS, SevenHills, Care, and Apollo.
            </p>
          </div>
        </div>
      </div>

      {/* Main Scanner Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Aadhaar Scanner & Input Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="card-tactile p-6 bg-white border border-outline-border rounded-3xl">
            {/* Mode Tabs */}
            <div className="flex rounded-full bg-surface-container p-1 mb-6">
              <button
                onClick={() => setActiveMode('ocr')}
                className={`flex-1 py-2.5 px-4 rounded-full text-base font-bold flex items-center justify-center gap-2 transition-all ${
                  activeMode === 'ocr'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                <Camera className="w-5 h-5 text-secondary-fixed" />
                <span>{language === 'te' ? 'ఆధార్ ఫోటో స్కాన్' : 'Aadhaar Photo OCR'}</span>
              </button>
              <button
                onClick={() => setActiveMode('manual')}
                className={`flex-1 py-2.5 px-4 rounded-full text-base font-bold flex items-center justify-center gap-2 transition-all ${
                  activeMode === 'manual'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                <Calendar className="w-5 h-5" />
                <span>{language === 'te' ? 'పుట్టిన సంవత్సరం' : 'Year of Birth Manual'}</span>
              </button>
            </div>

            {activeMode === 'ocr' ? (
              <div className="space-y-5">
                {/* Image Upload Dropzone */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-secondary/50 rounded-2xl p-6 sm:p-8 text-center cursor-pointer bg-surface-container-low hover:bg-surface-container transition-all group"
                >
                  {uploadedImagePreview ? (
                    <div className="space-y-3">
                      <img
                        src={uploadedImagePreview}
                        alt="Uploaded Aadhaar"
                        className="max-h-48 mx-auto rounded-xl object-contain border border-outline-subtle shadow-sm"
                      />
                      <span className="text-sm font-semibold text-secondary flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        {language === 'te' ? 'ఫోటో లోడ్ అయ్యింది - రీ-స్కాన్ చేయడానికి క్లిక్ చేయండి' : 'Photo Loaded - Click to change'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-16 h-16 rounded-full bg-secondary-container/80 flex items-center justify-center text-on-secondary-container group-hover:scale-110 transition-transform">
                        <Scan className="w-8 h-8 text-secondary" />
                      </div>
                      <div>
                        <span className="font-bold text-lg text-primary block">
                          {language === 'te' ? 'ఆధార్ కార్డ్ ఫోటో తీయండి లేదా అప్‌లోడ్ చేయండి' : 'Tap to Take a Photo or Upload Aadhaar'}
                        </span>
                        <p className="text-sm text-on-surface-variant mt-1">
                          {language === 'te'
                            ? 'మొబైల్ కెమెరా నుండి ఫోటో తీయండి (JPG, PNG సపోర్ట్)'
                            : 'Click to select photo or take camera picture (Safe & Local OCR)'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Or Pick a Realistic Preset */}
                <div>
                  <p className="text-sm font-bold text-on-surface-variant mb-2">
                    {language === 'te' ? 'లేదా వైజాగ్ నమూనా ఆధార్ కార్డ్‌ను ఎంచుకోండి:' : 'Or pick a realistic Visakhapatnam citizen card:'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {PRESET_AADHAAR_SAMPLES.map(sample => (
                      <button
                        key={sample.id}
                        onClick={() => handleSelectPreset(sample)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          selectedPresetId === sample.id
                            ? 'bg-secondary-container/30 border-2 border-secondary text-primary font-bold shadow-sm'
                            : 'bg-white border-outline-subtle text-on-surface-variant hover:bg-surface-container-low'
                        }`}
                      >
                        <div className="text-sm font-bold text-primary">{sample.name}</div>
                        <div className="text-xs text-secondary mt-0.5">{sample.locality.split('/')[0]}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scan Button */}
                <button
                  onClick={() => triggerAadhaarScan()}
                  disabled={isScanning}
                  className="btn-pill-primary w-full flex items-center justify-center gap-3 text-lg"
                >
                  {isScanning ? (
                    <>
                      <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{language === 'te' ? 'జెమిని AI విశ్లేషిస్తోంది...' : 'Gemini AI Analyzing...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-secondary-fixed" />
                      <span>{language === 'te' ? 'పథకాలు పరిశీలించండి' : 'Scan & Check Schemes'}</span>
                    </>
                  )}
                </button>

                <p className="text-xs text-center text-on-surface-variant flex items-center justify-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-secondary" />
                  {language === 'te'
                    ? 'గోప్యతా భద్రత: ఆధార్ నంబర్ ఆటోమేటిక్‌గా మాస్క్ చేయబడుతుంది.'
                    : 'Zero privacy risk: Aadhaar masks by default on citizen devices.'}
                </p>
              </div>
            ) : (
              /* Manual Input Form */
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label className="block text-base font-bold text-primary mb-1">
                    {language === 'te' ? 'పౌరుడి పూర్తి పేరు' : 'Citizen Full Name'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="input-tactile w-full"
                    placeholder="e.g. Appala Naidu / అప్పల నాయుడు"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-base font-bold text-primary mb-1">
                      {language === 'te' ? 'పుట్టిన సంవత్సరం' : 'Year of Birth'} *
                    </label>
                    <input
                      type="number"
                      required
                      min="1920"
                      max="2010"
                      value={manualYob}
                      onChange={(e) => setManualYob(e.target.value)}
                      className="input-tactile w-full"
                      placeholder="1954"
                    />
                  </div>
                  <div>
                    <label className="block text-base font-bold text-primary mb-1">
                      {language === 'te' ? 'రేషన్ కార్డు రకం' : 'Ration Card'}
                    </label>
                    <select
                      value={manualRation}
                      onChange={(e) => setManualRation(e.target.value as any)}
                      className="input-tactile w-full"
                    >
                      <option value="BPL White Card">BPL White Card (తెల్ల రేషన్ కార్డ్)</option>
                      <option value="Pink Card">Pink Card (పింక్ కార్డ్)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-base font-bold text-primary mb-1">
                    {language === 'te' ? 'విశాఖపట్నం ప్రాంతం (Locality)' : 'Visakhapatnam Locality'}
                  </label>
                  <input
                    type="text"
                    value={manualLocality}
                    onChange={(e) => setManualLocality(e.target.value)}
                    className="input-tactile w-full"
                    placeholder="e.g. MVP Colony, Gajuwaka, Maharani Peta"
                  />
                </div>

                <button
                  type="submit"
                  className="btn-pill-primary w-full flex items-center justify-center gap-2 mt-2"
                >
                  <CheckCircle2 className="w-5 h-5 text-secondary-fixed" />
                  <span>{language === 'te' ? 'అర్హత తనిఖీ చేయండి' : 'Check Eligibility'}</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Citizen Identified & Eligible Schemes */}
        <div className="lg:col-span-7 space-y-6">
          {/* Citizen Identified Card */}
          <div className="card-tactile p-6 bg-white border border-outline-border rounded-3xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-outline-subtle gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white font-black text-2xl shadow-md">
                  {currentProfile.fullName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl sm:text-2xl font-black text-primary">
                      {currentProfile.fullName}
                    </h3>
                    <span className="text-sm font-semibold text-on-surface-variant">
                      ({currentProfile.nameTe})
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-on-surface-variant mt-1">
                    <span className="font-semibold text-secondary">
                      {language === 'te' ? `వయస్సు: ${currentProfile.age} ఏళ్ళు` : `Age: ${currentProfile.age} Yrs`}
                    </span>
                    <span>•</span>
                    <span className="bg-surface-container px-2 py-0.5 rounded font-medium">
                      {currentProfile.rationCategory}
                    </span>
                    <span>•</span>
                    <span>{currentProfile.locality}</span>
                  </div>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="inline-block px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-black uppercase tracking-wider">
                  {language === 'te' ? 'ధృవీకరించబడిన పౌరుడు' : 'Verified Citizen'}
                </span>
                <span className="block text-xs font-mono text-outline mt-1">
                  Aadhaar: {currentProfile.maskedAadhaar}
                </span>
              </div>
            </div>

            {/* Eligible Schemes List */}
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold text-primary flex items-center gap-2">
                  <HeartPulse className="w-5 h-5 text-secondary" />
                  <span>{language === 'te' ? 'అర్హత కలిగిన పథకాలు' : 'Eligible Government Healthcare Schemes'}</span>
                </h4>
                <span className="px-3 py-1 rounded-full bg-secondary text-white text-xs font-bold">
                  {schemes.filter(s => s.isEligible).length} {language === 'te' ? 'పథకాలు లభ్యం' : 'Schemes Available'}
                </span>
              </div>

              {schemes.map((scheme) => (
                <div
                  key={scheme.id}
                  className="p-5 rounded-2xl bg-surface-container-low border border-secondary/20 hover:border-secondary transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <h5 className="font-extrabold text-lg text-primary">
                      {language === 'te' ? scheme.nameTe : scheme.name}
                    </h5>
                    <span className="px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-black">
                      {language === 'te' ? scheme.badgeTe : scheme.badge}
                    </span>
                  </div>

                  <p className="text-on-surface text-base leading-relaxed">
                    {language === 'te' ? scheme.summaryTe : scheme.summary}
                  </p>

                  <div className="mt-3 pt-3 border-t border-outline-subtle/80 flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="text-on-surface-variant font-medium flex items-center gap-1.5">
                      <Hospital className="w-4 h-4 text-secondary" />
                      {language === 'te' ? 'సిఫార్సు చేసిన ఆసుపత్రి:' : 'Empanelled Node:'}
                      <strong className="text-primary font-bold">{scheme.recommendedHospital}</strong>
                    </span>
                    <span className="text-xs bg-white px-2.5 py-1 rounded-full border border-outline-variant font-semibold text-secondary">
                      {scheme.directConsultationDepartment}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Next Move Call To Action Box (As requested: moves patient to consultation booking) */}
            <div className="mt-8 p-5 rounded-2xl bg-primary text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-elevated">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-xs font-bold text-secondary-fixed uppercase tracking-wider">
                  {language === 'te' ? 'తదుపరి దశ • ఆసుపత్రి దర్శనం' : 'Next Move • Hospital Consultation'}
                </span>
                <h4 className="text-lg sm:text-xl font-bold text-white">
                  {language === 'te'
                    ? 'కేజీహెచ్ లేదా విమ్స్ ఆసుపత్రి దర్శన స్లాట్‌ను బుక్ చేయండి'
                    : 'Book Free OPD Consultation at KGH or VIMS'}
                </h4>
                <p className="text-sm text-surface-dim">
                  {language === 'te'
                    ? 'ఆధార్ వివరాలు మరియు ఆరోగ్యశ్రీతో లైన్ లేకుండా నేరుగా డాక్టర్‌ని కలవండి.'
                    : 'Pre-authorizes 100% cashless treatment with zero standing in queues.'}
                </p>
              </div>

              <button
                onClick={() => onProceedToBooking(currentProfile)}
                className="btn-pill-secondary text-base sm:text-lg font-bold py-3.5 px-6 flex items-center gap-2 whitespace-nowrap shrink-0 shadow-lg transform hover:scale-105 transition-transform"
              >
                <span>{language === 'te' ? 'స్లాట్ బుక్ చేయండి' : 'Book OPD Slot Now'}</span>
                <ArrowRight className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Visakhapatnam Citizen Directory Section (from Screenshot 4) */}
      <div className="card-tactile p-6 bg-white border border-outline-border rounded-3xl mt-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-outline-subtle gap-4">
          <div>
            <h3 className="text-2xl font-bold text-primary">
              {language === 'te' ? 'విశాఖపట్నం పౌరుల జాబితా (నమూనా డేటా)' : 'Visakhapatnam Citizen Directory (Sample Records)'}
            </h3>
            <p className="text-base text-on-surface-variant mt-1">
              {language === 'te'
                ? 'విశాఖపట్నం జిల్లాలోని పౌరుల వయస్సు, ఆరోగ్యశ్రీ కార్డ్ మరియు ఆసుపత్రి వివరాలు.'
                : 'Explore real-world simulated patient cases across Vizag wards, KGH departments, and benefits.'}
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'te' ? 'పేరు లేదా ప్రాంతం ద్వారా శోధించండి...' : 'Search by Name, Locality...'}
              className="w-full pl-11 pr-4 py-2.5 rounded-full border-2 border-outline-border text-base focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 my-4">
          <button
            onClick={() => setDirectoryFilter('all')}
            className={`px-4 py-2 rounded-full text-base font-semibold transition-all ${
              directoryFilter === 'all' ? 'bg-primary text-white shadow-sm' : 'bg-surface text-primary border border-outline-variant'
            }`}
          >
            {language === 'te' ? 'అన్ని రికార్డులు (10)' : 'All Records (10)'}
          </button>
          <button
            onClick={() => setDirectoryFilter('elderly')}
            className={`px-4 py-2 rounded-full text-base font-semibold transition-all ${
              directoryFilter === 'elderly' ? 'bg-primary text-white shadow-sm' : 'bg-surface text-primary border border-outline-variant'
            }`}
          >
            {language === 'te' ? 'సీనియర్ సిటిజన్లు (60+ Yrs)' : 'Old Age (60+ Yrs)'}
          </button>
          <button
            onClick={() => setDirectoryFilter('chronic')}
            className={`px-4 py-2 rounded-full text-base font-semibold transition-all ${
              directoryFilter === 'chronic' ? 'bg-primary text-white shadow-sm' : 'bg-surface text-primary border border-outline-variant'
            }`}
          >
            {language === 'te' ? 'దీర్ఘకాలిక వ్యాధులు' : 'Chronic Illness'}
          </button>
        </div>

        {/* Grid of Citizen Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {filteredCitizens.map(citizen => (
            <div
              key={citizen.id}
              className="p-5 rounded-2xl border border-outline-subtle bg-surface-container-low hover:border-secondary transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-outline">{citizen.aadhaarCardId}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    citizen.age >= 60 ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-secondary-container text-on-secondary-container'
                  }`}>
                    Age {citizen.age} Yrs
                  </span>
                </div>

                <h4 className="font-extrabold text-lg text-primary">{citizen.fullName}</h4>
                <p className="text-xs text-secondary font-semibold">{citizen.nameTe}</p>
                <p className="text-sm text-on-surface-variant mt-2 flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-outline shrink-0" />
                  {citizen.locality}
                </p>

                <div className="mt-3 pt-2 border-t border-outline-subtle text-xs text-on-surface-variant space-y-1">
                  <div>
                    <strong>Hospital:</strong> {citizen.recommendedHospital}
                  </div>
                  <div>
                    <strong>Token:</strong>{' '}
                    <span className="font-bold text-secondary font-mono">{citizen.slotQueueToken}</span>{' '}
                    • Status: <span className="font-semibold text-primary">{citizen.consultationStatus}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 flex items-center justify-between">
                <span className="text-xs bg-white px-2 py-1 rounded border border-outline-variant text-secondary font-bold">
                  {citizen.rationCategory}
                </span>
                <button
                  onClick={() => onProceedToBooking(citizen)}
                  className="text-sm font-bold text-primary hover:text-secondary flex items-center gap-1 group"
                >
                  <span>{language === 'te' ? 'స్లాట్ బుక్ చేయండి' : 'Book Slot'}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Empanelled Health Nodes in Visakhapatnam (Screenshot 4 bottom) */}
      <div className="card-tactile p-6 bg-white border border-outline-border rounded-3xl mt-8">
        <div className="flex items-center gap-3 mb-4">
          <Hospital className="w-6 h-6 text-secondary" />
          <h3 className="text-xl md:text-2xl font-bold text-primary">
            {language === 'te' ? 'విశాఖపట్నం నెట్‌వర్క్ ప్రభుత్వ ఆసుపత్రులు' : 'Empanelled Health Nodes in Visakhapatnam'}
          </h3>
        </div>
        <p className="text-on-surface-variant text-base mb-6">
          {language === 'te'
            ? 'ప్రతి ఆసుపత్రిలో ప్రత్యేక ఉచిత ఆరోగ్యశ్రీ సహాయ కేంద్రం (హెల్ప్ డెస్క్) మరియు 24/7 అత్యవసర సేవలు.'
            : 'Each facility has an active Dr. YSR Aarogyasri Help Desk and 24/7 emergency telemetry.'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {VIZAG_HOSPITALS.map(hosp => (
            <div key={hosp.id} className="p-4 rounded-xl border border-outline-subtle bg-surface hover:bg-white transition-all">
              <span className="text-xs uppercase font-extrabold text-secondary tracking-wider block">
                {hosp.locality}
              </span>
              <h5 className="font-bold text-primary text-base mt-1 line-clamp-1">{hosp.name}</h5>
              <p className="text-xs text-on-surface-variant mt-1">{hosp.address.split(',')[0]}</p>
              <div className="mt-2 text-xs font-semibold text-secondary flex items-center gap-1">
                <span>{hosp.aarogyasriDesks} Aarogyasri Desks</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
