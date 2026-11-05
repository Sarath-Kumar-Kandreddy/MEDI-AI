# Arogya Bandhu (ఆరోగ్య బంధు) - MEDI AI Coastal Andhra Healthcare

An elder-friendly, bilingual healthcare and civic welfare application tailored for citizens and seniors navigating public healthcare, government welfare schemes, and hospital consultations in **Visakhapatnam, Andhra Pradesh**.

---

## 🌟 Key Capabilities

### 1. 🪪 AI Aadhaar & Age Eligibility Scanner (Scheme Finder)
- **Aadhaar OCR Scanner**: Powered by **Google Gemini API** (`gemini-1.5-flash`), analyzes uploaded photos or camera captures of patient Aadhaar/identity cards.
- **Demographic & Scheme Calculation**: Automatically calculates patient eligibility for key Andhra Pradesh health schemes:
  - **Dr. YSR Aarogyasri Cashless Care**: 100% cashless coverage across 3,257 procedures up to **₹25 Lakhs/year**.
  - **AP Senior Citizens Medical Grant & Pension Subsidy**: **₹4,000/month** DBT pension, free chronic medications, and zero-wait green-channel at KGH Room 14.
  - **AP Free Dialysis & Chronic Nephro Scheme**: 100% free lifelong dialysis cycles at KGH Super Speciality + **₹10,000/month** nutrition allowance.
  - **Dr. YSR Aarogya Asara Post-Op Allowance**: Up to ₹225/day during recovery.
- **Direct Next Move Flow**: One-click **"Book OPD Slot"** (`ఆసుపత్రి కన్సల్టేషన్ స్లాట్ బుక్ చేయండి`) seamlessly transitions the user to the OPD Token Booking screen with patient information pre-filled!

### 2. 📋 AI Medical Prescription OCR & Medicine Matcher
- **Multimodal Gemini Vision Analysis**: Deciphers doctor handwriting, hospital names (KGH, VIMS, Apollo, Care), and dosages (`1-0-1`, `1-0-0`, `0-0-1`, SOS).
- **Drug Dosage Guidance**: Provides clear, large-font dosage instructions in both **English and Telugu** tailored for senior citizens.
- **Direct E-Pharmacy Links**:
  - Clickable search links directly into **PharmEasy**, **Tata 1mg**, **Apollo 24|7**, and **Netmeds**.
  - **Jan Aushadhi Generic Alternative**: Highlights generic medicines with up to **80% - 85% price discount**.
- **Interactive Google Maps / Leaflet Pharmacy Locator**:
  - Automatically identifies nearby medical stores in Visakhapatnam based on user's **live GPS location** or selected locality (MVP Colony, Jagadamba, Maharani Peta/KGH, Dwaraka Nagar, Gajuwaka, Siripuram).
  - Displays distance in kilometers, operating hours, contact phone numbers, Jan Aushadhi generic badges, and one-click **Google Maps navigation links**.

### 3. 🎫 Visakhapatnam OPD Smart Queuing & Digital Token Booking
- **Skip Long Hospital Queues**: Eliminates 3–5 hours of early morning standing at King George Hospital (KGH) and VIMS.
- **Digital OPD Pass**: Instant pass generation (`#VZ-KGH-042`) with real-time queue telemetry (Now Serving, Estimated Wait, Room Number).
- **Offline Reliability & Local Storage**: Passes are stored locally on the citizen's device and synchronized with Cloud Firestore.
- **Telugu Voice Assistant**: Interactive speech recognition and speech synthesis allowing elderly citizens to speak patient names in Telugu to book consultations or order medicines automatically.

---

## 🎨 Design System & Accessibility

Built to strict **Tactile Humanism & Civic Clarity** design specifications:
- **Palette Architecture**:
  - Primary (`#0F2942` / `#001428`): Deep Oceanic Slate Navy
  - Secondary (`#0D9488` / `#10B981` / `#006A61`): Healing Emerald
  - Tertiary Accent (`#D97706` / `#F59E0B`): Warm Saffron-Amber
  - Surface & Canvas (`#F8F9FF` / `#F8FAFC`): Soft Pearl base eliminating glare
  - Error (`#BA1A1A`): High-visibility emergency crimson
- **Typography Floor**: Absolute minimum floor of **16px** across all contexts.
  - Headings: **Plus Jakarta Sans**
  - Body & Labels: **Atkinson Hyperlegible** (differentiates `I`, `l`, `1`, `O`, `0`)
  - Telugu Script: **Noto Sans Telugu** with **+20% line-height factor** to preserve vowel marks (maatras)
- **Soft Pill Geometry**: Minimum **56px × 56px** click/touch targets, `rounded-full` pills, `rounded-3xl` (24px) cards.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Leaflet, Canvas Confetti, Lucide Icons.
- **Backend / Cloud**: Firebase ecosystem:
  - **Cloud Firestore**: Real-time patient OPD passes, citizen directory, prescription records.
  - **Firebase Authentication & Storage**: Ready configuration in `src/services/firebase.ts`.
  - **Cloud Functions v2 (TypeScript)**: Fully written in `functions/src/index.ts`:
    - `analyzePrescription`: Server-side Gemini 1.5 Flash prescription OCR & e-pharmacy matching.
    - `analyzeAadhaarAndEligibility`: Aadhaar card extraction and AP scheme qualification.
    - `bookOPDToken`: Live token generation and queue position management.
- **AI Models**: Google Developer **Gemini API** (`gemini-1.5-flash` / `gemini-2.0-flash`).

---

## 🚀 Getting Started

### 1. Install & Run Frontend
```bash
# In project root
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 2. Configure Google Gemini API Key
- Click the **"Gemini Key"** pill button in the top navigation bar or set an environment variable:
```env
VITE_GEMINI_API_KEY=your_actual_gemini_api_key_here
```
> *Note: If no API key is provided, the application automatically runs in an authentic, high-fidelity offline simulation mode with pre-configured real Visakhapatnam patient cases.*

### 3. Build & Test Cloud Functions
```bash
cd functions
npm install
npm run build
```

---

## 🏛️ Official Visakhapatnam District Health Contacts
- **104**: Health Information Line (ఉచిత ఆరోగ్య సమాచార కేంద్రం)
- **108**: Emergency Ambulance (అత్యవసర అంబులెన్స్)
- **1800-425-1818**: Dr. YSR Aarogyasri Trust Toll-Free
