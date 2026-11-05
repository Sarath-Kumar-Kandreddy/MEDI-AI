import React, { useState, useEffect, useRef } from 'react';
import type { PharmacyStore, Language } from '../types';
import { VIZAG_PHARMACIES } from '../data/mockData';
import { MapPin, Navigation, Phone, ExternalLink, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';
import L from 'leaflet';

interface NearbyPharmacyMapProps {
  language: Language;
  onSelectPharmacy?: (pharmacy: PharmacyStore) => void;
}

export const NearbyPharmacyMap: React.FC<NearbyPharmacyMapProps> = ({
  language,
  onSelectPharmacy
}) => {
  const [selectedLocality, setSelectedLocality] = useState<string>('All');
  const [onlyJanAushadhi, setOnlyJanAushadhi] = useState<boolean>(false);
  const [activePharmacy, setActivePharmacy] = useState<PharmacyStore>(VIZAG_PHARMACIES[0]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'locating' | 'success' | 'denied'>('idle');
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  const localities = ['All', 'Maharani Peta', 'MVP Colony', 'Jagadamba Junction', 'Dwaraka Nagar', 'Siripuram', 'Gajuwaka'];

  // Filter pharmacies based on locality and Jan Aushadhi toggle
  const filteredPharmacies = VIZAG_PHARMACIES.filter(p => {
    const matchesLocality = selectedLocality === 'All' || p.locality.toLowerCase().includes(selectedLocality.toLowerCase());
    const matchesJanAushadhi = !onlyJanAushadhi || p.isGenericSubsidy;
    return matchesLocality && matchesJanAushadhi;
  });

  // Calculate distance if user location is available
  const pharmaciesWithDistance = filteredPharmacies.map(p => {
    if (userLocation) {
      const dist = calculateDistance(userLocation.lat, userLocation.lng, p.lat, p.lng);
      return { ...p, distanceKm: Number(dist.toFixed(1)) };
    }
    return p;
  });

  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Request user's current GPS location
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert(language === 'te' ? 'మీ బ్రౌజర్‌లో జీపీఎస్ లొకేషన్ సదుపాయం లేదు.' : 'Geolocation is not supported by your browser.');
      return;
    }
    setLocationStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        setLocationStatus('success');
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([coords.lat, coords.lng], 14);

          // Add or update User Marker
          const userIcon = L.divIcon({
            html: `<div style="background-color: #ba1a1a; width: 18px; height: 18px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 10px rgba(186, 26, 26, 0.8);"></div>`,
            className: 'user-gps-pulse',
            iconSize: [18, 18],
            iconAnchor: [9, 9]
          });
          L.marker([coords.lat, coords.lng], { icon: userIcon })
            .addTo(mapInstanceRef.current)
            .bindPopup(language === 'te' ? 'మీ ప్రస్తుత లొకేషన్' : 'Your Current Location')
            .openPopup();
        }
      },
      () => {
        setLocationStatus('denied');
        // Default to Vizag KGH Maharani Peta coords
        setUserLocation({ lat: 17.7089, lng: 83.3056 });
      },
      { timeout: 8000 }
    );
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [17.7126, 83.3056],
        zoom: 13,
        zoomControl: true,
        scrollWheelZoom: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear old markers
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    // Custom Icon generator
    const createPharmacyIcon = (isGeneric: boolean, isSelected: boolean) => {
      const bg = isGeneric ? '#0d9488' : '#0f2942';
      const border = isSelected ? '#d97706' : '#ffffff';
      const scale = isSelected ? 'transform: scale(1.2);' : '';
      return L.divIcon({
        html: `
          <div style="${scale} background-color: ${bg}; color: white; width: 34px; height: 34px; border-radius: 50%; border: 3px solid ${border}; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: bold;">
            ${isGeneric ? 'JA' : 'Rx'}
          </div>
        `,
        className: 'custom-pharmacy-pin',
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });
    };

    // Add markers for current list
    pharmaciesWithDistance.forEach(pharmacy => {
      const isSelected = activePharmacy.id === pharmacy.id;
      const marker = L.marker([pharmacy.lat, pharmacy.lng], {
        icon: createPharmacyIcon(pharmacy.isGenericSubsidy, isSelected)
      }).addTo(map);

      marker.on('click', () => {
        setActivePharmacy(pharmacy);
        if (onSelectPharmacy) onSelectPharmacy(pharmacy);
      });

      markersRef.current[pharmacy.id] = marker;
    });

    return () => {
      // Map cleanup if component unmounts
    };
  }, [pharmaciesWithDistance, activePharmacy]);

  // Center map when active pharmacy changes
  useEffect(() => {
    if (mapInstanceRef.current && activePharmacy) {
      mapInstanceRef.current.panTo([activePharmacy.lat, activePharmacy.lng], { animate: true });
    }
  }, [activePharmacy]);

  return (
    <div className="card-tactile p-6 bg-white border border-outline-border rounded-3xl mt-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-outline-subtle gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-full bg-secondary-container text-on-secondary-container">
              <MapPin className="w-6 h-6 text-secondary" />
            </span>
            <h3 className="text-xl md:text-2xl font-bold text-primary">
              {language === 'te' ? 'సమీప మెడికల్ స్టోర్లు & జన ఔషధి కేంద్రాలు (Google Maps)' : 'Nearby Medical Stores & Jan Aushadhi Kendras (Google Maps)'}
            </h3>
          </div>
          <p className="text-on-surface-variant text-base mt-1">
            {language === 'te'
              ? 'మీ ప్రస్తుత లొకేషన్ ఆధారంగా వైజాగ్ మెడికల్ షాపులు, జనరిక్ రాయితీలు & గూగుల్ మ్యాప్స్ దిశలు.'
              : 'Find verified pharmacies, Jan Aushadhi generic stores, and direct Google Maps directions in Visakhapatnam.'}
          </p>
        </div>

        {/* Locate Me Button */}
        <button
          onClick={handleGetLocation}
          className="btn-pill-primary text-base py-2.5 px-5 flex items-center gap-2 self-start md:self-auto shrink-0"
        >
          <Navigation className="w-5 h-5 text-secondary-fixed" />
          <span>
            {locationStatus === 'locating'
              ? (language === 'te' ? 'లొకేషన్ శోధిస్తోంది...' : 'Locating GPS...')
              : locationStatus === 'success'
              ? (language === 'te' ? 'లొకేషన్ గుర్తించబడింది ✓' : 'GPS Location Active ✓')
              : (language === 'te' ? 'నా ప్రస్తుత లొకేషన్ గుర్తించండి' : 'Locate My Current GPS')}
          </span>
        </button>
      </div>

      {/* Filter Chips & Jan Aushadhi Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 my-4">
        <div className="flex flex-wrap items-center gap-2">
          {localities.map(loc => (
            <button
              key={loc}
              onClick={() => setSelectedLocality(loc)}
              className={`px-4 py-2 rounded-full text-base font-semibold transition-all ${
                selectedLocality === loc
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-surface-container-low text-primary hover:bg-surface-container border border-outline-variant/60'
              }`}
            >
              {loc === 'All' ? (language === 'te' ? 'అన్ని ప్రాంతాలు' : 'All Vizag') : loc}
            </button>
          ))}
        </div>

        <button
          onClick={() => setOnlyJanAushadhi(!onlyJanAushadhi)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-base font-bold transition-all ${
            onlyJanAushadhi
              ? 'bg-secondary text-white shadow-md'
              : 'bg-secondary-container/50 text-secondary border border-secondary/40'
          }`}
        >
          <ShieldCheck className="w-5 h-5" />
          <span>
            {language === 'te' ? 'జన ఔషధి కేంద్రాలు మాత్రమే (80% ఆదా)' : 'Jan Aushadhi Only (80% Off)'}
          </span>
        </button>
      </div>

      {/* Map + List Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
        {/* Left Side: Interactive Leaflet & Google Map View */}
        <div className="lg:col-span-7 flex flex-col">
          <div
            ref={mapContainerRef}
            className="w-full h-[360px] md:h-[420px] rounded-2xl border-2 border-outline-border shadow-inner z-0"
            style={{ minHeight: '360px' }}
          />
          <div className="flex items-center justify-between text-sm text-on-surface-variant mt-2 px-1">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-3.5 h-3.5 rounded-full bg-secondary inline-block"></span>
                {language === 'te' ? 'జన ఔషధి (రాయితీ)' : 'Jan Aushadhi (Govt Generic)'}
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-3.5 h-3.5 rounded-full bg-primary inline-block"></span>
                {language === 'te' ? 'అపోలో / 1mg / రిటైల్' : 'Apollo / Tata 1mg / Retail'}
              </span>
            </div>
            <span>{language === 'te' ? 'క్లిక్ చేసి ఎంచుకోండి' : 'Click pin to view details'}</span>
          </div>
        </div>

        {/* Right Side: Active Store Details + Pharmacy Quick List */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          {/* Active Card Details */}
          <div className="p-5 rounded-2xl bg-surface-container-low border-2 border-secondary/30 shadow-tactile">
            <div className="flex items-start justify-between">
              <div>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${
                  activePharmacy.isGenericSubsidy
                    ? 'bg-secondary text-white'
                    : 'bg-primary text-white'
                }`}>
                  {activePharmacy.discountBadge}
                </span>
                <h4 className="text-xl font-bold text-primary">{activePharmacy.name}</h4>
                <p className="text-on-surface-variant text-base mt-1 flex items-start gap-1">
                  <MapPin className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                  <span>{activePharmacy.address}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-outline-subtle text-base">
              <div>
                <span className="text-sm text-on-surface-variant block">{language === 'te' ? 'దూరం' : 'Estimated Distance'}</span>
                <span className="font-bold text-primary text-lg">
                  {activePharmacy.distanceKm ? `${activePharmacy.distanceKm} km` : '~1.2 km'}
                </span>
              </div>
              <div>
                <span className="text-sm text-on-surface-variant block">{language === 'te' ? 'పనివేళలు' : 'Operating Hours'}</span>
                <span className="font-semibold text-secondary flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {activePharmacy.openHours}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 mt-5">
              <a
                href={activePharmacy.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-pill-primary flex-1 text-base py-2.5 px-4 flex items-center justify-center gap-2"
              >
                <Navigation className="w-5 h-5 text-secondary-fixed" />
                <span>{language === 'te' ? 'Google Maps దిశలు' : 'Google Maps Directions'}</span>
                <ExternalLink className="w-4 h-4 ml-1 opacity-75" />
              </a>
              <a
                href={`tel:${activePharmacy.phone}`}
                className="btn-pill-outline text-base py-2.5 px-4 flex items-center justify-center gap-2"
              >
                <Phone className="w-5 h-5" />
                <span>{language === 'te' ? 'కాల్ చేయండి' : 'Call Store'}</span>
              </a>
            </div>
          </div>

          {/* Quick List of Nearby Stores */}
          <div className="space-y-2 overflow-y-auto max-h-[220px] pr-1">
            <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">
              {language === 'te' ? 'అందుబాటులో ఉన్న ఇతర స్టోర్లు' : 'Other Stores in Vizag Area'} ({pharmaciesWithDistance.length})
            </p>
            {pharmaciesWithDistance.map(p => (
              <div
                key={p.id}
                onClick={() => {
                  setActivePharmacy(p);
                  if (onSelectPharmacy) onSelectPharmacy(p);
                }}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                  activePharmacy.id === p.id
                    ? 'bg-white border-2 border-secondary shadow-sm'
                    : 'bg-surface hover:bg-white border-outline-subtle'
                }`}
              >
                <div>
                  <div className="font-bold text-primary text-base flex items-center gap-1.5">
                    {p.name}
                    {p.isGenericSubsidy && (
                      <span className="text-xs bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full font-bold">
                        Jan Aushadhi
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-on-surface-variant mt-0.5">{p.locality}</div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-secondary">
                    {p.distanceKm ? `${p.distanceKm} km` : ''}
                  </span>
                  {activePharmacy.id === p.id && (
                    <CheckCircle2 className="w-4 h-4 text-secondary ml-auto mt-0.5" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
