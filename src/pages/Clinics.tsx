import { useState, useEffect } from "react";
import { MapPin, Phone, Clock, Navigation, Search, Filter, AlertTriangle, Heart, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import MotionPage from "@/components/common/MotionPage";
import ClinicFinder from "@/components/ClinicFinder";
import LocationService from "@/services/LocationService";
import ClinicFinderService from "@/services/ClinicFinderService";
import BackendAIService from "@/services/backendAIService";
import type { Clinic, MedicalSpecialization } from "@/services/ClinicFinderService";
import type { UserLocation } from "@/services/LocationService";
import { useTranslation } from 'react-i18next';

interface SearchFilters {
  query: string;
  specialization: string;
  maxDistance: number;
  emergencyOnly: boolean;
  minRating: number;
}

const Clinics = () => {
  const { t, i18n } = useTranslation(['common', 'chat']);
  
  // Services
  const [locationService] = useState(() => new LocationService());
  const [clinicFinderService] = useState(() => new ClinicFinderService(locationService));
  const [aiService] = useState(() => new BackendAIService());
  
  // State
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [specializations, setSpecializations] = useState<MedicalSpecialization[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  // Search filters
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    specialization: 'all',
    maxDistance: 5000, // 5km default
    emergencyOnly: false,
    minRating: 0
  });
  
  // Symptom analysis
  const [symptoms, setSymptoms] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<{
    specializations: MedicalSpecialization[];
    urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';
    recommendations: string[];
  } | null>(null);
  
  // Initialize specializations
  useEffect(() => {
    const specs = clinicFinderService.getAllSpecializations();
    setSpecializations(specs);
  }, [clinicFinderService]);
  
  // Get user location on mount
  useEffect(() => {
    getUserLocation();
  }, []);
  
  /**
   * Get user location
   */
  const getUserLocation = async () => {
    setIsLocating(true);
    setLocationError(null);
    
    try {
      if (!locationService.isSupported()) {
        throw new Error(i18n.language === 'en' 
          ? 'Geolocation is not supported by your browser'
          : 'உங்கள் உலாவி புவியிடத்தை ஆதரிக்கவில்லை'
        );
      }
      
      const location = await locationService.getCurrentLocation();
      setUserLocation(location);
      console.log('📍 Got user location:', { lat: location.latitude.toFixed(4), lng: location.longitude.toFixed(4) });
      
      // Auto-search for clinics once we have location
      searchClinics(location);
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown location error';
      setLocationError(locationService.getErrorMessage(error as any, i18n.language as 'en' | 'ta'));
      console.error('❌ Location error:', errorMsg);
    } finally {
      setIsLocating(false);
    }
  };
  
  /**
   * Search for clinics
   */
  const searchClinics = async (location?: UserLocation) => {
    const searchLocation = location || userLocation;
    if (!searchLocation) {
      setError(i18n.language === 'en' 
        ? 'Location required to search for clinics'
        : 'கிளினிக்குகளைத் தேட இருப்பிடம் தேவை'
      );
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🏥 Searching clinics with filters:', filters);
      
      const searchOptions = {
        specialization: filters.specialization === 'all' ? undefined : filters.specialization,
        maxDistance: filters.maxDistance,
        emergencyOnly: filters.emergencyOnly,
        minRating: filters.minRating,
        limit: 20
      };
      
      const results = await clinicFinderService.findNearbyClinics(searchOptions);
      
      // Filter by search query if provided
      let filteredResults = results;
      if (filters.query.trim()) {
        const query = filters.query.toLowerCase();
        filteredResults = results.filter(clinic => 
          clinic.name.toLowerCase().includes(query) ||
          clinic.address.toLowerCase().includes(query) ||
          clinic.specializations.some(spec => spec.toLowerCase().includes(query))
        );
      }
      
      setClinics(filteredResults);
      console.log(`✅ Found ${filteredResults.length} clinics`);
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMsg);
      console.error('❌ Clinic search error:', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Analyze symptoms and get AI suggestions
   */
  const analyzeSymptoms = async () => {
    if (!symptoms.trim()) return;
    
    try {
      setIsLoading(true);
      
      // Use AI service to get suggestions
      const suggestions = await aiService.suggestClinics(symptoms, i18n.language as 'en' | 'ta');
      
      // Get specializations details
      const matchedSpecs = suggestions.specializations
        .map(specId => specializations.find(s => s.id === specId))
        .filter(Boolean) as MedicalSpecialization[];
      
      setAiSuggestions({
        specializations: matchedSpecs,
        urgencyLevel: suggestions.urgencyLevel,
        recommendations: suggestions.recommendations
      });
      
      // Update filters based on suggestions
      if (suggestions.specializations.length > 0) {
        setFilters(prev => ({
          ...prev,
          specialization: suggestions.specializations[0],
          emergencyOnly: suggestions.urgencyLevel === 'emergency'
        }));
      }
      
      // Search with new filters
      if (userLocation) {
        searchClinics();
      }
      
    } catch (error) {
      console.error('❌ Symptom analysis error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Handle filter changes
   */
  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  /**
   * Apply filters and search
   */
  const applyFilters = () => {
    if (userLocation) {
      searchClinics();
    }
  };
  
  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setFilters({
      query: '',
      specialization: 'all',
      maxDistance: 5000,
      emergencyOnly: false,
      minRating: 0
    });
    setSymptoms('');
    setAiSuggestions(null);
    if (userLocation) {
      searchClinics();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <MotionPage className="pt-20 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              {i18n.language === 'en' ? '🏥 Find Nearby Clinics' : '🏥 அருகிலுள்ள கிளினிக்குகளைக் கண்டறியுங்கள்'}
            </h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              {i18n.language === 'en' 
                ? 'Discover healthcare facilities near you with real-time data from OpenStreetMap'
                : 'OpenStreetMap இல் இருந்து நேரலை தரவுகளுடன் உங்களுக்கு அருகிலுள்ள சுகாதார வசதிகளைக் கண்டறியுங்கள்'
              }
            </p>
          </div>

          {/* Location Status */}
          {(isLocating || locationError) && (
            <Card className="mb-6 bg-gray-800/50 border-gray-600/50">
              <div className="p-4">
                {isLocating ? (
                  <div className="flex items-center justify-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                    <span className="text-white">
                      {i18n.language === 'en' ? 'Getting your location...' : 'உங்கள் இருப்பிடத்தைப் பெறுகிறேன்...'}
                    </span>
                  </div>
                ) : locationError ? (
                  <Alert className="bg-red-500/10 border-red-500/20">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-200">
                      {locationError}
                    </AlertDescription>
                  </Alert>
                ) : null}
              </div>
            </Card>
          )}

          {/* Symptom Analyzer */}
          <Card className="mb-6 bg-gray-800/80 border-gray-600/50">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-400" />
                {i18n.language === 'en' ? 'Describe Your Symptoms' : 'உங்கள் அறிகுறிகளை விவரிக்கவும்'}
              </h2>
              
              <div className="flex gap-3">
                <Input
                  placeholder={i18n.language === 'en' 
                    ? 'E.g., I have chest pain and difficulty breathing...'
                    : 'உதா., எனக்கு மார்பு வலி மற்றும் மூச்சு விடுவதில் சிரமம்...'
                  }
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  className="flex-1 bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400"
                />
                <Button 
                  onClick={analyzeSymptoms}
                  disabled={!symptoms.trim() || isLoading}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>🩺 {i18n.language === 'en' ? 'Analyze' : 'பகுப்பாய்வு'}</>
                  )}
                </Button>
              </div>
            </div>
          </Card>

          {/* Search Filters */}
          <Card className="mb-6 bg-gray-800/80 border-gray-600/50">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Filter className="w-5 h-5 text-blue-400" />
                  {i18n.language === 'en' ? 'Search Filters' : 'தேடல் வடிகட்டிகள்'}
                </h2>
                <div className="flex gap-2">
                  <Button
                    onClick={getUserLocation}
                    disabled={isLocating}
                    variant="outline"
                    className="border-gray-600/50 text-gray-300 hover:text-white"
                  >
                    {isLocating ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Navigation className="w-4 h-4 mr-2" />
                    )}
                    {i18n.language === 'en' ? 'Update Location' : 'இருப்பிடத்தை புதுப்பிக்கவும்'}
                  </Button>
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    className="border-gray-600/50 text-gray-300 hover:text-white"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {i18n.language === 'en' ? 'Clear' : 'அழிக்கவும்'}
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search Query */}
                <div>
                  <label className="text-sm text-gray-300 mb-2 block">
                    {i18n.language === 'en' ? 'Search' : 'தேடல்'}
                  </label>
                  <Input
                    placeholder={i18n.language === 'en' ? 'Clinic name or location...' : 'கிளினிக் பெயர் அல்லது இடம்...'}
                    value={filters.query}
                    onChange={(e) => handleFilterChange('query', e.target.value)}
                    className="bg-gray-700/50 border-gray-600/50 text-white"
                  />
                </div>
                
                {/* Specialization */}
                <div>
                  <label className="text-sm text-gray-300 mb-2 block">
                    {i18n.language === 'en' ? 'Specialization' : 'சிறப்பு'}
                  </label>
                  <Select value={filters.specialization} onValueChange={(value) => handleFilterChange('specialization', value)}>
                    <SelectTrigger className="bg-gray-700/50 border-gray-600/50 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{i18n.language === 'en' ? 'All Specializations' : 'அனைத்து சிறப்புகள்'}</SelectItem>
                      {specializations.map((spec) => (
                        <SelectItem key={spec.id} value={spec.id}>
                          {i18n.language === 'ta' ? spec.tamilName : spec.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Distance */}
                <div>
                  <label className="text-sm text-gray-300 mb-2 block">
                    {i18n.language === 'en' ? 'Max Distance' : 'அதிகபட்ச தூரம்'}
                  </label>
                  <Select value={filters.maxDistance.toString()} onValueChange={(value) => handleFilterChange('maxDistance', parseInt(value))}>
                    <SelectTrigger className="bg-gray-700/50 border-gray-600/50 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2000">2 km</SelectItem>
                      <SelectItem value="5000">5 km</SelectItem>
                      <SelectItem value="10000">10 km</SelectItem>
                      <SelectItem value="20000">20 km</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Min Rating */}
                <div>
                  <label className="text-sm text-gray-300 mb-2 block">
                    {i18n.language === 'en' ? 'Min Rating' : 'குறைந்த மதிப்பீடு'}
                  </label>
                  <Select value={filters.minRating.toString()} onValueChange={(value) => handleFilterChange('minRating', parseFloat(value))}>
                    <SelectTrigger className="bg-gray-700/50 border-gray-600/50 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">{i18n.language === 'en' ? 'Any Rating' : 'எந்த மதிப்பீடும்'}</SelectItem>
                      <SelectItem value="3.0">3.0+ ⭐</SelectItem>
                      <SelectItem value="3.5">3.5+ ⭐</SelectItem>
                      <SelectItem value="4.0">4.0+ ⭐</SelectItem>
                      <SelectItem value="4.5">4.5+ ⭐</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center gap-4 mt-4">
                <label className="flex items-center gap-2 text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.emergencyOnly}
                    onChange={(e) => handleFilterChange('emergencyOnly', e.target.checked)}
                    className="rounded"
                  />
                  {i18n.language === 'en' ? 'Emergency services only' : 'அவசர சேவைகள் மட்டும்'}
                </label>
                
                <Button
                  onClick={applyFilters}
                  disabled={!userLocation || isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white ml-auto"
                >
                  <Search className="w-4 h-4 mr-2" />
                  {i18n.language === 'en' ? 'Search Clinics' : 'கிளினிக்குகளை தேடுங்கள்'}
                </Button>
              </div>
            </div>
          </Card>

          {/* Error Display */}
          {error && (
            <Alert className="mb-6 bg-red-500/10 border-red-500/20">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-200">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Results */}
          <ClinicFinder
            clinics={clinics}
            userLocation={userLocation}
            specializations={aiSuggestions?.specializations || []}
            urgencyLevel={aiSuggestions?.urgencyLevel}
            recommendations={aiSuggestions?.recommendations || []}
            isLoading={isLoading}
            showMap={true}
            onCallClinic={(clinic) => {
              if (clinic.phone) {
                window.open(`tel:${clinic.phone}`, '_self');
              }
            }}
            onGetDirections={(clinic) => {
              const url = `https://www.google.com/maps/dir/?api=1&destination=${clinic.latitude},${clinic.longitude}`;
              window.open(url, '_blank');
            }}
            className="mt-6"
          />
        </div>
      </MotionPage>
    </div>
  );
};

export default Clinics;
