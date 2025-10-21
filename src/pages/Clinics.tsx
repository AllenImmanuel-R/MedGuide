import { useState, useEffect, useCallback } from "react";
import { MapPin, Search, AlertTriangle, Loader2, Target, Phone, Star, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

// Import our real clinic services and components
import { clinicFinderService, locationService } from '@/services/clinicServices';
import type { Clinic, ClinicSearchOptions, MedicalSpecialization, UserLocation, LocationError } from '@/services/clinicServices';

interface ClinicSearchState {
  clinics: Clinic[];
  userLocation: UserLocation | null;
  specializations: MedicalSpecialization[];
  urgencyLevel: 'low' | 'medium' | 'high' | 'emergency' | null;
  recommendations: string[];
  isLoading: boolean;
  error: string | null;
  hasLocationPermission: boolean;
}

const Clinics = () => {
  const { i18n } = useTranslation(['common', 'chat']);
  const { toast } = useToast();
  
  // Main state
  const [searchState, setSearchState] = useState<ClinicSearchState>({
    clinics: [],
    userLocation: null,
    specializations: [],
    urgencyLevel: null,
    recommendations: [],
    isLoading: false,
    error: null,
    hasLocationPermission: false
  });
  
  // Search filters
  const [maxDistance, setMaxDistance] = useState(5); // km
  const [minRating, setMinRating] = useState(0); // minimum rating filter
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'name'>('distance');
  

  
  // View mode - removed, only search mode available

  // Initialize location and check permissions
  useEffect(() => {
    const initializeLocation = async () => {
      try {
        const permissionStatus = await locationService.checkPermissionStatus();
        setSearchState(prev => ({
          ...prev,
          hasLocationPermission: permissionStatus.granted
        }));
        
        if (permissionStatus.granted) {
          // Try to get cached location first
          const cachedLocation = locationService.getCachedLocation();
          if (cachedLocation) {
            setSearchState(prev => ({
              ...prev,
              userLocation: cachedLocation
            }));
          }
        }
      } catch (error) {
        console.error('Error checking location permissions:', error);
      }
    };
    
    initializeLocation();
  }, []);
  
  // Get user location with high GPS accuracy
  const getUserLocation = useCallback(async () => {
    try {
      setSearchState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Use high-accuracy GPS method for better precision
      const location = await locationService.getHighAccuracyLocation(3, 15); // 3 attempts, target 15m accuracy
      
      setSearchState(prev => ({
        ...prev,
        userLocation: location,
        hasLocationPermission: true,
        isLoading: false
      }));
      
      toast({
        title: i18n.language === 'en' ? 'GPS Location Found' : 'GPS இருப்பிடம் கண்டுபிடிக்கப்பட்டது',
        description: i18n.language === 'en' 
          ? `Location detected with ${location.accuracy.toFixed(1)}m accuracy using ${location.source}`
          : `${location.accuracy.toFixed(1)}m துல்லியத்துடன் ${location.source} பயன்படுத்தி இருப்பிடம் கண்டறியப்பட்டது`,
      });
      
    } catch (error) {
      // Fallback to regular location method if high-accuracy fails
      try {
        console.log('🔄 High-accuracy GPS failed, trying regular location...');
        const location = await locationService.getLocationWithCache();
        
        setSearchState(prev => ({
          ...prev,
          userLocation: location,
          hasLocationPermission: true,
          isLoading: false
        }));
        
        toast({
          title: i18n.language === 'en' ? 'Location Found (Fallback)' : 'இருப்பிடம் கண்டுபிடிக்கப்பட்டது (மாற்று)',
          description: i18n.language === 'en' 
            ? `Using network location with ${location.accuracy.toFixed(1)}m accuracy`
            : `${location.accuracy.toFixed(1)}m துல்லியத்துடன் நெட்வொர்க் இருப்பிடம் பயன்படுத்தப்படுகிறது`,
        });
        
      } catch (fallbackError) {
        const locationError = fallbackError as LocationError;
        setSearchState(prev => ({
          ...prev,
          error: locationService.getErrorMessage(locationError, i18n.language as 'en' | 'ta'),
          isLoading: false
        }));
        
        toast({
          title: i18n.language === 'en' ? 'GPS Location Error' : 'GPS இருப்பிட பிழை',
          description: locationService.getErrorMessage(locationError, i18n.language as 'en' | 'ta'),
          variant: 'destructive',
        });
      }
    }
  }, [i18n.language, toast]);
  
  // Generate fallback demo clinics
  const generateFallbackClinics = useCallback((userLocation: UserLocation): Clinic[] => {
    const baseDistance = 0.5; // km
    return [
      {
        id: 'demo-1',
        name: i18n.language === 'en' ? 'City General Hospital' : 'நகர பொது மருத்துவமனை',
        address: i18n.language === 'en' ? 'Main Street, City Center' : 'முதன்மை தெரு, நகர மையம்',
        city: 'Demo City',
        latitude: userLocation.latitude + 0.001,
        longitude: userLocation.longitude + 0.001,
        phone: '+91-xxx-xxx-xxxx',
        specializations: ['general_medicine', 'emergency'],
        services: ['Emergency Care', 'General Consultation'],
        rating: 4.2,
        reviews: 150,
        openingHours: {
          'Monday': { open: '08:00', close: '20:00' },
          'Tuesday': { open: '08:00', close: '20:00' },
          'Wednesday': { open: '08:00', close: '20:00' },
          'Thursday': { open: '08:00', close: '20:00' },
          'Friday': { open: '08:00', close: '20:00' },
          'Saturday': { open: '08:00', close: '18:00' },
          'Sunday': { open: '09:00', close: '17:00' }
        },
        languages: ['English', 'Tamil', 'Hindi'],
        facilities: ['Parking', 'Wheelchair Access'],
        emergencyServices: true,
        insurance: ['General Insurance'],
        distance: baseDistance,
        amenity: 'hospital'
      },
      {
        id: 'demo-2',
        name: i18n.language === 'en' ? 'Community Health Clinic' : 'சமூக சுகாதார கிளினிக்',
        address: i18n.language === 'en' ? 'Park Road, Residential Area' : 'பூங்கா சாலை, குடியிருப்பு பகுதி',
        city: 'Demo City',
        latitude: userLocation.latitude - 0.002,
        longitude: userLocation.longitude + 0.002,
        phone: '+91-xxx-xxx-xxxx',
        specializations: ['general_medicine', 'pediatrics'],
        services: ['General Consultation', 'Child Care'],
        rating: 4.0,
        reviews: 89,
        openingHours: {
          'Monday': { open: '09:00', close: '18:00' },
          'Tuesday': { open: '09:00', close: '18:00' },
          'Wednesday': { open: '09:00', close: '18:00' },
          'Thursday': { open: '09:00', close: '18:00' },
          'Friday': { open: '09:00', close: '18:00' },
          'Saturday': { open: '09:00', close: '14:00' },
          'Sunday': { open: '09:00', close: '12:00', isClosed: true }
        },
        languages: ['English', 'Tamil'],
        facilities: ['Waiting Area'],
        emergencyServices: false,
        insurance: ['General Insurance'],
        distance: baseDistance * 1.5,
        amenity: 'clinic'
      }
    ];
  }, [i18n.language]);

  // Search nearby clinics with retry and fallback
  const searchNearbyClinics = useCallback(async (retryCount = 0) => {
    if (!searchState.userLocation) {
      await getUserLocation();
      return;
    }
    
    try {
      setSearchState(prev => ({ 
        ...prev, 
        isLoading: true, 
        error: null
      }));
      
      const searchOptions: ClinicSearchOptions = {
        maxDistance: maxDistance * 1000, // Convert to meters
        language: i18n.language,
        sortBy,
        limit: 50
      };
      
      console.log(`🔍 Searching clinics (attempt ${retryCount + 1})...`);
      const clinics = await clinicFinderService.findNearbyClinics(searchOptions);
      
      setSearchState(prev => ({
        ...prev,
        clinics,
        isLoading: false
      }));
      
      toast({
        title: i18n.language === 'en' ? 'Clinics Found' : 'கிளினிக்குகள் கண்டுபிடிக்கப்பட்டன',
        description: i18n.language === 'en' 
          ? `Found ${clinics.length} nearby healthcare facilities`
          : `${clinics.length} அருகிலுள்ள சுகாதார வசதிகள் கண்டுபிடிக்கப்பட்டன`,
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ Clinic search error:', errorMessage);
      
      // Retry logic for certain errors
      const shouldRetry = retryCount < 2 && (
        errorMessage.includes('timeout') ||
        errorMessage.includes('overloaded') ||
        errorMessage.includes('504')
      );
      
      if (shouldRetry) {
        console.log(`🔄 Retrying search in ${(retryCount + 1) * 2} seconds...`);
        
        toast({
          title: i18n.language === 'en' ? 'Retrying...' : 'மீண்டும் முயற்சிக்கிறது...',
          description: i18n.language === 'en' 
            ? 'Search timed out, trying again with a different server...'
            : 'தேடல் நேரம் முடிந்தது, வேறு சர்வர் மூலம் மீண்டும் முயற்சிக்கிறது...',
        });
        
        setTimeout(() => {
          searchNearbyClinics(retryCount + 1);
        }, (retryCount + 1) * 2000);
        return;
      }
      
      // If all retries failed, offer fallback demo data
      if (retryCount >= 2 || errorMessage.includes('All Overpass API servers failed')) {
        const fallbackClinics = generateFallbackClinics(searchState.userLocation!);
        
        setSearchState(prev => ({
          ...prev,
          clinics: fallbackClinics,
          isLoading: false,
          error: null
        }));
        
        toast({
          title: i18n.language === 'en' ? 'Demo Data Loaded' : 'டெமோ தரவு ஏற்றப்பட்டது',
          description: i18n.language === 'en'
            ? 'Live data unavailable. Showing demo clinics to demonstrate features.'
            : 'நேரலை தரவு கிடைக்கவில்லை. அம்சங்களை நிரூபிக்க டெமோ கிளினிக்குகளைக் காட்டுகிறது.',
          variant: 'default',
        });
        
        return;
      }
      
      // Regular error handling
      setSearchState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));
      
      toast({
        title: i18n.language === 'en' ? 'Search Failed' : 'தேடல் தோல்வியுற்றது',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [searchState.userLocation, maxDistance, i18n.language, sortBy, getUserLocation, toast, generateFallbackClinics]);
  


  const distances = [1, 2, 5, 10, 15, 25];
  const sortOptions = [
    { value: 'distance', label: i18n.language === 'en' ? 'Distance' : 'தூரம்' },
    { value: 'rating', label: i18n.language === 'en' ? 'Rating' : 'மதிப்பீடு' },
    { value: 'name', label: i18n.language === 'en' ? 'Name' : 'பெயர்' }
  ];
  
  // Auto-search when filters change
  useEffect(() => {
    if (searchState.userLocation && !searchState.isLoading) {
      // Re-search when filters change (but not on initial load)
      const timeoutId = setTimeout(() => {
        searchNearbyClinics();
      }, 500); // Debounce for 500ms
      
      return () => clearTimeout(timeoutId);
    }
  }, [maxDistance, minRating, sortBy]);

  // Filter clinics based on rating (client-side filtering)
  const filteredClinics = searchState.clinics.filter(clinic => {
    // Apply rating filter
    if (minRating > 0 && clinic.rating < minRating) {
      return false;
    }
    
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {i18n.language === 'en' ? 'Find Nearby Clinics' : 'அருகிலுள்ள கிளினிக்குகளைக் கண்டறியுங்கள்'}
          </h1>
          <p className="text-gray-600 text-lg">
            {i18n.language === 'en' 
              ? 'Real-time clinic data powered by OpenStreetMap and AI'
              : 'OpenStreetMap மற்றும் AI ஆல் இயக்கப்படும் நேரலை கிளினிக் தரவுகள்'
            }
          </p>
        </motion.div>
        
        {/* Location Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          {searchState.error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {searchState.error}
              </AlertDescription>
            </Alert>
          )}
          
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900">Location Status</CardTitle>
              <CardDescription>Your current location for finding nearby healthcare facilities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${searchState.userLocation ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span className="text-gray-900 font-medium">
                    {searchState.userLocation 
                      ? (i18n.language === 'en' ? 'Location detected' : 'இருப்பிடம் கண்டறியப்பட்டது')
                      : (i18n.language === 'en' ? 'Location required' : 'இருப்பிடம் தேவை')
                    }
                  </span>
                  {searchState.userLocation && (
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs text-green-700 border-green-300 bg-green-50">
                        📍 {searchState.userLocation.latitude.toFixed(6)}, {searchState.userLocation.longitude.toFixed(6)}
                      </Badge>
                      <Badge variant="outline" className="text-xs text-blue-700 border-blue-300 bg-blue-50">
                        ±{searchState.userLocation.accuracy.toFixed(1)}m
                      </Badge>
                      {searchState.userLocation.source && (
                        <Badge variant="outline" className="text-xs text-purple-700 border-purple-300 bg-purple-50">
                          {searchState.userLocation.source}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  {!searchState.userLocation && (
                    <Button 
                      onClick={getUserLocation}
                      disabled={searchState.isLoading}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {searchState.isLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Target className="w-4 h-4 mr-2" />
                      )}
                      {i18n.language === 'en' ? 'Get Location' : 'இருப்பிடம் பெறவும்'}
                    </Button>
                  )}
                  
                  {searchState.userLocation && (
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => searchNearbyClinics()}
                        disabled={searchState.isLoading}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        {searchState.isLoading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4 mr-2" />
                        )}
                        {i18n.language === 'en' ? 'Find Clinics' : 'கிளினிக்குகளைத் தேடுங்கள்'}
                      </Button>
                      <Button 
                        onClick={async () => {
                          try {
                            // Clear cached location and get fresh location
                            locationService.clearLocation();
                            toast({
                              title: i18n.language === 'en' ? 'Refreshing Location' : 'இருப்பிடத்தை புதுப்பிக்கிறது',
                              description: i18n.language === 'en' ? 'Getting your current location...' : 'உங்கள் தற்போதைய இருப்பிடத்தைப் பெறுகிறது...',
                            });
                            await getUserLocation();
                          } catch (error) {
                            console.error('Error refreshing location:', error);
                          }
                        }}
                        disabled={searchState.isLoading}
                        variant="outline"
                        size="sm"
                      >
                        <Target className="w-4 h-4 mr-2" />
                        {i18n.language === 'en' ? 'Refresh Location' : 'இருப்பிடத்தை புதுப்பிக்கவும்'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
            

            
        {/* Search Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-8"
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900">
                {i18n.language === 'en' ? 'Search Filters' : 'தேடல் வடிகட்டிகள்'}
              </CardTitle>
              <CardDescription>
                {i18n.language === 'en' ? 'Refine your search to find the right healthcare facility' : 'சரியான சுகாதார வசதியைக் கண்டறிய உங்கள் தேடலை மேம்படுத்துங்கள்'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Distance Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    {i18n.language === 'en' ? 'Distance Range' : 'தூர வரம்பு'}
                  </label>
                  <Select value={maxDistance.toString()} onValueChange={(value) => setMaxDistance(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {distances.map(distance => (
                        <SelectItem key={distance} value={distance.toString()}>
                          {i18n.language === 'en' ? `Within ${distance} km` : `${distance} கிமீ வரை`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Rating Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    {i18n.language === 'en' ? 'Minimum Rating' : 'குறைந்தபட்ச மதிப்பீடு'}
                  </label>
                  <Select value={minRating.toString()} onValueChange={(value) => setMinRating(parseFloat(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">
                        {i18n.language === 'en' ? 'Any Rating' : 'எந்த மதிப்பீடும்'}
                      </SelectItem>
                      <SelectItem value="3">
                        {i18n.language === 'en' ? '3+ Stars' : '3+ நட்சத்திரங்கள்'}
                      </SelectItem>
                      <SelectItem value="3.5">
                        {i18n.language === 'en' ? '3.5+ Stars' : '3.5+ நட்சத்திரங்கள்'}
                      </SelectItem>
                      <SelectItem value="4">
                        {i18n.language === 'en' ? '4+ Stars' : '4+ நட்சத்திரங்கள்'}
                      </SelectItem>
                      <SelectItem value="4.5">
                        {i18n.language === 'en' ? '4.5+ Stars' : '4.5+ நட்சத்திரங்கள்'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Sort By */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    {i18n.language === 'en' ? 'Sort By' : 'வரிசைப்படுத்து'}
                  </label>
                  <Select value={sortBy} onValueChange={(value: 'distance' | 'rating' | 'name') => setSortBy(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

            {/* Clinic Results */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {/* Debug Info */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Debug:</strong> Total clinics: {searchState.clinics.length}, Filtered: {filteredClinics.length}, Loading: {searchState.isLoading.toString()}
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">
                    Distance: {maxDistance}km, Min Rating: {minRating}+, Sort: {sortBy}
                  </p>
                  {searchState.userLocation && (
                    <div className="text-xs text-yellow-600 mt-1 space-y-1">
                      <p>
                        <strong>GPS Location:</strong> {searchState.userLocation.latitude.toFixed(8)}, {searchState.userLocation.longitude.toFixed(8)}
                      </p>
                      <p>
                        <strong>Accuracy:</strong> {searchState.userLocation.accuracy.toFixed(1)}m | 
                        <strong> Source:</strong> {searchState.userLocation.source || 'Unknown'}
                      </p>
                      {searchState.userLocation.altitude && (
                        <p>
                          <strong>Altitude:</strong> {searchState.userLocation.altitude.toFixed(1)}m
                          {searchState.userLocation.altitudeAccuracy && ` (±${searchState.userLocation.altitudeAccuracy.toFixed(1)}m)`}
                        </p>
                      )}
                      {(searchState.userLocation.speed !== undefined || searchState.userLocation.heading !== undefined) && (
                        <p>
                          {searchState.userLocation.speed !== undefined && (
                            <span><strong>Speed:</strong> {(searchState.userLocation.speed * 3.6).toFixed(1)} km/h | </span>
                          )}
                          {searchState.userLocation.heading !== undefined && (
                            <span><strong>Heading:</strong> {searchState.userLocation.heading.toFixed(0)}°</span>
                          )}
                        </p>
                      )}
                      <button 
                        onClick={() => {
                          const url = `https://www.google.com/maps/search/${searchState.userLocation!.latitude},${searchState.userLocation!.longitude}`;
                          window.open(url, '_blank');
                        }}
                        className="text-blue-600 underline hover:text-blue-800"
                      >
                        📍 View My GPS Location on Map
                      </button>
                    </div>
                  )}
                  {filteredClinics.length > 0 && (
                    <p className="text-xs text-yellow-600 mt-1">
                      <strong>First Clinic:</strong> {filteredClinics[0].name} at {filteredClinics[0].latitude.toFixed(6)}, {filteredClinics[0].longitude.toFixed(6)}
                    </p>
                  )}
                </div>
              )}

              {searchState.clinics.length > 0 && (
                <div className="space-y-4">
                  {/* Results Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {i18n.language === 'en' 
                        ? `Found ${filteredClinics.length} nearby clinics` 
                        : `${filteredClinics.length} அருகிலுள்ள கிளினிக்குகள் கண்டுபிடிக்கப்பட்டன`
                      }
                    </h3>
                  </div>

                  {/* Clinic Cards */}
                  {filteredClinics.map((clinic) => (
                    <Card key={clinic.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                      <CardContent className="p-6">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">{clinic.name}</h4>
                            <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
                              <MapPin className="w-4 h-4" />
                              <span>{clinic.address}, {clinic.city}</span>
                              {clinic.distance && (
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                  {clinic.distance.toFixed(1)} km
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {/* Status Indicators */}
                          <div className="flex flex-col items-end gap-2">
                            {clinic.emergencyServices && (
                              <Badge className="bg-red-100 text-red-700 border-red-200">
                                {i18n.language === 'en' ? 'Emergency' : 'அவசர சிகிச்சை'}
                              </Badge>
                            )}
                            <div className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-green-50 text-green-700">
                              <Clock className="w-3 h-3" />
                              {i18n.language === 'en' ? 'Open' : 'திறந்திருக்கும்'}
                            </div>
                          </div>
                        </div>

                        {/* Rating and Hours */}
                        <div className="flex items-center gap-4 mb-4">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-gray-900 font-medium">{clinic.rating}</span>
                            <span className="text-gray-600 text-sm">({clinic.reviews} reviews)</span>
                          </div>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-600 text-sm">Open 24 hours</span>
                        </div>

                        {/* Specializations */}
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-2">
                            {clinic.specializations.slice(0, 4).map((spec) => (
                              <Badge key={spec} className="bg-purple-100 text-purple-700 border-purple-200">
                                {spec.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </Badge>
                            ))}
                            {clinic.specializations.length > 4 && (
                              <Badge variant="outline" className="bg-gray-50 text-gray-600">
                                +{clinic.specializations.length - 4} more
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Services */}
                        {clinic.services && clinic.services.length > 0 && (
                          <div className="mb-4">
                            <p className="text-gray-700 text-sm font-medium mb-1">
                              {i18n.language === 'en' ? 'Services:' : 'சேவைகள்:'}
                            </p>
                            <p className="text-gray-600 text-sm">
                              {clinic.services.slice(0, 3).join(', ')}
                              {clinic.services.length > 3 && '...'}
                            </p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4 border-t">
                          {clinic.phone && (
                            <Button
                              onClick={() => window.open(`tel:${clinic.phone}`, '_self')}
                              variant="outline"
                              size="sm"
                              className="flex-1"
                            >
                              <Phone className="w-4 h-4 mr-2" />
                              {i18n.language === 'en' ? 'Call' : 'அழைக்கவும்'}
                            </Button>
                          )}
                          <Button
                            onClick={() => {
                              // Try multiple approaches for better directions
                              if (searchState.userLocation) {
                                // Method 1: Use both origin and destination
                                const url = `https://www.google.com/maps/dir/${searchState.userLocation.latitude},${searchState.userLocation.longitude}/${clinic.latitude},${clinic.longitude}`;
                                console.log('🗺️ Opening directions with origin and destination:', {
                                  origin: `${searchState.userLocation.latitude},${searchState.userLocation.longitude}`,
                                  destination: `${clinic.latitude},${clinic.longitude}`,
                                  url
                                });
                                window.open(url, '_blank');
                              } else {
                                // Method 2: Just destination, let Google Maps use device location
                                const url = `https://www.google.com/maps/search/${clinic.latitude},${clinic.longitude}`;
                                console.log('🗺️ Opening clinic location (no origin):', {
                                  destination: `${clinic.latitude},${clinic.longitude}`,
                                  url
                                });
                                window.open(url, '_blank');
                              }
                            }}
                            size="sm"
                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                          >
                            <MapPin className="w-4 h-4 mr-2" />
                            {i18n.language === 'en' ? 'Directions' : 'திசைகள்'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Show filtered clinics count */}
              {searchState.clinics.length > 0 && filteredClinics.length === 0 && (
                <Card className="border-0 shadow-lg">
                  <CardContent className="text-center py-12">
                    <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {i18n.language === 'en' ? 'No clinics match your filters' : 'உங்கள் வடிகட்டிகளுக்கு பொருந்தும் கிளினிக்குகள் இல்லை'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {i18n.language === 'en'
                        ? `Found ${searchState.clinics.length} clinics, but none meet your rating criteria. Try lowering the minimum rating.`
                        : `${searchState.clinics.length} கிளினிக்குகள் கண்டுபிடிக்கப்பட்டன, ஆனால் உங்கள் மதிப்பீட்டு அளவுகோல்களை பூர்த்தி செய்யவில்லை. குறைந்தபட்ச மதிப்பீட்டை குறைக்க முயற்சிக்கவும்.`
                      }
                    </p>
                    <Button 
                      onClick={() => setMinRating(0)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {i18n.language === 'en' ? 'Clear Rating Filter' : 'மதிப்பீட்டு வடிகட்டியை அழிக்கவும்'}
                    </Button>
                  </CardContent>
                </Card>
              )}
              
              {/* No Results State */}
              {!searchState.isLoading && searchState.clinics.length === 0 && searchState.userLocation && (
                <Card className="border-0 shadow-lg">
                  <CardContent className="text-center py-12">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {i18n.language === 'en' ? 'No clinics found' : 'கிளினிக்குகள் கிடைக்கவில்லை'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {i18n.language === 'en'
                        ? 'Try expanding your search radius or adjusting your filters.'
                        : 'உங்கள் தேடல் ஆரையை விரிவுபடுத்த முயற்சிக்கவும் அல்லது உங்கள் வடிகட்டிகளை சரிசெய்யவும்.'
                      }
                    </p>
                    <Button 
                      onClick={() => {
                        setMaxDistance(prev => Math.min(prev * 2, 25));
                        searchNearbyClinics();
                      }}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      {i18n.language === 'en' ? 'Expand Search' : 'தேடலை விரிவுபடுத்துங்கள்'}
                    </Button>
                  </CardContent>
                </Card>
              )}
              
              {/* Getting Started State */}
              {!searchState.userLocation && !searchState.isLoading && (
                <Card className="border-0 shadow-lg">
                  <CardContent className="text-center py-12">
                    <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {i18n.language === 'en' ? 'Ready to find nearby clinics?' : 'அருகிலுள்ள கிளினிக்குகளைக் கண்டறிய தயாரா?'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {i18n.language === 'en'
                        ? 'Click "Get Location" to start finding healthcare facilities near you using real OpenStreetMap data.'
                        : 'உண்மையான OpenStreetMap தரவுகளைப் பயன்படுத்தி உங்களுக்கு அருகிலுள்ள சுகாதார வசதிகளைக் கண்டறிய "இருப்பிடம் பெறவும்" என்பதைக் கிளிக் செய்யவும்.'
                      }
                    </p>
                    <Button 
                      onClick={getUserLocation}
                      disabled={searchState.isLoading}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {searchState.isLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Target className="w-4 h-4 mr-2" />
                      )}
                      {i18n.language === 'en' ? 'Get Started' : 'தொடங்குங்கள்'}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </motion.div>
      </div>
    </div>
  );
};

export default Clinics;