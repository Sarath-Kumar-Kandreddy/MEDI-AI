import React, { useState, useRef } from 'react';
import type { Language, PrescriptionResult } from '../types';
import { PRESET_PRESCRIPTIONS } from '../data/mockData';
import { analyzePrescriptionWithGemini } from '../services/gemini';
import { savePrescriptionRecord } from '../services/firebase';
import { NearbyPharmacyMap } from './NearbyPharmacyMap';
import { 
  FileText, Camera, CheckCircle2, ShoppingBag, 
  Sparkles, Phone, ShieldCheck, Clock, ArrowUpRight 
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PrescriptionScannerProps {
  language: Language;
  onOpenVoiceAssist: () => void;
}

export const PrescriptionScanner: React.FC<PrescriptionScannerProps> = ({
  language,
  onOpenVoiceAssist,
}) => {
  const [activePreset, setActivePreset] = useState<string>('diabetes');
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionResult>(PRESET_PRESCRIPTIONS.diabetes);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<'tata1mg' | 'pharmeasy' | 'apollo' | 'janAushadhi'>('tata1mg');
  const [selectedAddress, setSelectedAddress] = useState<string>('MVP Colony, Sector 4, Visakhapatnam (530017)');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Switch between presets
  const handleSelectPreset = (key: string) => {
    setActivePreset(key);
    setImagePreview(null);
    setPrescriptionData(PRESET_PRESCRIPTIONS[key]);
  };

  // Upload custom prescription slip image
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setImagePreview(base64);
      triggerAnalysis(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  // Trigger Gemini API Vision OCR Analysis
  const triggerAnalysis = async (base64Img?: string, mimeType?: string) => {
    setIsAnalyzing(true);
    try {
      const img = base64Img || imagePreview || '';
      const result = await analyzePrescriptionWithGemini(img, mimeType || 'image/jpeg');
      setPrescriptionData(result);
      await savePrescriptionRecord(result);
    } catch (err) {
      console.error('Prescription analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Calculate pricing based on selected platform
  const calculateTotal = () => {
    const medicines = prescriptionData.medicines || [];
    const mrpTotal = medicines.reduce((sum, m) => sum + m.mrp, 0);

    let platformTotal = 0;
    medicines.forEach(m => {
      if (selectedPlatform === 'tata1mg') platformTotal += m.priceComparisons.tata1mg;
      else if (selectedPlatform === 'pharmeasy') platformTotal += m.priceComparisons.pharmeasy;
      else if (selectedPlatform === 'apollo') platformTotal += m.priceComparisons.apollo;
      else if (selectedPlatform === 'janAushadhi') platformTotal += m.priceComparisons.janAushadhiGeneric;
    });

    const savings = mrpTotal - platformTotal;
    const savingsPercent = mrpTotal > 0 ? Math.round((savings / mrpTotal) * 100) : 0;

    return { mrpTotal, platformTotal, savings, savingsPercent };
  };

  const { mrpTotal, platformTotal, savings, savingsPercent } = calculateTotal();

  // Handle Order Dispatch
  const handlePlaceOrder = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch {
      // Confetti fallback
    }
    setTimeout(() => {
      alert(
        language === 'te'
          ? `ధన్యవాదాలు! మీ ఆర్డర్ విజయవంతంగా నమోదైంది.\nమొత్తం ఖర్చు: ₹${platformTotal}\nడెలివరీ అడ్రస్: ${selectedAddress}\nఈరోజే విశాఖపట్నంలో డెలివరీ చేయబడుతుంది.`
          : `Success! Medicine order dispatched via ${selectedPlatform.toUpperCase()}.\nTotal: ₹${platformTotal}\nDelivery Address: ${selectedAddress}\nEstimated Delivery: Today by 5:30 PM across Visakhapatnam.`
      );
    }, 400);
  };

  return (
    <div className="space-y-10">
      {/* Top Banner from Screenshot 2 */}
      <div className="bg-primary text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-tactile">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-white text-xs sm:text-sm font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Direct Vizag E-Pharmacy & Jan Aushadhi Portal</span>
          </div>
          <span className="text-secondary-fixed text-xs sm:text-sm font-semibold">
            {language === 'te' ? 'వైజాగ్ నగరవ్యాప్తంగా డోర్ డెలివరీ' : 'Same-Day Doorstep Delivery'}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2">
          {language === 'te'
            ? 'AI ప్రిస్క్రిప్షన్ స్కాన్ చేసి ఆన్‌లైన్‌లో మందులు ఆర్డర్ చేయండి'
            : 'AI Prescription Analyzer & Direct Online Medicine Delivery'}
        </h1>
        <p className="text-surface-dim text-base sm:text-lg max-w-3xl leading-relaxed">
          {language === 'te'
            ? 'డాక్టర్ రాసిన కాగితం లేదా ప్రిస్క్రిప్షన్ ఫోటో తీయండి. జెమిని AI మందుల పేర్లు, మోతాదు (1-0-1) గుర్తించి, ఫార్మ్‌ఈజీ, టాటా 1mg, అపోలో మరియు జన ఔషధి ధరలను పోల్చి చూపిస్తుంది.'
            : 'Elderly friendly home delivery across Visakhapatnam (MVP Colony, Gajuwaka, Dwaraka Nagar, Siripuram, Pendurthi). Upload any hospital slip to compare real-time discounts, find affordable generic equivalents, or arrange instant doorstep drops.'}
        </p>

        {/* 3 Metric Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-secondary-container text-on-secondary-container font-black text-sm">
              60-90m
            </span>
            <div>
              <span className="text-white font-bold text-sm block">Apollo Express Vizag</span>
              <span className="text-xs text-surface-dim">Local pickup hubs in MVP, Siripuram</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-secondary text-white font-black text-sm">
              Up to 82%
            </span>
            <div>
              <span className="text-white font-bold text-sm block">Jan Aushadhi Kendra</span>
              <span className="text-xs text-surface-dim">Govt subsidized generic drugs at KGH</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed font-black text-sm">
              Free Calls
            </span>
            <div>
              <span className="text-white font-bold text-sm block">Senior Voice Assist</span>
              <span className="text-xs text-surface-dim">Telugu voice agent for ordering</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Scanner & Recognized Medicines | Right Delivery Basket */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: AI Medical Prescription OCR & Medicine Matcher */}
        <div className="lg:col-span-7 space-y-6">
          <div className="card-tactile p-6 bg-white border border-outline-border rounded-3xl">
            <div className="flex items-center justify-between pb-4 border-b border-outline-subtle">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                  <Camera className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-primary">
                    {language === 'te' ? 'AI మెడికల్ ప్రిస్క్రిప్షన్ OCR & మందుల గుర్తింపు' : 'AI Medical Prescription OCR & Medicine Matcher'}
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    {language === 'te' ? 'డాక్టర్ ప్రిస్క్రిప్షన్ ఫోటో తీయండి లేదా నమూనాను ఎంచుకోండి' : 'Doctor slip handwriting parsing with Google Gemini'}
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full bg-surface-container text-xs font-bold text-primary">
                Bilingual OCR v4.2
              </span>
            </div>

            {/* Upload Area */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="mt-5 border-2 border-dashed border-secondary/50 rounded-2xl p-6 sm:p-8 text-center cursor-pointer bg-surface-container-low hover:bg-surface-container transition-all group"
            >
              {imagePreview ? (
                <div className="space-y-3">
                  <img
                    src={imagePreview}
                    alt="Uploaded Prescription"
                    className="max-h-52 mx-auto rounded-xl object-contain border border-outline-subtle shadow-sm"
                  />
                  <span className="text-sm font-semibold text-secondary flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    {language === 'te' ? 'ప్రిస్క్రిప్షన్ లోడ్ అయ్యింది - రీ-స్కాన్ చేయడానికి క్లిక్ చేయండి' : 'Slip Loaded - Click to change photo'}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-secondary-container/80 flex items-center justify-center text-on-secondary-container group-hover:scale-110 transition-transform">
                    <Camera className="w-8 h-8 text-secondary" />
                  </div>
                  <div>
                    <span className="font-bold text-lg text-primary block">
                      {language === 'te' ? 'మొబైల్ కెమెరా నుండి ఫోటో తీయండి లేదా అప్‌లోడ్ చేయండి' : 'Tap to Take a Photo or Upload Slip'}
                    </span>
                    <p className="text-xs text-on-surface-variant mt-1">
                      {language === 'te'
                        ? 'కేజీహెచ్, అపోలో, కేర్ హాస్పిటల్స్ డాక్టర్ చేతిరాత మరియు ప్రింటెడ్ స్లిప్పులు గుర్తించబడతాయి'
                        : 'KGH, Apollo Vizag, Care, King George Hospital Slips Recognized'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Realistic Visakhapatnam Presets */}
            <div className="mt-5">
              <p className="text-sm font-bold text-on-surface-variant mb-2">
                {language === 'te' ? 'లేదా వైజాగ్ పేషెంట్ ప్రిస్క్రిప్షన్ నమూనాను ఎంచుకోండి:' : 'Or pick a realistic Visakhapatnam patient prescription:'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => handleSelectPreset('diabetes')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    activePreset === 'diabetes'
                      ? 'bg-secondary-container/40 border-2 border-secondary text-primary font-bold shadow-sm'
                      : 'bg-white border-outline-subtle text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  <div className="text-sm font-bold text-primary">Senior Diabetes & Hypertension</div>
                  <div className="text-xs text-secondary mt-0.5">షుగర్ & బీపీ ప్రిస్క్రిప్షన్ (KGH Vizag)</div>
                </button>

                <button
                  onClick={() => handleSelectPreset('cardiac')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    activePreset === 'cardiac'
                      ? 'bg-secondary-container/40 border-2 border-secondary text-primary font-bold shadow-sm'
                      : 'bg-white border-outline-subtle text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  <div className="text-sm font-bold text-primary">Cardiac Care & Blood Thinner</div>
                  <div className="text-xs text-secondary mt-0.5">గుండె మరియు కొలెస్ట్రాల్ రక్షణ (VIMS)</div>
                </button>

                <button
                  onClick={() => handleSelectPreset('osteo')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    activePreset === 'osteo'
                      ? 'bg-secondary-container/40 border-2 border-secondary text-primary font-bold shadow-sm'
                      : 'bg-white border-outline-subtle text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  <div className="text-sm font-bold text-primary">Senior Osteoarthritis & Joint Pain</div>
                  <div className="text-xs text-secondary mt-0.5">కీళ్ల నొప్పులు & క్యాల్షియం (KGH Ortho)</div>
                </button>

                <button
                  onClick={() => handleSelectPreset('gastritis')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    activePreset === 'gastritis'
                      ? 'bg-secondary-container/40 border-2 border-secondary text-primary font-bold shadow-sm'
                      : 'bg-white border-outline-subtle text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  <div className="text-sm font-bold text-primary">Acid Reflux & Gastritis Relief</div>
                  <div className="text-xs text-secondary mt-0.5">కడుపులో మంట & గ్యాస్ సమస్య (Victoria Hosp)</div>
                </button>
              </div>
            </div>

            {/* Scan Action */}
            <button
              onClick={() => triggerAnalysis()}
              disabled={isAnalyzing}
              className="btn-pill-primary w-full flex items-center justify-center gap-2 mt-5 text-lg"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{language === 'te' ? 'జెమిని AI OCR విశ్లేషిస్తోంది...' : 'Gemini AI OCR Analyzing Slip...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-secondary-fixed" />
                  <span>{language === 'te' ? 'మందుల మోతాదు & ధరలను విశ్లేషించండి' : 'Analyze Slip & Compare E-Pharmacies'}</span>
                </>
              )}
            </button>
          </div>

          {/* Doctor Header & Diagnosis Result */}
          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-subtle">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-secondary">
                  {prescriptionData.doctorDetails.hospital}
                </span>
                <h4 className="text-base sm:text-lg font-bold text-primary">
                  {prescriptionData.doctorDetails.doctorName} • {prescriptionData.doctorDetails.department}
                </h4>
              </div>
              <span className="text-xs bg-white px-2.5 py-1 rounded-full border border-outline-variant font-mono">
                {prescriptionData.doctorDetails.date}
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-outline-subtle text-sm">
              <strong className="text-primary">{language === 'te' ? 'రోగ నిర్ధారణ:' : 'Diagnosis:'}</strong>{' '}
              <span className="text-on-surface-variant font-medium">
                {language === 'te' && prescriptionData.diagnosisTe ? prescriptionData.diagnosisTe : prescriptionData.diagnosis}
              </span>
            </div>
          </div>

          {/* Recognized Medicines & Dosage Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                <FileText className="w-5 h-5 text-secondary" />
                <span>{language === 'te' ? 'గుర్తించబడిన మందులు మరియు మోతాదు వివరాలు' : 'Recognized Medicines & Dosage'}</span>
              </h3>
              <span className="px-3 py-1 rounded-full bg-secondary text-white text-xs font-black">
                {prescriptionData.medicines.length} {language === 'te' ? 'మందులు' : 'Medicines'}
              </span>
            </div>

            {prescriptionData.medicines.map((med, idx) => (
              <div
                key={med.id || idx}
                className="card-tactile p-5 bg-white border border-outline-border rounded-2xl hover:border-secondary transition-all"
              >
                {/* Header with Name & MRP */}
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h4 className="text-lg font-bold text-primary">{med.brandName}</h4>
                      <span className="text-xs bg-surface-container px-2 py-0.5 rounded font-semibold text-on-surface-variant">
                        {med.quantity}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant font-mono mt-1">
                      Salt: {med.genericSalt}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold text-primary">MRP ₹{med.mrp}</span>
                    <span className="block text-[11px] text-secondary font-semibold">
                      Govt Ceiling Compliant
                    </span>
                  </div>
                </div>

                {/* Doctor Dosage & Instructions */}
                <div className="mt-3 p-3 rounded-xl bg-surface-container-low border border-secondary/20">
                  <div className="flex items-center gap-2 text-sm font-bold text-primary">
                    <Clock className="w-4 h-4 text-secondary" />
                    <span>
                      {language === 'te' ? 'డాక్టర్ మోతాదు:' : 'Doctor Dose:'}{' '}
                      <strong className="text-secondary">{med.doctorDose}</strong>
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
                    {language === 'te' ? med.seniorInstructionsTe : med.seniorInstructionsEn}
                  </p>
                </div>

                {/* Direct Platform Comparison (Visakhapatnam) */}
                <div className="mt-4 pt-3 border-t border-outline-subtle">
                  <span className="text-xs font-bold text-on-surface-variant block mb-2 uppercase tracking-wider">
                    {language === 'te' ? 'వైజాగ్ ప్లాట్‌ఫారమ్ ధరల పోలిక (E-Pharmacy Links):' : 'Direct Platform Comparison (Visakhapatnam):'}
                  </span>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                    {/* Tata 1mg */}
                    <a
                      href={med.tata1mgSearchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-surface hover:bg-secondary-container/40 border border-outline-subtle flex flex-col justify-between group transition-all"
                    >
                      <span className="font-bold text-primary flex items-center justify-center gap-0.5">
                        Tata 1mg <ArrowUpRight className="w-3 h-3 text-secondary opacity-70 group-hover:opacity-100" />
                      </span>
                      <span className="font-extrabold text-primary text-sm mt-1">₹{med.priceComparisons.tata1mg}</span>
                      <span className="text-[10px] text-secondary font-semibold">Today 6 PM</span>
                    </a>

                    {/* Apollo 24|7 */}
                    <a
                      href={med.apolloSearchUrl || `https://www.apollopharmacy.in/search-medicines/${encodeURIComponent(med.brandName)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-surface hover:bg-secondary-container/40 border border-outline-subtle flex flex-col justify-between group transition-all"
                    >
                      <span className="font-bold text-primary flex items-center justify-center gap-0.5">
                        Apollo 24|7 <ArrowUpRight className="w-3 h-3 text-secondary opacity-70 group-hover:opacity-100" />
                      </span>
                      <span className="font-extrabold text-primary text-sm mt-1">₹{med.priceComparisons.apollo}</span>
                      <span className="text-[10px] text-secondary font-semibold">60 Mins</span>
                    </a>

                    {/* PharmEasy */}
                    <a
                      href={med.pharmeasySearchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-surface hover:bg-secondary-container/40 border border-outline-subtle flex flex-col justify-between group transition-all"
                    >
                      <span className="font-bold text-primary flex items-center justify-center gap-0.5">
                        PharmEasy <ArrowUpRight className="w-3 h-3 text-secondary opacity-70 group-hover:opacity-100" />
                      </span>
                      <span className="font-extrabold text-primary text-sm mt-1">₹{med.priceComparisons.pharmeasy}</span>
                      <span className="text-[10px] text-secondary font-semibold">Tomorrow</span>
                    </a>

                    {/* Netmeds */}
                    <a
                      href={med.netmedsSearchUrl || `https://www.netmeds.com/catalogsearch/result?q=${encodeURIComponent(med.brandName)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-surface hover:bg-secondary-container/40 border border-outline-subtle flex flex-col justify-between group transition-all"
                    >
                      <span className="font-bold text-primary flex items-center justify-center gap-0.5">
                        Netmeds <ArrowUpRight className="w-3 h-3 text-secondary opacity-70 group-hover:opacity-100" />
                      </span>
                      <span className="font-extrabold text-primary text-sm mt-1">₹{med.priceComparisons.netmeds}</span>
                      <span className="text-[10px] text-secondary font-semibold">Tomorrow</span>
                    </a>

                    {/* Jan Aushadhi Generic (Massive Savings) */}
                    <div className="p-2 rounded-lg bg-secondary-container border border-secondary text-on-secondary-container flex flex-col justify-between">
                      <span className="font-black text-secondary">Jan Aushadhi</span>
                      <span className="font-black text-base text-secondary mt-1">₹{med.priceComparisons.janAushadhiGeneric}</span>
                      <span className="text-[10px] font-black text-secondary">-{med.priceComparisons.janAushadhiSavingsPercent}% Generic</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Direct Delivery Basket & Pharmacy Networks (from Screenshot 2) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Direct Delivery Basket Card */}
          <div className="card-tactile p-6 bg-white border border-outline-border rounded-3xl shadow-tactile">
            <div className="flex items-center justify-between pb-4 border-b border-outline-subtle">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-6 h-6 text-secondary" />
                <h3 className="text-xl font-bold text-primary">
                  {language === 'te' ? 'డెలివరీ బాస్కెట్' : 'Direct Delivery Basket'}
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold">
                Vizag Zone
              </span>
            </div>

            {/* Provider Selector */}
            <div className="mt-4 space-y-3">
              <label className="text-sm font-bold text-on-surface-variant block">
                {language === 'te' ? 'డెలివరీ ప్లాట్‌ఫారమ్ ఎంచుకోండి:' : 'Preferred Provider in Visakhapatnam:'}
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSelectedPlatform('tata1mg')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedPlatform === 'tata1mg'
                      ? 'bg-primary text-white font-bold shadow-sm'
                      : 'bg-surface text-primary border-outline-variant hover:bg-surface-container'
                  }`}
                >
                  <div className="text-sm font-bold">Tata 1mg Vizag</div>
                  <div className="text-[11px] opacity-80">Same-day Vizag hub</div>
                </button>

                <button
                  onClick={() => setSelectedPlatform('pharmeasy')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedPlatform === 'pharmeasy'
                      ? 'bg-primary text-white font-bold shadow-sm'
                      : 'bg-surface text-primary border-outline-variant hover:bg-surface-container'
                  }`}
                >
                  <div className="text-sm font-bold">PharmEasy</div>
                  <div className="text-[11px] opacity-80">Subscription savings</div>
                </button>

                <button
                  onClick={() => setSelectedPlatform('apollo')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedPlatform === 'apollo'
                      ? 'bg-primary text-white font-bold shadow-sm'
                      : 'bg-surface text-primary border-outline-variant hover:bg-surface-container'
                  }`}
                >
                  <div className="text-sm font-bold">Apollo 24|7 Express</div>
                  <div className="text-[11px] opacity-80">60-90m fast dispatch</div>
                </button>

                <button
                  onClick={() => setSelectedPlatform('janAushadhi')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedPlatform === 'janAushadhi'
                      ? 'bg-secondary text-white font-bold shadow-sm'
                      : 'bg-secondary-container text-on-secondary-container font-bold border border-secondary'
                  }`}
                >
                  <div className="text-sm font-bold">Jan Aushadhi Kendra</div>
                  <div className="text-[11px] opacity-90">80% Govt generic cut</div>
                </button>
              </div>
            </div>

            {/* Summary Details */}
            <div className="mt-5 space-y-2.5 text-base border-t border-outline-subtle pt-4">
              <div className="flex justify-between text-on-surface-variant">
                <span>{language === 'te' ? 'ఎంచుకున్న మందులు:' : 'Total Selected Items:'}</span>
                <span className="font-bold text-primary">{prescriptionData.medicines.length} Items</span>
              </div>

              <div className="flex justify-between text-on-surface-variant">
                <span>{language === 'te' ? 'డెలివరీ సమయం:' : 'Estimated Delivery Time:'}</span>
                <span className="font-semibold text-secondary">
                  {selectedPlatform === 'apollo' ? 'Within 60 Mins' : 'Today by 5:30 PM'}
                </span>
              </div>

              {/* Savings Highlight Pill */}
              <div className="p-3 rounded-xl bg-secondary-container/60 border border-secondary/30 flex items-center justify-between text-sm">
                <span className="font-bold text-secondary">
                  {language === 'te' ? 'సీనియర్ సిటిజన్ & ఆన్‌లైన్ ఆదా:' : 'Senior Citizen & Online Savings:'}
                </span>
                <span className="font-black text-secondary text-base">
                  ₹{savings} Saved ({savingsPercent}% off)
                </span>
              </div>

              {/* Net Total */}
              <div className="flex justify-between items-baseline pt-2">
                <span className="text-xl font-extrabold text-primary">
                  {language === 'te' ? 'మొత్తం ఖర్చు (Net Total):' : 'Net Total (మొత్తం ఖర్చు):'}
                </span>
                <div className="text-right">
                  <span className="text-2xl sm:text-3xl font-black text-primary">₹{platformTotal}</span>
                  <span className="block text-xs line-through text-outline">MRP ₹{mrpTotal}</span>
                </div>
              </div>
            </div>

            {/* Delivery Address in Visakhapatnam */}
            <div className="mt-5">
              <label className="text-sm font-bold text-primary block mb-1">
                {language === 'te' ? 'విశాఖపట్నం డెలివరీ చిరునామా:' : 'Delivery Address in Visakhapatnam:'}
              </label>
              <select
                value={selectedAddress}
                onChange={(e) => setSelectedAddress(e.target.value)}
                className="input-tactile w-full text-base"
              >
                <option value="MVP Colony, Sector 4, Visakhapatnam (530017)">
                  MVP Colony, Sector 4, Visakhapatnam (530017)
                </option>
                <option value="Maharani Peta, Near KGH Collector Office (530002)">
                  Maharani Peta, Near KGH Collector Office (530002)
                </option>
                <option value="Dwaraka Nagar, 2nd Lane, Visakhapatnam (530016)">
                  Dwaraka Nagar, 2nd Lane, Visakhapatnam (530016)
                </option>
                <option value="Gajuwaka Industrial Corridor, Ward 22 (530026)">
                  Gajuwaka Industrial Corridor, Ward 22 (530026)
                </option>
                <option value="Siripuram Junction, Near Andhra University (530003)">
                  Siripuram Junction, Near Andhra University (530003)
                </option>
                <option value="Pendurthi Main Road, Visakhapatnam (530051)">
                  Pendurthi Main Road, Visakhapatnam (530051)
                </option>
              </select>
            </div>

            {/* Order Dispatch Button */}
            <button
              onClick={handlePlaceOrder}
              className="btn-pill-primary w-full mt-5 text-lg flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-5 h-5 text-secondary-fixed" />
              <span>{language === 'te' ? 'ఆర్డర్ పూర్తి చేయండి' : 'Proceed to Order (ఆర్డర్ పూర్తి చేయండి)'}</span>
            </button>

            {/* Assisted Phone Call Order */}
            <button
              onClick={onOpenVoiceAssist}
              className="w-full mt-3 py-3 px-4 rounded-full border-2 border-outline-border hover:bg-surface-container text-primary font-bold text-base flex items-center justify-center gap-2 transition-all"
            >
              <Phone className="w-5 h-5 text-tertiary-saffron" />
              <span>{language === 'te' ? 'ఫోన్ ద్వారా అసిస్టెడ్ ఆర్డర్' : 'Order via Assisted Phone Call (ఫోన్ ద్వారా ఆర్డర్)'}</span>
            </button>

            <p className="text-xs text-center text-on-surface-variant mt-3 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-secondary" />
              <span>100% Genuine Certified Batch Guaranteed • Barcode Scanned</span>
            </p>
          </div>

          {/* Connected Vizag Pharmacy Networks (from Screenshot 2) */}
          <div className="card-tactile p-6 bg-white border border-outline-border rounded-3xl">
            <h4 className="font-bold text-lg text-primary mb-3">
              {language === 'te' ? 'అనుసంధానించబడిన వైజాగ్ ఫార్మసీ నెట్‌వర్క్' : 'Connected Vizag Pharmacy Networks'}
            </h4>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-surface flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-primary text-base">Tata 1mg Vizag</h5>
                  <p className="text-xs text-on-surface-variant">Same-day delivery across municipal corporation limits</p>
                </div>
                <span className="text-sm font-extrabold text-secondary">15% Off</span>
              </div>

              <div className="p-3 rounded-xl bg-surface flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-primary text-base">Apollo 24|7 Express</h5>
                  <p className="text-xs text-on-surface-variant">Local pickup hubs in MVP, Siripuram, Gajuwaka</p>
                </div>
                <span className="text-sm font-extrabold text-primary">60 Mins</span>
              </div>

              <div className="p-3 rounded-xl bg-secondary-container/40 border border-secondary/30 flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-secondary text-base">Jan Aushadhi Kendra</h5>
                  <p className="text-xs text-on-surface-variant">Govt subsidized generic drugs at KGH & Jagadamba</p>
                </div>
                <span className="text-sm font-black text-secondary">80% Cheaper</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Interactive Google Maps Pharmacy Locator (as explicitly requested) */}
      <NearbyPharmacyMap language={language} />
    </div>
  );
};
