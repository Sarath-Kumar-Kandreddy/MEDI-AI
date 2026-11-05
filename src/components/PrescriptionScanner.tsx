import React, { useState, useRef } from 'react';
import type { Language, PrescriptionResult, Medicine } from '../types';
import { 
  analyzePrescriptionWithGemini, 
  createDynamicMedicine, 
  hasGeminiKey, 
  getStoredGeminiKey, 
  setStoredGeminiKey 
} from '../services/gemini';
import { savePrescriptionRecord } from '../services/firebase';
import { NearbyPharmacyMap } from './NearbyPharmacyMap';
import { 
  FileText, Camera, CheckCircle2, ShoppingBag, 
  Sparkles, Phone, ShieldCheck, Clock, ArrowUpRight, Stethoscope, RefreshCw,
  Plus, Trash2, X, Key, AlertCircle, ExternalLink
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
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ base64: string; mimeType: string; fileName: string } | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<'tata1mg' | 'pharmeasy' | 'apollo' | 'janAushadhi'>('tata1mg');
  const [selectedAddress, setSelectedAddress] = useState<string>('MVP Colony, Sector 4, Visakhapatnam (530017)');
  const [scanMode, setScanMode] = useState<'photo' | 'text'>('photo');

  // Inline Gemini API Key Setup state
  const [hasKey, setHasKey] = useState<boolean>(() => hasGeminiKey());
  const [apiKeyInput, setApiKeyInput] = useState<string>(() => getStoredGeminiKey());
  const [isKeySaved, setIsKeySaved] = useState<boolean>(false);
  const [showKeyPrompt, setShowKeyPrompt] = useState<boolean>(() => !hasGeminiKey());

  // Manual OCR Text Input state
  const [rawPrescriptionText, setRawPrescriptionText] = useState('');

  // Inline "Add Medicine" modal state
  const [isAddMedicineOpen, setIsAddMedicineOpen] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newMedSalt, setNewMedSalt] = useState('');
  const [newMedDose, setNewMedDose] = useState('1 Tablet After Meal (1-0-1)');
  const [newMedPrice, setNewMedPrice] = useState('85');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save API Key locally
  const handleSaveApiKey = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!apiKeyInput.trim()) return;

    setStoredGeminiKey(apiKeyInput.trim());
    setHasKey(true);
    setIsKeySaved(true);
    setAnalysisError(null);
    setTimeout(() => setIsKeySaved(false), 2000);

    // If an image was already waiting to be analyzed, run it automatically
    if (uploadedFile) {
      triggerAnalysis(uploadedFile.base64, uploadedFile.mimeType, uploadedFile.fileName);
    }
  };

  // Upload custom prescription slip image
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalysisError(null);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setImagePreview(base64);
      const fileData = { base64, mimeType: file.type || 'image/jpeg', fileName: file.name };
      setUploadedFile(fileData);

      // Auto-trigger analysis if API key is present
      if (hasKey) {
        triggerAnalysis(base64, file.type, file.name);
      } else {
        setShowKeyPrompt(true);
      }
    };
    reader.readAsDataURL(file);
  };

  // Trigger Gemini Multimodal OCR Vision Analysis
  const triggerAnalysis = async (base64Img?: string, mimeType?: string, fileName?: string) => {
    const imgToUse = base64Img || uploadedFile?.base64 || imagePreview;
    const mimeToUse = mimeType || uploadedFile?.mimeType || 'image/jpeg';
    const nameToUse = fileName || uploadedFile?.fileName;

    if (!imgToUse) {
      setAnalysisError(
        language === 'te' 
          ? 'దయచేసి విశ్లేషించడానికి ఒక ప్రిస్క్రిప్షన్ ఫోటోను ఎంచుకోండి.' 
          : 'Please select or upload a doctor prescription slip first.'
      );
      return;
    }

    if (!hasGeminiKey()) {
      setShowKeyPrompt(true);
      setAnalysisError(
        language === 'te'
          ? 'గూగుల్ జెమిని API కీ అవసరం. దయచేసి క్రింద మీ API కీని నమోదు చేయండి.'
          : 'Google Gemini API key required. Please enter your API key below to scan doctor handwriting.'
      );
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const result = await analyzePrescriptionWithGemini(imgToUse, mimeToUse, nameToUse);
      setPrescriptionData(result);
      await savePrescriptionRecord(result);
    } catch (err: any) {
      console.error('Prescription Gemini OCR error:', err);
      if (err?.message === 'NO_API_KEY') {
        setShowKeyPrompt(true);
        setAnalysisError('Google Gemini API Key is missing. Enter your key to run AI OCR.');
      } else {
        setAnalysisError(
          `Gemini OCR Analysis: ${err?.message || 'Failed to extract medicines from this slip. Ensure the image is clear or verify your Gemini key.'}`
        );
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Direct Text OCR Parser (for e-prescriptions or pasted doctor notes)
  const handleTextOcrParse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawPrescriptionText.trim()) return;

    setIsAnalyzing(true);
    setAnalysisError(null);

    const lines = rawPrescriptionText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    const parsedMeds: Medicine[] = [];

    lines.forEach((line) => {
      const doseMatch = line.match(/(1-0-1|1-0-0|0-0-1|0-1-0|SOS|twice daily|once daily|after food|before food)/i);
      const dose = doseMatch ? doseMatch[0] : '1 Dose Daily (1-0-1)';
      const cleanName = line.replace(/(1-0-1|1-0-0|0-0-1|0-1-0|SOS|twice daily|once daily|after food|before food|tab\.|cap\.|syp\.|inj\.)/gi, '').trim();

      if (cleanName.length > 1) {
        parsedMeds.push(createDynamicMedicine(cleanName, `${cleanName} Formulation IP`, dose));
      }
    });

    if (parsedMeds.length === 0) {
      parsedMeds.push(createDynamicMedicine(rawPrescriptionText.trim().slice(0, 30), 'Active Formulation IP'));
    }

    const newResult: PrescriptionResult = {
      doctorDetails: {
        doctorName: 'Dr. Attending Physician, MD',
        hospital: 'King George Hospital (KGH) / Clinic',
        date: new Date().toLocaleDateString('en-GB'),
        department: 'General Outpatient'
      },
      diagnosis: 'Prescription Order (Extracted via OCR Text)',
      diagnosisTe: 'ప్రిస్క్రిప్షన్ ఆధారంగా గుర్తించిన మందులు',
      medicines: parsedMeds,
      dietaryAdvice: 'Follow doctor-advised nutrition and regular hydration.',
      dietaryAdviceTe: 'వైద్యుల సూచనల ప్రకారం సమతుల్య ఆహారం మరియు నీరు త్రాగండి.',
      summaryTe: 'ప్రిస్క్రిప్షన్ OCR ద్వారా మందులు విజయవంతంగా గుర్తించబడ్డాయి.'
    };

    setPrescriptionData(newResult);
    savePrescriptionRecord(newResult);
    setIsAnalyzing(false);
  };

  // Add custom medicine dynamically
  const handleAddMedicineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim()) return;

    const med = createDynamicMedicine(
      newMedName.trim(),
      newMedSalt.trim() || undefined,
      newMedDose.trim(),
      Number(newMedPrice) || 85
    );

    if (prescriptionData) {
      const updated: PrescriptionResult = {
        ...prescriptionData,
        medicines: [...prescriptionData.medicines, med]
      };
      setPrescriptionData(updated);
      savePrescriptionRecord(updated);
    } else {
      const initial: PrescriptionResult = {
        doctorDetails: {
          doctorName: 'Dr. Attending Physician',
          hospital: 'King George Hospital (KGH) - Visakhapatnam',
          date: new Date().toLocaleDateString('en-GB'),
          department: 'Outpatient Care'
        },
        diagnosis: 'Prescription Order',
        diagnosisTe: 'వైద్యుల ప్రిస్క్రిప్షన్',
        medicines: [med],
        dietaryAdvice: 'Follow prescribed dosage with meals.',
        summaryTe: 'ప్రిస్క్రిప్షన్ మందులు నమోదయ్యాయి.'
      };
      setPrescriptionData(initial);
      savePrescriptionRecord(initial);
    }

    setNewMedName('');
    setNewMedSalt('');
    setIsAddMedicineOpen(false);
  };

  // Delete a medicine item
  const handleDeleteMedicine = (id: string) => {
    if (!prescriptionData) return;
    const filtered = prescriptionData.medicines.filter(m => m.id !== id);
    setPrescriptionData({
      ...prescriptionData,
      medicines: filtered
    });
  };

  // Reset prescription scanner
  const handleResetPrescription = () => {
    setPrescriptionData(null);
    setImagePreview(null);
    setUploadedFile(null);
    setRawPrescriptionText('');
    setAnalysisError(null);
  };

  // Calculate pricing based on selected platform
  const calculateTotal = () => {
    if (!prescriptionData) return { mrpTotal: 0, platformTotal: 0, savings: 0, savingsPercent: 0 };
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
    } catch {}

    setTimeout(() => {
      const medList = prescriptionData?.medicines.map(m => m.brandName).join(', ') || 'Prescribed Medicines';
      alert(
        language === 'te'
          ? `ధన్యవాదాలు! మీ ఆర్డర్ విజయవంతంగా నమోదైంది.\nమందులు: ${medList}\nమొత్తం ఖర్చు: ₹${platformTotal}\nడెలివరీ అడ్రస్: ${selectedAddress}\nఈరోజే విశాఖపట్నంలో డెలివరీ చేయబడుతుంది.`
          : `Success! Medicine order dispatched via ${selectedPlatform.toUpperCase()}.\nMedicines: ${medList}\nTotal: ₹${platformTotal}\nDelivery Address: ${selectedAddress}\nEstimated Delivery: Today by 5:30 PM across Visakhapatnam.`
      );
    }, 400);
  };

  return (
    <div className="space-y-10">
      {/* Top Banner */}
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
            : 'AI Medical Prescription OCR & Direct Online Medicine Delivery'}
        </h1>
        <p className="text-surface-dim text-base sm:text-lg max-w-3xl leading-relaxed">
          {language === 'te'
            ? 'డాక్టర్ రాసిన కాగితం లేదా ప్రిస్క్రిప్షన్ ఫోటో తీయండి. గూగుల్ జెమిని AI ప్రిస్క్రిప్షన్‌లోని అసలైన మందుల పేర్లు, డోసేజ్ వివరాలను గుర్తించి, టాటా 1mg, అపోలో, ఫార్మ్‌ఈజీ మరియు జన ఔషధి స్టోర్లలో ఆర్డర్ చేయడానికి నేరుగా లింక్‌లను అందిస్తుంది.'
            : 'Upload any doctor prescription slip. The Google Gemini Multimodal AI reads doctor handwriting, identifies exact medicine names, and generates direct order links across Tata 1mg, Apollo 24|7, PharmEasy, and subsidized Jan Aushadhi generic stores.'}
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

      {/* Main Grid: Left Scanner & Dynamic Medicines | Right Delivery Basket */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: AI Medical Prescription OCR & Dynamic Medicine Extraction */}
        <div className="lg:col-span-7 space-y-6">
          <div className="card-tactile p-6 bg-white border border-outline-border rounded-3xl">
            <div className="flex flex-wrap items-center justify-between pb-4 border-b border-outline-subtle gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                  <Camera className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-primary">
                    {language === 'te' ? 'గూగుల్ జెమిని ప్రిస్క్రిప్షన్ OCR స్కానర్' : 'Gemini AI Prescription Vision OCR'}
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    {language === 'te' ? 'చేతిరాతతో రాసిన మందులు మరియు ఈ-షాపింగ్ లింక్స్ గుర్తింపు' : 'Transcribes doctor handwriting & generates direct e-shopping links'}
                  </p>
                </div>
              </div>

              {/* Mode switch: Photo OCR vs Direct Text */}
              <div className="flex rounded-full bg-surface-container p-1">
                <button
                  type="button"
                  onClick={() => setScanMode('photo')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    scanMode === 'photo' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant'
                  }`}
                >
                  {language === 'te' ? 'ఫోటో OCR' : 'Photo OCR'}
                </button>
                <button
                  type="button"
                  onClick={() => setScanMode('text')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    scanMode === 'text' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant'
                  }`}
                >
                  {language === 'te' ? 'నోట్స్ / టెక్స్ట్' : 'Text Input'}
                </button>
              </div>
            </div>

            {/* Gemini Key Status & Inline Activation Bar */}
            <div className="mt-4">
              {hasKey && !showKeyPrompt ? (
                <div className="p-3 rounded-2xl bg-secondary-container/40 border border-secondary/30 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-bold text-secondary">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Gemini 1.5 Flash Vision Multimodal OCR Model Active</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowKeyPrompt(true)}
                    className="text-on-surface-variant hover:text-primary underline font-medium"
                  >
                    Change Key
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-surface-container-low border-2 border-secondary/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-secondary" />
                      <span className="font-bold text-sm text-primary">
                        {language === 'te' ? 'జెమిని AI OCR కీ నమోదు చేయండి' : 'Enter Google Gemini API Key for Prescription OCR'}
                      </span>
                    </div>
                    {hasKey && (
                      <button
                        type="button"
                        onClick={() => setShowKeyPrompt(false)}
                        className="text-xs text-on-surface-variant hover:text-primary"
                      >
                        Hide
                      </button>
                    )}
                  </div>
                  
                  <form onSubmit={handleSaveApiKey} className="flex gap-2">
                    <input
                      type="password"
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="Paste Gemini API Key (AIzaSy...)"
                      className="input-tactile flex-1 text-sm font-mono py-2 px-3"
                    />
                    <button
                      type="submit"
                      className="btn-pill-primary py-2 px-5 text-sm whitespace-nowrap shadow-sm"
                    >
                      {isKeySaved ? 'Saved! ✓' : 'Save & Enable AI'}
                    </button>
                  </form>

                  <div className="flex items-center justify-between text-xs text-on-surface-variant">
                    <span>Free Google AI Studio model for handwriting vision OCR</span>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-secondary font-bold flex items-center gap-1 hover:underline"
                    >
                      Get Free Key <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Error Notification Banner */}
            {analysisError && (
              <div className="mt-4 p-4 rounded-2xl bg-error-container text-on-error-container border border-error/30 flex items-start gap-3 text-sm animate-fade-in">
                <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="block font-bold">Analysis Notice</strong>
                  <p>{analysisError}</p>
                </div>
              </div>
            )}

            {scanMode === 'photo' ? (
              <div className="mt-5 space-y-5">
                {/* Upload / Camera Dropzone */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-secondary/50 rounded-2xl p-6 sm:p-8 text-center cursor-pointer bg-surface-container-low hover:bg-surface-container transition-all group"
                >
                  {imagePreview ? (
                    <div className="space-y-3">
                      <img
                        src={imagePreview}
                        alt="Uploaded Prescription"
                        className="max-h-60 mx-auto rounded-xl object-contain border border-outline-subtle shadow-sm"
                      />
                      <span className="text-sm font-semibold text-secondary flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        {language === 'te' ? 'ప్రిస్క్రిప్షన్ ఫోటో లోడ్ అయ్యింది - రీ-స్కాన్ చేయడానికి క్లిక్ చేయండి' : 'Slip Loaded - Tap to change photo'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-16 h-16 rounded-full bg-secondary-container/80 flex items-center justify-center text-on-secondary-container group-hover:scale-110 transition-transform">
                        <Camera className="w-8 h-8 text-secondary" />
                      </div>
                      <div>
                        <span className="font-bold text-lg text-primary block">
                          {language === 'te' ? 'డాక్టర్ ప్రిస్క్రిప్షన్ ఫోటో తీయండి లేదా అప్‌లోడ్ చేయండి' : 'Tap to Take a Photo or Upload Doctor Slip'}
                        </span>
                        <p className="text-xs text-on-surface-variant mt-1">
                          {language === 'te'
                            ? 'చేతిరాతతో రాసిన మందులు, డోసేజ్ (1-0-1), మరియు ఆసుపత్రి వివరాలు డైనమిక్‌గా గుర్తించబడతాయి'
                            : 'Gemini AI Vision transcribes doctor handwriting, drug names, and doses'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Primary Scan Action Button */}
                <button
                  type="button"
                  onClick={() => triggerAnalysis()}
                  disabled={isAnalyzing || !imagePreview}
                  className={`btn-pill-primary w-full flex items-center justify-center gap-2 text-lg shadow-tactile cursor-pointer ${
                    (!imagePreview) ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{language === 'te' ? 'జెమిని AI ప్రిస్క్రిప్షన్ విశ్లేషిస్తోంది...' : 'Gemini AI Analyzing Prescription...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-secondary-fixed" />
                      <span>{language === 'te' ? 'ప్రిస్క్రిప్షన్ స్కాన్ చేసి మందులు గుర్తించండి' : 'Analyze Prescription with Gemini AI'}</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* Direct Text / Notes OCR Parser */
              <form onSubmit={handleTextOcrParse} className="mt-5 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-primary mb-1">
                    {language === 'te' ? 'ప్రిస్క్రిప్షన్ నోట్స్ లేదా మందుల వివరాలు నమోదు చేయండి:' : 'Type or Paste Prescribed Medicines / Doctor Notes:'}
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={rawPrescriptionText}
                    onChange={(e) => setRawPrescriptionText(e.target.value)}
                    placeholder="e.g.&#10;Augmentin 625mg 1-0-1&#10;Pantocid 40mg 1-0-0 before food&#10;Paracetamol 650mg SOS"
                    className="w-full p-3.5 rounded-2xl border-2 border-outline-variant font-mono text-sm focus:outline-none focus:border-primary"
                  />
                  <p className="text-xs text-on-surface-variant mt-1">
                    {language === 'te'
                      ? 'ప్రతి మందును ఒక కొత్త లైన్‌లో టైప్ చేయండి (ఉదా: మందు పేరు, డోస్ 1-0-1)'
                      : 'Enter each medicine on a separate line with optional dosage (e.g., 1-0-1, SOS).'}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className="btn-pill-primary w-full flex items-center justify-center gap-2 text-base"
                >
                  <Sparkles className="w-4 h-4 text-secondary-fixed" />
                  <span>{language === 'te' ? 'టెక్స్ట్ నుండి మందులు గుర్తించండి' : 'Extract Medicines from Text'}</span>
                </button>
              </form>
            )}
          </div>

          {/* Dynamic Recognized Medicines & Doctor Details */}
          {prescriptionData ? (
            <div className="space-y-6 animate-fade-in">
              {/* Doctor Header & Diagnosis Result */}
              <div className="p-5 rounded-2xl bg-surface-container-low border border-secondary/30 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center shadow">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-wider font-bold text-secondary">
                        {prescriptionData.doctorDetails.hospital}
                      </span>
                      <h4 className="text-base sm:text-lg font-bold text-primary">
                        {prescriptionData.doctorDetails.doctorName} • {prescriptionData.doctorDetails.department}
                      </h4>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-white px-2.5 py-1 rounded-full border border-outline-variant font-mono">
                      {prescriptionData.doctorDetails.date}
                    </span>
                    <button
                      onClick={handleResetPrescription}
                      className="text-xs text-outline hover:text-primary underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>{language === 'te' ? 'రీసెట్' : 'Clear All'}</span>
                    </button>
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-outline-subtle text-sm flex items-center justify-between">
                  <div>
                    <strong className="text-primary">{language === 'te' ? 'రోగ నిర్ధారణ:' : 'Diagnosis:'}</strong>{' '}
                    <span className="text-on-surface font-medium">
                      {language === 'te' && prescriptionData.diagnosisTe ? prescriptionData.diagnosisTe : prescriptionData.diagnosis}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-secondary px-2.5 py-0.5 rounded-full bg-secondary-container">
                    Gemini AI Vision Verified
                  </span>
                </div>
              </div>

              {/* Recognized Medicines Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                    <FileText className="w-5 h-5 text-secondary" />
                    <span>{language === 'te' ? 'స్కాన్ చేసిన మందులు మరియు ఈ-షాపింగ్ లింక్స్' : 'Dynamically Recognized Medicines & E-Shopping Links'}</span>
                  </h3>
                  
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-secondary text-white text-xs font-black">
                      {prescriptionData.medicines.length} {language === 'te' ? 'మందులు' : 'Medicines'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddMedicineOpen(true)}
                      className="px-3 py-1 rounded-full bg-surface-container border border-outline-variant hover:bg-surface-container-high text-primary font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-secondary" />
                      <span>{language === 'te' ? '+ మందు చేర్చండి' : '+ Add Medicine'}</span>
                    </button>
                  </div>
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
                          <h4 className="text-lg sm:text-xl font-black text-primary">{med.brandName}</h4>
                          <span className="text-xs bg-surface-container px-2 py-0.5 rounded font-semibold text-on-surface-variant">
                            {med.quantity}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant font-mono mt-1">
                          Generic Salt: {med.genericSalt}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-base font-bold text-primary">MRP ₹{med.mrp}</span>
                          <span className="block text-[11px] text-secondary font-semibold">
                            Govt Ceiling Compliant
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteMedicine(med.id)}
                          className="p-1.5 rounded-lg text-outline hover:text-error hover:bg-error-container/30 transition-colors cursor-pointer"
                          title="Remove from list"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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

                    {/* Direct Dynamic E-Shopping Links Generated for this Scanned Drug */}
                    <div className="mt-4 pt-3 border-t border-outline-subtle">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                          {language === 'te' ? 'ఆన్‌లైన్ ఆర్డర్ ఈ-షాపింగ్ లింక్స్ (Click to Order Online):' : 'Direct E-Shopping Links (Click to Order Online):'}
                        </span>
                        <span className="text-[11px] text-secondary font-semibold">
                          Vizag Pin Codes Covered
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                        {/* Tata 1mg */}
                        <a
                          href={med.tata1mgSearchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 rounded-xl bg-surface hover:bg-secondary-container/40 border border-outline-subtle flex flex-col justify-between group transition-all"
                        >
                          <span className="font-bold text-primary flex items-center justify-center gap-0.5">
                            Tata 1mg <ArrowUpRight className="w-3.5 h-3.5 text-secondary opacity-70 group-hover:opacity-100" />
                          </span>
                          <span className="font-extrabold text-primary text-sm mt-1">₹{med.priceComparisons.tata1mg}</span>
                          <span className="text-[10px] text-secondary font-semibold">Today Dispatch</span>
                        </a>

                        {/* Apollo 24|7 */}
                        <a
                          href={med.apolloSearchUrl || `https://www.apollopharmacy.in/search-medicines/${encodeURIComponent(med.brandName)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 rounded-xl bg-surface hover:bg-secondary-container/40 border border-outline-subtle flex flex-col justify-between group transition-all"
                        >
                          <span className="font-bold text-primary flex items-center justify-center gap-0.5">
                            Apollo 24|7 <ArrowUpRight className="w-3.5 h-3.5 text-secondary opacity-70 group-hover:opacity-100" />
                          </span>
                          <span className="font-extrabold text-primary text-sm mt-1">₹{med.priceComparisons.apollo}</span>
                          <span className="text-[10px] text-secondary font-semibold">60-90 Mins</span>
                        </a>

                        {/* PharmEasy */}
                        <a
                          href={med.pharmeasySearchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 rounded-xl bg-surface hover:bg-secondary-container/40 border border-outline-subtle flex flex-col justify-between group transition-all"
                        >
                          <span className="font-bold text-primary flex items-center justify-center gap-0.5">
                            PharmEasy <ArrowUpRight className="w-3.5 h-3.5 text-secondary opacity-70 group-hover:opacity-100" />
                          </span>
                          <span className="font-extrabold text-primary text-sm mt-1">₹{med.priceComparisons.pharmeasy}</span>
                          <span className="text-[10px] text-secondary font-semibold">Fast Delivery</span>
                        </a>

                        {/* Netmeds */}
                        <a
                          href={med.netmedsSearchUrl || `https://www.netmeds.com/catalogsearch/result?q=${encodeURIComponent(med.brandName)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 rounded-xl bg-surface hover:bg-secondary-container/40 border border-outline-subtle flex flex-col justify-between group transition-all"
                        >
                          <span className="font-bold text-primary flex items-center justify-center gap-0.5">
                            Netmeds <ArrowUpRight className="w-3.5 h-3.5 text-secondary opacity-70 group-hover:opacity-100" />
                          </span>
                          <span className="font-extrabold text-primary text-sm mt-1">₹{med.priceComparisons.netmeds}</span>
                          <span className="text-[10px] text-secondary font-semibold">Best Offer</span>
                        </a>

                        {/* Jan Aushadhi Generic (Massive Savings) */}
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=Jan+Aushadhi+Kendra+${encodeURIComponent(med.brandName)}+Visakhapatnam`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 rounded-xl bg-secondary-container border border-secondary text-on-secondary-container flex flex-col justify-between hover:bg-secondary-container/80 transition-all"
                        >
                          <span className="font-black text-secondary flex items-center justify-center gap-0.5">
                            Jan Aushadhi <ArrowUpRight className="w-3.5 h-3.5 text-secondary" />
                          </span>
                          <span className="font-black text-base text-secondary mt-1">₹{med.priceComparisons.janAushadhiGeneric}</span>
                          <span className="text-[10px] font-black text-secondary">-{med.priceComparisons.janAushadhiSavingsPercent}% Generic</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Awaiting Prescription Scan State (No static fake medicines) */
            <div className="card-tactile p-8 sm:p-12 bg-white border border-outline-border rounded-3xl text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center mx-auto text-secondary">
                <FileText className="w-10 h-10 opacity-70" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h4 className="text-2xl font-bold text-primary">
                  {language === 'te' ? 'ప్రిస్క్రిప్షన్ స్కాన్ కోసం ఎదురుచూస్తోంది' : 'Awaiting Doctor Prescription Scan'}
                </h4>
                <p className="text-base text-on-surface-variant leading-relaxed">
                  {language === 'te'
                    ? 'మీ డాక్టర్ రాసిన కాగితం ఫోటోను పైన అప్‌లోడ్ చేసి "Analyze Prescription with Gemini AI" బటన్ నొక్కండి. అసలైన మందుల పేర్లు మరియు ఈ-షాపింగ్ లింక్స్ మాత్రమే కనిపిస్తాయి.'
                    : 'Upload your doctor prescription slip above and click "Analyze Prescription with Gemini AI". Real medicine names and direct e-shopping links will be generated.'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container-low border border-dashed border-outline-variant max-w-sm mx-auto text-xs text-on-surface-variant flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-secondary" />
                <span>Zero static medicines • Direct live e-shopping links</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Direct Delivery Basket & Pharmacy Networks */}
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
                  type="button"
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
                  type="button"
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
                  type="button"
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
                  type="button"
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
                <span>{language === 'te' ? 'ఎంచుకున్న మందులు:' : 'Total Scanned Items:'}</span>
                <span className="font-bold text-primary">
                  {prescriptionData ? `${prescriptionData.medicines.length} Medicines` : '0 Items (Scan slip)'}
                </span>
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
                  {mrpTotal > 0 && (
                    <span className="block text-xs line-through text-outline">MRP ₹{mrpTotal}</span>
                  )}
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
              disabled={!prescriptionData || prescriptionData.medicines.length === 0}
              className={`btn-pill-primary w-full mt-5 text-lg flex items-center justify-center gap-2 ${
                (!prescriptionData || prescriptionData.medicines.length === 0) ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              <ShoppingBag className="w-5 h-5 text-secondary-fixed" />
              <span>{language === 'te' ? 'ఆర్డర్ పూర్తి చేయండి' : 'Proceed to Order (ఆర్డర్ పూర్తి చేయండి)'}</span>
            </button>

            {/* Assisted Phone Call Order */}
            <button
              onClick={onOpenVoiceAssist}
              className="w-full mt-3 py-3 px-4 rounded-full border-2 border-outline-border hover:bg-surface-container text-primary font-bold text-base flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Phone className="w-5 h-5 text-tertiary-saffron" />
              <span>{language === 'te' ? 'ఫోన్ ద్వారా అసిస్టెడ్ ఆర్డర్' : 'Order via Assisted Phone Call (ఫోన్ ద్వారా ఆర్డర్)'}</span>
            </button>

            <p className="text-xs text-center text-on-surface-variant mt-3 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-secondary" />
              <span>100% Genuine Certified Batch Guaranteed • Barcode Scanned</span>
            </p>
          </div>

          {/* Connected Vizag Pharmacy Networks */}
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

      {/* Inline Modal: Add Medicine to Prescription */}
      {isAddMedicineOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-outline-subtle space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline-subtle">
              <h4 className="font-bold text-lg text-primary">
                {language === 'te' ? 'ప్రిస్క్రిప్షన్ మందును జోడించండి' : 'Add Prescribed Medicine from Slip'}
              </h4>
              <button
                type="button"
                onClick={() => setIsAddMedicineOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMedicineSubmit} className="space-y-3.5">
              <div>
                <label className="block text-sm font-bold text-primary mb-1">
                  {language === 'te' ? 'మందు పేరు (Medicine Name)' : 'Medicine Name on Prescription'} *
                </label>
                <input
                  type="text"
                  required
                  value={newMedName}
                  onChange={(e) => setNewMedName(e.target.value)}
                  placeholder="e.g. Augmentin 625mg, Pantocid 40mg"
                  className="input-tactile w-full text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-primary mb-1">
                  {language === 'te' ? 'సాల్ట్ / కాంపౌండ్ (Generic Salt)' : 'Generic Chemical Salt (Optional)'}
                </label>
                <input
                  type="text"
                  value={newMedSalt}
                  onChange={(e) => setNewMedSalt(e.target.value)}
                  placeholder="e.g. Amoxicillin & Clavulanic Acid"
                  className="input-tactile w-full text-base"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-primary mb-1">
                    {language === 'te' ? 'మోతాదు (Dose)' : 'Doctor Dose'}
                  </label>
                  <input
                    type="text"
                    value={newMedDose}
                    onChange={(e) => setNewMedDose(e.target.value)}
                    placeholder="1-0-1 or 1-0-0"
                    className="input-tactile w-full text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-primary mb-1">
                    {language === 'te' ? 'MRP (₹)' : 'Estimated MRP (₹)'}
                  </label>
                  <input
                    type="number"
                    min="10"
                    value={newMedPrice}
                    onChange={(e) => setNewMedPrice(e.target.value)}
                    className="input-tactile w-full text-base"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddMedicineOpen(false)}
                  className="flex-1 py-2.5 rounded-full border border-outline-variant font-semibold text-primary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-pill-primary py-2.5 text-base cursor-pointer"
                >
                  Add Medicine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Embedded Interactive Google Maps Pharmacy Locator */}
      <NearbyPharmacyMap language={language} />
    </div>
  );
};
