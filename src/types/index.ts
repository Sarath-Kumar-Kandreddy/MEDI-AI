export type Language = 'en' | 'te';

export interface CitizenProfile {
  id: string;
  fullName: string;
  nameTe: string;
  age: number;
  yearOfBirth?: number;
  gender: 'Male' | 'Female' | 'Other';
  maskedAadhaar: string;
  aadhaarCardId?: string;
  locality: string;
  rationCategory: 'BPL White Card' | 'Pink Card' | 'AP BPL Card' | 'General';
  chronicIllnessFlags: string[];
  recommendedHospital?: string;
  recommendedDepartment?: string;
  slotQueueToken?: string;
  consultationStatus?: 'Done' | 'Consulted' | 'Slot Confirmed' | 'Queue 4' | 'Queue 2' | 'Queue 1' | 'Inpatient';
}

export interface Scheme {
  id: string;
  name: string;
  nameTe: string;
  badge: string;
  badgeTe: string;
  isEligible: boolean;
  summary: string;
  summaryTe: string;
  empanelledHospitals: string[];
  directConsultationDepartment: string;
  recommendedHospital: string;
  benefits?: string[];
}

export interface PriceComparison {
  tata1mg: number;
  apollo: number;
  pharmeasy: number;
  netmeds: number;
  janAushadhiGeneric: number;
  janAushadhiSavingsPercent: number;
}

export interface Medicine {
  id: string;
  brandName: string;
  genericSalt: string;
  quantity: string;
  doctorDose: string;
  frequency: string;
  timing: string;
  duration: string;
  seniorInstructionsEn: string;
  seniorInstructionsTe: string;
  mrp: number;
  priceComparisons: PriceComparison;
  pharmeasySearchUrl: string;
  tata1mgSearchUrl: string;
  apolloSearchUrl?: string;
  netmedsSearchUrl?: string;
}

export interface DoctorDetails {
  doctorName: string;
  hospital: string;
  date: string;
  department: string;
}

export interface PrescriptionResult {
  doctorDetails: DoctorDetails;
  diagnosis: string;
  diagnosisTe?: string;
  medicines: Medicine[];
  dietaryAdvice: string;
  dietaryAdviceTe?: string;
  summaryTe: string;
  summaryEn?: string;
  has503Warning?: boolean;
  prescriptionImageUri?: string;
}

export interface OPDToken {
  id: string;
  tokenNumber: string;
  patientName: string;
  patientNameTe?: string;
  age: number;
  hospital: string;
  department: string;
  timeSlot: string;
  aarogyasriNumber: string;
  locality: string;
  nowServing: string;
  estimatedWaitMins: number;
  patientsAhead: number;
  status: 'Active OPD' | 'Consulted' | 'In Consultation' | 'Called';
  roomNumber?: string;
  createdAt: string;
}

export interface PharmacyStore {
  id: string;
  name: string;
  address: string;
  locality: string;
  lat: number;
  lng: number;
  distanceKm?: number;
  phone: string;
  type: 'Jan Aushadhi' | 'Apollo 24/7' | 'Tata 1mg Hub' | 'Local Retail Pharmacy' | 'MedPlus';
  isGenericSubsidy: boolean;
  discountBadge: string;
  openHours: string;
  isOpen: boolean;
  googleMapsUrl: string;
}

export interface HospitalNode {
  id: string;
  name: string;
  nameTe: string;
  address: string;
  locality: string;
  lat: number;
  lng: number;
  phone: string;
  aarogyasriDesks: number;
  hasEmergencyICU: boolean;
  activeSpecialties: string[];
}

