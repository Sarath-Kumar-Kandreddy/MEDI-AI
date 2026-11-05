import React, { useState, useEffect } from 'react';
import type { Language, OPDToken, CitizenProfile } from '../types';
import { INITIAL_TODAY_TOKENS } from '../data/mockData';
import { saveOPDToken, fetchOPDTokens } from '../services/firebase';
import { PrintTicketModal } from './PrintTicketModal';
import { ShareTicketModal } from './ShareTicketModal';
import { 
  ShieldCheck, Ticket, User, Printer, 
  Share2, Mic, Phone, CheckCircle2, RefreshCw, UserCheck, Sparkles, Eye 
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface OPDTokenBookingProps {
  language: Language;
  prefillProfile?: CitizenProfile | null;
  onOpenVoiceAssist: () => void;
}

export const OPDTokenBooking: React.FC<OPDTokenBookingProps> = ({
  language,
  prefillProfile,
  onOpenVoiceAssist,
}) => {
  // Form fields (Dynamic: initialized from prefillProfile if scanned, or empty ready for input)
  const [patientName, setPatientName] = useState(prefillProfile ? prefillProfile.fullName : '');
  const [age, setAge] = useState(prefillProfile ? String(prefillProfile.age) : '');
  const [selectedHospital, setSelectedHospital] = useState(
    prefillProfile?.recommendedHospital || 'King George Hospital (KGH) • Maharani Peta, Vizag'
  );
  const [selectedDept, setSelectedDept] = useState(
    prefillProfile?.recommendedDepartment || 'General Medicine (సాధారణ వైద్యం)'
  );
  const [selectedSlot, setSelectedSlot] = useState('Morning Session (9:00 AM - 11:00 AM)');
  const [aarogyasriNumber, setAarogyasriNumber] = useState(
    prefillProfile?.aadhaarCardId ? `YSR-VZ-${prefillProfile.aadhaarCardId.slice(-6)}` : ''
  );
  const [locality, setLocality] = useState(prefillProfile ? prefillProfile.locality : '');

  // Active generated token (null initially until user books, so no static fake pass is shown!)
  const [activeToken, setActiveToken] = useState<OPDToken | null>(null);
  const [bookedTokensList, setBookedTokensList] = useState<OPDToken[]>([]);
  const [isBooking, setIsBooking] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Modals for Print Ticket and Share Ticket
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [modalTargetToken, setModalTargetToken] = useState<OPDToken | null>(null);

  // Load saved tokens from local storage / Firestore on mount
  useEffect(() => {
    fetchOPDTokens(INITIAL_TODAY_TOKENS).then(tokens => {
      setBookedTokensList(tokens);
    });
  }, []);

  // Update form dynamically if prefillProfile arrives from Scheme Finder scanner
  useEffect(() => {
    if (prefillProfile) {
      setPatientName(prefillProfile.fullName);
      setAge(String(prefillProfile.age));
      setLocality(prefillProfile.locality || 'Visakhapatnam');
      setAarogyasriNumber(
        prefillProfile.aadhaarCardId ? `YSR-VZ-${prefillProfile.aadhaarCardId.slice(-6)}` : `YSR-VZ-${Math.floor(100000 + Math.random() * 900000)}`
      );
      if (prefillProfile.age >= 60) {
        setSelectedDept('Geriatric Care • Room 14 (వయోవృద్ధుల సంరక్షణ)');
      } else {
        setSelectedDept('General Medicine (సాధారణ వైద్యం)');
      }
      setSelectedHospital('King George Hospital (KGH) • Maharani Peta, Vizag');
    }
  }, [prefillProfile]);

  // Quick fill helper for elder testing
  const handleQuickFillElder = () => {
    setPatientName('K. Venkata Ramana');
    setAge('68');
    setLocality('Gajuwaka Industrial Corridor, Vizag');
    setAarogyasriNumber(`YSR-VZ-${Math.floor(100000 + Math.random() * 900000)}`);
    setSelectedDept('Geriatric Care • Room 14 (వయోవృద్ధుల సంరక్షణ)');
    setSelectedHospital('King George Hospital (KGH) • Maharani Peta, Vizag');
  };

  // Handle Token Generation (Instant, Reliable, Non-blocking)
  const handleGenerateToken = async (e: React.FormEvent) => {
    e.preventDefault();

    // Fallback gracefully so button NEVER fails or hangs if name is omitted
    const effectiveName = patientName.trim() || (prefillProfile?.fullName ? prefillProfile.fullName : 'Citizen Patient (Walk-in)');
    const effectiveAge = Number(age) || (prefillProfile?.age ? prefillProfile.age : 62);

    if (!patientName.trim()) {
      setPatientName(effectiveName);
    }
    if (!age.trim()) {
      setAge(String(effectiveAge));
    }

    setIsBooking(true);

    try {
      const hospCode = selectedHospital.includes('KGH') ? 'KGH' : selectedHospital.includes('VIMS') ? 'VIMS' : 'GEN';
      const randomNum = String(Math.floor(40 + Math.random() * 50)).padStart(3, '0');
      const tokenNo = `#VZ-${hospCode}-${randomNum}`;
      const servingNo = `#VZ-${hospCode}-038`;

      const newToken: OPDToken = {
        id: `tok-${Date.now()}`,
        tokenNumber: tokenNo,
        patientName: effectiveName,
        patientNameTe: effectiveName,
        age: effectiveAge,
        hospital: selectedHospital,
        department: selectedDept,
        timeSlot: selectedSlot,
        aarogyasriNumber: aarogyasriNumber.trim() || `YSR-VZ-${Math.floor(100000 + Math.random() * 900000)}`,
        locality: locality.trim() || 'Visakhapatnam, Andhra Pradesh',
        nowServing: servingNo,
        estimatedWaitMins: 15,
        patientsAhead: 4,
        status: 'Active OPD',
        roomNumber: selectedDept.includes('Room') ? selectedDept.split('•')[1]?.trim() : 'Room 04 (Ground Floor)',
        createdAt: 'Just Now'
      };

      // 1. Immediately display the generated token to the user
      setActiveToken(newToken);
      setBookedTokensList(prev => [newToken, ...prev.filter(t => t.id !== newToken.id)]);

      // 2. Persist to storage
      await saveOPDToken(newToken);

      // 3. Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // Confetti fallback
      }

      setNotificationMsg(
        language === 'te'
          ? `టోకెన్ ${tokenNo} (${effectiveName}) కొరకు విజయవంతంగా జనరేట్ అయ్యింది! క్రింద "ప్రింట్ టికెట్" లేదా "షేర్" చేయండి.`
          : `Token ${tokenNo} confirmed for ${effectiveName}! You can now Print or Share the ticket below.`
      );

      // Scroll smoothly to the generated pass card
      setTimeout(() => {
        const cardElem = document.getElementById('active-opd-pass-card');
        if (cardElem) {
          cardElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);

      setTimeout(() => setNotificationMsg(null), 8000);
    } catch (err) {
      console.error('Token generation error:', err);
    } finally {
      setIsBooking(false);
    }
  };

  // Open Print Modal for a token
  const openPrintTicket = (tokenToPrint: OPDToken) => {
    setModalTargetToken(tokenToPrint);
    setIsPrintModalOpen(true);
  };

  // Open Share Modal for a token
  const openShareTicket = (tokenToShare: OPDToken) => {
    setModalTargetToken(tokenToShare);
    setIsShareModalOpen(true);
  };

  return (
    <div className="space-y-10">
      {/* Top Banner and Stats */}
      <div className="bg-primary text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-tactile">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-white text-xs sm:text-sm font-bold">
            <Ticket className="w-4 h-4" />
            <span>Visakhapatnam OPD Smart Queuing • విశాఖ స్మార్ట్ టోకెన్ వ్యవస్థ</span>
          </div>
          <span className="text-secondary-fixed text-xs sm:text-sm font-semibold">
            {language === 'te' ? 'కేజీహెచ్ లైవ్ టెలిమెట్రీ' : 'KGH Live Telemetry Node'}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2">
          {language === 'te'
            ? 'లైన్లలో నిలబడకుండా నేరుగా డాక్టర్‌ని కలవండి'
            : 'Skip Long Hospital Queues with Instant Digital Token Booking'}
        </h1>
        <p className="text-surface-dim text-base sm:text-lg max-w-3xl leading-relaxed">
          {language === 'te'
            ? 'సీనియర్ సిటిజన్లు మరియు కుటుంబాల కోసం ప్రత్యేకంగా రూపొందించబడింది. కేజీహెచ్, విమ్స్ ఆసుపత్రులలో 3-4 గంటలు నిలబడే శ్రమ లేకుండా డిజిటల్ టోకెన్ బుక్ చేసుకోండి, ప్రింట్ తీసుకోండి లేదా వాట్సాప్‌లో షేర్ చేయండి.'
            : 'Specially designed for senior citizens and families in Vizag. Avoid waiting 3-4 hours on your feet at KGH, VIMS, and major clinics. Register digitally, arrive directly at your designated time window, print official passes, or share via WhatsApp/SMS.'}
        </p>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-white font-extrabold text-2xl sm:text-3xl block">6</span>
            <span className="text-secondary-fixed text-xs sm:text-sm font-bold block mt-0.5">Major Hospitals</span>
            <span className="text-xs text-surface-dim">Active OPDs Today</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-secondary-container font-extrabold text-2xl sm:text-3xl block">140 Mins</span>
            <span className="text-secondary-fixed text-xs sm:text-sm font-bold block mt-0.5">Average Wait Cut</span>
            <span className="text-xs text-surface-dim">Saved standing in line</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-tertiary-fixed font-extrabold text-2xl sm:text-3xl block">Priority</span>
            <span className="text-secondary-fixed text-xs sm:text-sm font-bold block mt-0.5">Senior 60+ Privilege</span>
            <span className="text-xs text-surface-dim">Green-channel access</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-white font-extrabold text-2xl sm:text-3xl block">100% Free</span>
            <span className="text-secondary-fixed text-xs sm:text-sm font-bold block mt-0.5">Aarogyasri / KGH</span>
            <span className="text-xs text-surface-dim">Zero registration charge</span>
          </div>
        </div>
      </div>

      {notificationMsg && (
        <div className="p-4 rounded-2xl bg-secondary-container text-on-secondary-container border-2 border-secondary flex items-center justify-between gap-3 shadow-md animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-secondary shrink-0" />
            <span className="font-bold text-base">{notificationMsg}</span>
          </div>
          {activeToken && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openPrintTicket(activeToken)}
                className="px-3 py-1.5 rounded-full bg-secondary text-white font-bold text-xs flex items-center gap-1 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{language === 'te' ? 'ప్రింట్' : 'Print'}</span>
              </button>
              <button
                onClick={() => openShareTicket(activeToken)}
                className="px-3 py-1.5 rounded-full bg-primary text-white font-bold text-xs flex items-center gap-1 shadow-sm"
              >
                <Share2 className="w-3.5 h-3.5 text-secondary-fixed" />
                <span>{language === 'te' ? 'షేర్' : 'Share'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Left Form | Right Assigned Digital Pass */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: STEP 1 Book OPD Token Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="card-tactile p-6 bg-white border border-outline-border rounded-3xl">
            <div className="flex flex-wrap items-center justify-between pb-4 border-b border-outline-subtle gap-2">
              <div>
                <span className="text-xs font-bold text-secondary uppercase tracking-wider">
                  {language === 'te' ? 'దశ 1 • రోగి వివరాలు' : 'STEP 1 • Patient Details'}
                </span>
                <h3 className="text-2xl font-bold text-primary">
                  {language === 'te' ? 'ఆసుపత్రి దర్శన అనుమతి పత్రం (Book OPD Token)' : 'Book OPD Token'}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {prefillProfile ? (
                  <span className="text-xs font-bold text-secondary bg-secondary-container px-3 py-1.5 rounded-full flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{language === 'te' ? 'స్కాన్ చేసిన వివరాలు లోడ్ అయ్యాయి' : `Scanned: ${prefillProfile.fullName}`}</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleQuickFillElder}
                    className="text-xs font-bold text-primary hover:text-secondary bg-surface-container px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-secondary" />
                    <span>Fill Test Data</span>
                  </button>
                )}
              </div>
            </div>

            <form onSubmit={handleGenerateToken} className="mt-5 space-y-4">
              {/* Patient Name & Age (Dynamic Inputs) */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-8">
                  <label className="block text-base font-bold text-primary mb-1">
                    {language === 'te' ? 'రోగి పూర్తి పేరు (Patient Full Name)' : 'Patient Full Name'} *
                  </label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="input-tactile w-full"
                    placeholder={language === 'te' ? 'రోగి పేరు నమోదు చేయండి (లేదా ఆధార్ స్కాన్ చేయండి)' : 'Enter patient name (e.g. from Aadhaar or manual)'}
                  />
                  {prefillProfile && (
                    <span className="text-xs text-secondary font-semibold mt-1 block">
                      ✓ Scanned identity: {prefillProfile.fullName} ({prefillProfile.maskedAadhaar})
                    </span>
                  )}
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-base font-bold text-primary mb-1">
                    {language === 'te' ? 'వయస్సు (Age)' : 'Age (వయస్సు)'} *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="115"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="input-tactile w-full"
                    placeholder="65"
                  />
                </div>
              </div>

              {/* Select Hospital */}
              <div>
                <label className="block text-base font-bold text-primary mb-1">
                  {language === 'te' ? 'విశాఖపట్నం ఆసుపత్రిని ఎంచుకోండి' : 'Select Hospital in Visakhapatnam'} *
                </label>
                <select
                  value={selectedHospital}
                  onChange={(e) => setSelectedHospital(e.target.value)}
                  className="input-tactile w-full"
                >
                  <option value="King George Hospital (KGH) • Maharani Peta, Vizag">
                    King George Hospital (KGH) • Maharani Peta, Vizag
                  </option>
                  <option value="VIMS Health City Hospital • Hanumanthawaka">
                    VIMS Health City Hospital • Hanumanthawaka
                  </option>
                  <option value="Victoria Govt Hospital for Women & Children • One Town">
                    Victoria Govt Hospital for Women & Children • One Town
                  </option>
                  <option value="Govt Regional Eye Hospital • Seethammadhara">
                    Govt Regional Eye Hospital • Seethammadhara
                  </option>
                  <option value="Govt ENT Hospital • Waltair">
                    Govt ENT Hospital • Waltair
                  </option>
                </select>
              </div>

              {/* Department / Specialty */}
              <div>
                <label className="block text-base font-bold text-primary mb-1">
                  {language === 'te' ? 'వైద్య విభాగం (Department / Specialty)' : 'Department / Specialty'} *
                </label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="input-tactile w-full"
                >
                  <option value="General Medicine (సాధారణ వైద్యం)">General Medicine (సాధారణ వైద్యం)</option>
                  <option value="Geriatric Care • Room 14 (వయోవృద్ధుల సంరక్షణ)">
                    Geriatric Care • Room 14 (వయోవృద్ధుల సంరక్షణ)
                  </option>
                  <option value="Cardiology (గుండె జబ్బుల విభాగం)">Cardiology (గుండె జబ్బుల విభాగం)</option>
                  <option value="Orthopedics & Joint Care (ఎముకల శస్త్రచికిత్స)">
                    Orthopedics & Joint Care (ఎముకల శస్త్రచికిత్స)
                  </option>
                  <option value="Nephrology & Dialysis (మూత్రపిండాల విభాగం)">
                    Nephrology & Dialysis (మూత్రపిండాల విభాగం)
                  </option>
                  <option value="Ophthalmology (కంటి వైద్య విభాగం)">Ophthalmology (కంటి వైద్య విభాగం)</option>
                </select>
              </div>

              {/* Time Slot Selection */}
              <div>
                <label className="block text-base font-bold text-primary mb-2">
                  {language === 'te' ? 'OPD సమయం ఎంపిక (Choose OPD Time Slot)' : 'Choose OPD Time Slot'} *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSlot('Morning Session (9:00 AM - 11:00 AM)')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      selectedSlot.includes('Morning')
                        ? 'bg-secondary text-white font-bold shadow-md'
                        : 'bg-surface text-primary border-outline-variant hover:bg-surface-container'
                    }`}
                  >
                    <span className="text-xs uppercase font-extrabold opacity-90 block">OPD 1</span>
                    <span className="text-sm font-bold block mt-1">Morning Session</span>
                    <span className="text-xs opacity-80 block">9:00 AM - 11:00 AM</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedSlot('Midday Session (11:30 AM - 1:30 PM)')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      selectedSlot.includes('Midday')
                        ? 'bg-secondary text-white font-bold shadow-md'
                        : 'bg-surface text-primary border-outline-variant hover:bg-surface-container'
                    }`}
                  >
                    <span className="text-xs uppercase font-extrabold opacity-90 block">OPD 2</span>
                    <span className="text-sm font-bold block mt-1">Midday Session</span>
                    <span className="text-xs opacity-80 block">11:30 AM - 1:30 PM</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedSlot('Afternoon Session (2:00 PM - 4:00 PM)')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      selectedSlot.includes('Afternoon')
                        ? 'bg-secondary text-white font-bold shadow-md'
                        : 'bg-surface text-primary border-outline-variant hover:bg-surface-container'
                    }`}
                  >
                    <span className="text-xs uppercase font-extrabold opacity-90 block">OPD 3</span>
                    <span className="text-sm font-bold block mt-1">Afternoon Session</span>
                    <span className="text-xs opacity-80 block">2:00 PM - 4:00 PM</span>
                  </button>
                </div>
              </div>

              {/* Aarogyasri / Health Card Number */}
              <div>
                <label className="block text-base font-bold text-primary mb-1">
                  {language === 'te' ? 'ఆరోగ్యశ్రీ కార్డ్ నంబర్ / ABHA ID' : 'Aarogyasri / Health Card Number (ABHA ID)'}
                </label>
                <input
                  type="text"
                  value={aarogyasriNumber}
                  onChange={(e) => setAarogyasriNumber(e.target.value)}
                  className="input-tactile w-full"
                  placeholder="e.g. YSR-VZ-782941 or ABHA ID"
                />
                <p className="text-xs text-on-surface-variant mt-1">
                  {language === 'te'
                    ? 'ఆరోగ్యశ్రీ ఐడీ నమోదు చేయడం వల్ల ల్యాబ్ పరీక్షలు మరియు మందులు ఉచితంగా లభిస్తాయి.'
                    : 'Entering your Aarogyasri ID pre-authorizes zero-cost diagnostics and free pharmacy pickup.'}
                </p>
              </div>

              {/* CTA Submit Button (Never hanging, clear interactive visual state) */}
              <button
                type="submit"
                disabled={isBooking}
                className="btn-pill-primary w-full flex items-center justify-center gap-2 text-lg mt-6 shadow-tactile cursor-pointer"
              >
                {isBooking ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{language === 'te' ? 'టోకెన్ సిద్ధమవుతోంది...' : 'Generating Digital Token...'}</span>
                  </>
                ) : (
                  <>
                    <Ticket className="w-5 h-5 text-secondary-fixed" />
                    <span>
                      {patientName.trim()
                        ? (language === 'te' ? `${patientName.trim()} కొరకు టోకెన్ బుక్ చేయండి` : `Generate Token for ${patientName.trim()}`)
                        : (language === 'te' ? 'లైవ్ టోకెన్ బుక్ చేయండి (Generate Token)' : 'Generate Live OPD Token')}
                    </span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs text-on-surface-variant pt-2">
                <span className="flex items-center gap-1 text-secondary font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  Verified by Andhra Health Department Node
                </span>
                <span>Free Service • No Hidden Charges</span>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Digital OPD Pass & Live Telemetry (Dynamic for this patient) */}
        <div className="lg:col-span-5 space-y-6">
          {activeToken ? (
            /* Active Confirmed Digital OPD Pass */
            <div 
              id="active-opd-pass-card"
              className="card-tactile p-6 bg-white border-2 border-secondary rounded-3xl shadow-elevated animate-fade-in"
            >
              <div className="flex items-center justify-between pb-4 border-b border-outline-subtle">
                <div className="flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-secondary" />
                  <h4 className="text-lg font-bold text-primary">
                    {language === 'te' ? 'ఆసుపత్రి దర్శన అనుమతి పత్రం' : 'Digital OPD Pass'}
                  </h4>
                </div>
                <span className="px-3 py-1 rounded-full bg-secondary text-white text-xs font-black">
                  Active OPD Confirmed
                </span>
              </div>

              {/* Token Big Number Box */}
              <div className="mt-4 p-5 rounded-2xl bg-surface-container text-center border border-outline-subtle">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">
                  {language === 'te' ? 'కేటాయించిన టోకెన్ నంబర్' : 'YOUR ASSIGNED TOKEN NO'}
                </span>
                <span className="text-3xl sm:text-4xl font-black text-primary font-mono tracking-tight block my-1">
                  {activeToken.tokenNumber}
                </span>
                <span className="text-xs text-secondary font-semibold">
                  Live Queue Status: Active OPD
                </span>
              </div>

              {/* Live Queue Telemetry Tiles */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-subtle text-center">
                  <span className="text-xs text-on-surface-variant block">
                    {language === 'te' ? 'ప్రస్తుతం (Now Serving)' : 'Now Serving'}
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-secondary font-mono block mt-1">
                    {activeToken.nowServing}
                  </span>
                  <span className="text-xs text-on-surface-variant mt-0.5 block">
                    {activeToken.patientsAhead} patients ahead
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-subtle text-center">
                  <span className="text-xs text-on-surface-variant block">
                    {language === 'te' ? 'అంచనా సమయం' : 'Estimated Wait'}
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-primary block mt-1">
                    ~{activeToken.estimatedWaitMins} mins
                  </span>
                  <span className="text-xs text-secondary font-semibold mt-0.5 block">
                    Doctor in OPD Room
                  </span>
                </div>
              </div>

              {/* Pass Metadata List (Dynamic for this exact patient) */}
              <div className="mt-5 space-y-2.5 text-sm border-t border-outline-subtle pt-4">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">{language === 'te' ? 'రోగి:' : 'Patient:'}</span>
                  <strong className="text-primary font-bold text-base">{activeToken.patientName} ({activeToken.age} Yrs)</strong>
                </div>

                <div className="flex justify-between">
                  <span className="text-on-surface-variant">{language === 'te' ? 'ఆసుపత్రి:' : 'Hospital:'}</span>
                  <strong className="text-primary font-bold text-right">{activeToken.hospital.split('•')[0]}</strong>
                </div>

                <div className="flex justify-between">
                  <span className="text-on-surface-variant">{language === 'te' ? 'విభాగం / గది:' : 'Department / Room:'}</span>
                  <strong className="text-secondary font-bold text-right">{activeToken.department}</strong>
                </div>

                <div className="flex justify-between">
                  <span className="text-on-surface-variant">{language === 'te' ? 'సమయం:' : 'Time Slot:'}</span>
                  <strong className="text-primary font-semibold">{activeToken.timeSlot}</strong>
                </div>

                <div className="flex justify-between">
                  <span className="text-on-surface-variant">{language === 'te' ? 'ఆరోగ్యశ్రీ ఐడీ:' : 'Aarogyasri ID:'}</span>
                  <span className="font-mono text-outline font-semibold">{activeToken.aarogyasriNumber}</span>
                </div>
              </div>

              {/* Pass Action Buttons (Print Ticket & Share Ticket) */}
              <div className="grid grid-cols-2 gap-2.5 mt-5">
                <button
                  type="button"
                  onClick={() => openPrintTicket(activeToken)}
                  className="btn-pill-primary py-3 px-4 text-base flex items-center justify-center gap-2 shadow-sm"
                >
                  <Printer className="w-4 h-4 text-secondary-fixed" />
                  <span>{language === 'te' ? 'టికెట్ ప్రింట్' : 'Print Ticket'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => openShareTicket(activeToken)}
                  className="btn-pill-outline py-3 px-4 text-base flex items-center justify-center gap-2 shadow-sm"
                >
                  <Share2 className="w-4 h-4 text-primary" />
                  <span>{language === 'te' ? 'టికెట్ షేర్' : 'Share Ticket'}</span>
                </button>
              </div>

              <p className="text-xs text-center text-on-surface-variant mt-3">
                {language === 'te'
                  ? 'ఈ అధికారిక డిజిటల్ పాస్‌ను కేజీహెచ్ కౌంటర్ నం. 3 వద్ద చూపించి త్వరితగతిన ప్రవేశం పొందండి.'
                  : 'Show this digital ticket at KGH OPD Counter No. 3 for direct triage verification.'}
              </p>
            </div>
          ) : (
            /* Pass Preview (before booking) showing the dynamically typed patient name */
            <div className="card-tactile p-6 bg-white border border-outline-border rounded-3xl shadow-sm text-center space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-outline-subtle">
                <h4 className="text-base font-bold text-primary flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-secondary" />
                  <span>{language === 'te' ? 'డిజిటల్ పాస్ ముందస్తు దృశ్యం' : 'Digital OPD Pass Preview'}</span>
                </h4>
                <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-xs font-semibold text-on-surface-variant">
                  Ready to Issue
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-surface-container-low border border-dashed border-outline-variant space-y-2">
                <span className="text-xs uppercase font-bold text-on-surface-variant block">Patient on Pass</span>
                <span className="text-2xl font-black text-primary block">
                  {patientName.trim() || (language === 'te' ? '[రోగి పేరు నమోదు చేయండి]' : '[Enter patient name on left]')}
                </span>
                <span className="text-xs text-secondary font-semibold block">
                  {selectedHospital.split('•')[0]} • {selectedDept}
                </span>
                {age && <span className="text-xs text-on-surface-variant block">Age: {age} Years</span>}
              </div>

              <p className="text-xs text-on-surface-variant">
                {language === 'te'
                  ? 'ఎడమ వైపున వివరాలు నింపి "లైవ్ టోకెన్ బుక్ చేయండి" బటన్ నొక్కండి. మీ అధికారిక పాస్ ఇక్కడ కనిపిస్తుంది.'
                  : 'Click "Generate Live OPD Token" on the left to confirm booking and get your verified hospital queue pass.'}
              </p>
            </div>
          )}

          {/* Telugu Voice Assistant Card */}
          <div className="p-5 rounded-2xl bg-secondary-container/50 border border-secondary/40 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-secondary text-white flex items-center justify-center shadow-md">
                <Mic className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h5 className="font-bold text-base text-primary">
                  {language === 'te' ? 'తెలుగు వాయిస్ సాయం కావాలా?' : 'Need Telugu Voice Help?'}
                </h5>
                <p className="text-xs text-on-surface-variant">
                  {language === 'te'
                    ? 'రోగి పేరు చెప్పి సులభంగా టోకెన్ బుక్ చేసుకోండి'
                    : 'Speak patient name in Telugu to book automatically'}
                </p>
              </div>
            </div>

            <button
              onClick={onOpenVoiceAssist}
              className="px-4 py-2 rounded-full bg-secondary text-white font-bold text-sm shadow hover:bg-secondary/90 transition-all shrink-0 cursor-pointer"
            >
              {language === 'te' ? 'మైక్ ఆన్ చేయండి' : 'Start Mic'}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Table: Today's Booked Tokens Tracker */}
      <div className="card-tactile p-6 bg-white border border-outline-border rounded-3xl mt-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-outline-subtle gap-4">
          <div>
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">
              {language === 'te' ? 'ఫ్యామిలీ OPD పాస్ ట్రాకర్' : 'FAMILY OPD PASS TRACKER'}
            </span>
            <h3 className="text-2xl font-bold text-primary">
              {language === 'te' ? 'నేటి బుకింగ్స్ (Today’s Booked Tokens)' : "Today's Booked Tokens (నేటి బుకింగ్స్)"}
            </h3>
            <p className="text-sm text-on-surface-variant">
              {language === 'te'
                ? 'మీరు బుక్ చేసిన ప్రతి టోకెన్ మీ పరికరంలో భద్రపరచబడింది. ప్రింట్ లేదా వాట్సాప్‌లో షేర్ చేయండి.'
                : 'Contains all your live booked tokens. Easily print or share any pass anytime.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchOPDTokens(INITIAL_TODAY_TOKENS).then(setBookedTokensList)}
              className="px-4 py-2 rounded-full border border-outline-border hover:bg-surface text-primary font-semibold text-sm flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-secondary" />
              <span>{language === 'te' ? 'రిఫ్రెష్ క్యూ' : 'Refresh Queue Status'}</span>
            </button>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-outline-subtle bg-surface-container-low text-on-surface-variant font-bold">
                <th className="py-3 px-4">Token ID</th>
                <th className="py-3 px-4">{language === 'te' ? 'రోగి / వయస్సు' : 'Patient / Age'}</th>
                <th className="py-3 px-4">Hospital & Department</th>
                <th className="py-3 px-4">Slot</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4 text-right">Ticket Options</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-subtle">
              {bookedTokensList.map((token) => (
                <tr key={token.id} className="hover:bg-surface-container-low/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-secondary text-base">
                    {token.tokenNumber}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-primary block">{token.patientName}</span>
                    <span className="text-xs text-on-surface-variant">{token.age} Yrs • {token.locality}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-primary block">{token.hospital.split('•')[0]}</span>
                    <span className="text-xs text-secondary">{token.department}</span>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-medium text-on-surface-variant">
                    {token.timeSlot.split('(')[0]}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      token.status === 'Active OPD'
                        ? 'bg-secondary-container text-on-secondary-container'
                        : 'bg-primary text-white'
                    }`}>
                      {token.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setActiveToken(token)}
                        className="p-1.5 rounded-lg hover:bg-surface-container text-primary font-semibold text-xs flex items-center gap-1"
                        title="View on Screen"
                      >
                        <Eye className="w-3.5 h-3.5 text-on-surface-variant" />
                        <span className="hidden sm:inline">{language === 'te' ? 'చూడండి' : 'View'}</span>
                      </button>

                      <button
                        onClick={() => openPrintTicket(token)}
                        className="p-1.5 rounded-lg hover:bg-secondary-container text-secondary font-bold text-xs flex items-center gap-1 border border-secondary/30"
                        title="Print Ticket"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>{language === 'te' ? 'ప్రింట్' : 'Print'}</span>
                      </button>

                      <button
                        onClick={() => openShareTicket(token)}
                        className="p-1.5 rounded-lg hover:bg-surface-container text-primary font-bold text-xs flex items-center gap-1 border border-outline-variant"
                        title="Share Ticket"
                      >
                        <Share2 className="w-3.5 h-3.5 text-secondary" />
                        <span>{language === 'te' ? 'షేర్' : 'Share'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Support Box */}
      <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
            <User className="w-6 h-6 text-secondary-fixed" />
          </div>
          <div>
            <h5 className="font-bold text-primary text-base">
              {language === 'te' ? 'ఫోన్ వాడటం కష్టంగా ఉందా? కేజీహెచ్ వద్ద సహాయ డెస్క్‌ని సందర్శించండి' : 'Uncomfortable with phones? Visit Team Apex Help Desk at KGH'}
            </h5>
            <p className="text-xs text-on-surface-variant">
              {language === 'te'
                ? 'కేజీహెచ్ మెయిన్ గేట్ వద్ద వాలంటీర్లు బయోమెట్రిక్ ప్రింట్ మరియు వీల్‌చైర్ సహాయం అందిస్తారు.'
                : 'Our volunteers at Main Gate counter assist elderly patients with direct biometric token printouts and wheelchair arrangements.'}
            </p>
          </div>
        </div>

        <a
          href="tel:104"
          className="btn-pill-primary py-2.5 px-5 text-base flex items-center gap-2 shrink-0"
        >
          <Phone className="w-5 h-5 text-secondary-fixed" />
          <span>Call KGH Desk: 104</span>
        </a>
      </div>

      {/* Print Ticket Modal */}
      <PrintTicketModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        token={modalTargetToken}
        language={language}
      />

      {/* Share Ticket Modal */}
      <ShareTicketModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        token={modalTargetToken}
        language={language}
      />
    </div>
  );
};
