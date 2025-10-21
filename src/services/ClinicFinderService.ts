/**
 * Clinic Finder Service for MedGuide
 * Uses Overpass API to find real clinics from OpenStreetMap data
 */

import LocationService, { UserLocation } from './LocationService';

interface Clinic {
  id: string;
  name: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude: number;
  longitude: number;
  phone?: string;
  email?: string;
  website?: string;
  specializations: string[];
  services: string[];
  rating: number;
  reviews: number;
  openingHours: {
    [key: string]: {
      open: string;
      close: string;
      is24Hours?: boolean;
      isClosed?: boolean;
    };
  };
  languages: string[];
  facilities: string[];
  emergencyServices: boolean;
  insurance: string[];
  distance?: number; // Added when searching
  osmId?: string; // OpenStreetMap ID
  amenity?: string; // OSM amenity type
}

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  tags?: {
    [key: string]: string;
  };
  center?: {
    lat: number;
    lon: number;
  };
}

interface OverpassResponse {
  version: number;
  generator: string;
  elements: OverpassElement[];
}

interface ClinicSearchOptions {
  specialization?: string;
  maxDistance?: number; // in kilometers
  minRating?: number;
  emergencyOnly?: boolean;
  language?: string;
  sortBy?: 'distance' | 'rating' | 'name';
  limit?: number;
}

interface MedicalSpecialization {
  id: string;
  name: string;
  tamilName: string;
  keywords: string[];
  tamilKeywords: string[];
  urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';
  description: string;
}

class ClinicFinderService {
  private locationService: LocationService;
  private specializations: MedicalSpecialization[] = [];
  private overpassApiUrl = 'https://overpass-api.de/api/interpreter';
  private cache: Map<string, { data: Clinic[], timestamp: number }> = new Map();
  private cacheTimeout = 10 * 60 * 1000; // 10 minutes

  constructor(locationService: LocationService) {
    this.locationService = locationService;
    this.initializeSpecializations();
    console.log('🏥 Clinic Finder Service initialized with Overpass API integration');
  }

  /**
   * Build Overpass query for healthcare facilities
   */
  private buildOverpassQuery(lat: number, lon: number, radius: number = 5000, specialization?: string): string {
    const bbox = this.getBoundingBox(lat, lon, radius);
    
    let amenityFilter = '';
    if (specialization === 'emergency') {
      amenityFilter = `
        [amenity~"^(hospital|emergency)$"]
        [emergency~"^(yes|hospital)$"]`;
    } else {
      amenityFilter = `
        [amenity~"^(hospital|clinic|doctors|pharmacy)$"]`;
    }
    
    return `
      [out:json][timeout:25];
      (
        node${amenityFilter}(${bbox.south},${bbox.west},${bbox.north},${bbox.east});
        way${amenityFilter}(${bbox.south},${bbox.west},${bbox.north},${bbox.east});
        relation${amenityFilter}(${bbox.south},${bbox.west},${bbox.north},${bbox.east});
      );
      out center meta;
    `;
  }
  
  /**
   * Calculate bounding box for given center and radius
   */
  private getBoundingBox(lat: number, lon: number, radiusMeters: number) {
    const earthRadius = 6371000; // Earth's radius in meters
    const latOffset = (radiusMeters / earthRadius) * (180 / Math.PI);
    const lonOffset = (radiusMeters / (earthRadius * Math.cos(lat * Math.PI / 180))) * (180 / Math.PI);
    
    return {
      north: lat + latOffset,
      south: lat - latOffset,
      east: lon + lonOffset,
      west: lon - lonOffset
    };
  }
  
  /**
   * Query Overpass API for healthcare facilities
   */
  private async queryOverpassAPI(query: string): Promise<OverpassResponse> {
    const response = await fetch(this.overpassApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
      },
      body: `data=${encodeURIComponent(query)}`
    });
    
    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  /**
   * Convert Overpass element to Clinic object
   */
  private convertToClinic(element: OverpassElement): Clinic | null {
    const tags = element.tags || {};
    const name = tags.name || tags['name:en'] || tags.brand || 'Unnamed Healthcare Facility';
    
    // Skip if no name and not a major facility
    if (!tags.name && !tags.brand && !tags['name:en']) {
      return null;
    }
    
    // Determine coordinates
    const lat = element.lat || element.center?.lat;
    const lon = element.lon || element.center?.lon;
    
    if (!lat || !lon) {
      return null;
    }
    
    // Build address
    const addressParts = [
      tags['addr:housenumber'],
      tags['addr:street'],
      tags['addr:suburb'] || tags['addr:neighbourhood'],
      tags['addr:city'],
      tags['addr:state'],
      tags['addr:postcode']
    ].filter(Boolean);
    
    const address = addressParts.length > 0 
      ? addressParts.join(', ')
      : `${lat.toFixed(4)}, ${lon.toFixed(4)}`; // Fallback to coordinates
    
    // Determine specializations based on tags
    const specializations = this.determineSpecializations(tags);
    
    // Determine if it's an emergency facility
    const emergencyServices = !!(tags.emergency === 'yes' || 
                                tags.emergency === 'hospital' ||
                                tags.amenity === 'hospital' ||
                                tags['healthcare:speciality']?.includes('emergency'));
    
    // Parse opening hours
    const openingHours = this.parseOpeningHours(tags.opening_hours || '');
    
    // Determine services
    const services = this.determineServices(tags);
    
    // Generate rating (placeholder - in real app, you'd integrate with review services)
    const rating = this.generateEstimatedRating(tags);
    
    return {
      id: `osm-${element.type}-${element.id}`,
      osmId: `${element.type}/${element.id}`,
      name,
      address,
      city: tags['addr:city'],
      state: tags['addr:state'],
      pincode: tags['addr:postcode'],
      latitude: lat,
      longitude: lon,
      phone: tags.phone || tags.contact?.phone,
      email: tags.email || tags.contact?.email,
      website: tags.website || tags.contact?.website,
      amenity: tags.amenity,
      specializations,
      services,
      rating,
      reviews: Math.floor(Math.random() * 500) + 50, // Placeholder
      openingHours,
      languages: this.determineLanguages(tags),
      facilities: this.determineFacilities(tags),
      emergencyServices,
      insurance: ['General'] // Placeholder
    };
  }
  
  /**
   * Determine specializations from OSM tags
   */
  private determineSpecializations(tags: { [key: string]: string }): string[] {
    const specializations: string[] = [];
    
    if (tags.amenity === 'hospital') {
      specializations.push('general_medicine', 'emergency');
    }
    
    if (tags.amenity === 'clinic' || tags.amenity === 'doctors') {
      specializations.push('general_medicine');
    }
    
    if (tags['healthcare:speciality']) {
      const specialities = tags['healthcare:speciality'].split(';');
      for (const spec of specialities) {
        const normalized = this.normalizeSpecialization(spec.trim());
        if (normalized) {
          specializations.push(normalized);
        }
      }
    }
    
    if (tags.emergency === 'yes' || tags.emergency === 'hospital') {
      specializations.push('emergency');
    }
    
    return [...new Set(specializations)]; // Remove duplicates
  }
  
  /**
   * Normalize healthcare specialization names
   */
  private normalizeSpecialization(spec: string): string | null {
    const specMap: { [key: string]: string } = {
      'general': 'general_medicine',
      'family_medicine': 'general_medicine',
      'internal_medicine': 'general_medicine',
      'cardiology': 'cardiology',
      'neurology': 'neurology',
      'orthopedics': 'orthopedics',
      'orthopaedics': 'orthopedics',
      'pediatrics': 'pediatrics',
      'paediatrics': 'pediatrics',
      'gynecology': 'gynecology',
      'gynaecology': 'gynecology',
      'dermatology': 'dermatology',
      'gastroenterology': 'gastroenterology',
      'oncology': 'oncology',
      'cancer': 'oncology',
      'emergency': 'emergency',
      'trauma': 'emergency'
    };
    
    return specMap[spec.toLowerCase()] || null;
  }
  
  /**
   * Parse opening hours from OSM format
   */
  private parseOpeningHours(openingHours: string) {
    const defaultHours = {
      'Monday': { open: '08:00', close: '18:00' },
      'Tuesday': { open: '08:00', close: '18:00' },
      'Wednesday': { open: '08:00', close: '18:00' },
      'Thursday': { open: '08:00', close: '18:00' },
      'Friday': { open: '08:00', close: '18:00' },
      'Saturday': { open: '08:00', close: '14:00' },
      'Sunday': { open: '08:00', close: '12:00', isClosed: true }
    };
    
    if (!openingHours) return defaultHours;
    
    // Handle 24/7
    if (openingHours === '24/7') {
      const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const result: any = {};
      allDays.forEach(day => {
        result[day] = { open: '00:00', close: '23:59', is24Hours: true };
      });
      return result;
    }
    
    // For complex opening hours, return default (would need a proper parser for full OSM support)
    return defaultHours;
  }
  
  /**
   * Determine services from tags
   */
  private determineServices(tags: { [key: string]: string }): string[] {
    const services: string[] = [];
    
    if (tags.amenity === 'hospital') {
      services.push('Emergency Care', 'Inpatient Care', 'Surgery');
    }
    
    if (tags.amenity === 'clinic') {
      services.push('Outpatient Care', 'Consultation');
    }
    
    if (tags.emergency === 'yes') {
      services.push('Emergency Services');
    }
    
    if (tags['healthcare:speciality']?.includes('surgery')) {
      services.push('Surgery');
    }
    
    return services;
  }
  
  /**
   * Generate estimated rating based on facility type and tags
   */
  private generateEstimatedRating(tags: { [key: string]: string }): number {
    let rating = 3.5; // Base rating
    
    if (tags.amenity === 'hospital') rating += 0.5;
    if (tags.emergency === 'yes') rating += 0.3;
    if (tags.website) rating += 0.2;
    if (tags.phone) rating += 0.2;
    if (tags['healthcare:speciality']) rating += 0.3;
    
    return Math.min(5.0, Math.round(rating * 10) / 10);
  }
  
  /**
   * Determine supported languages
   */
  private determineLanguages(tags: { [key: string]: string }): string[] {
    const languages = ['English']; // Default
    
    // Add local language based on country
    if (tags['addr:country'] === 'IN' || !tags['addr:country']) {
      languages.push('Hindi');
      
      // Add regional languages based on state
      const state = tags['addr:state']?.toLowerCase();
      if (state?.includes('tamil')) {
        languages.push('Tamil');
      } else if (state?.includes('karnataka')) {
        languages.push('Kannada');
      } else if (state?.includes('kerala')) {
        languages.push('Malayalam');
      }
    }
    
    return languages;
  }
  
  /**
   * Determine available facilities
   */
  private determineFacilities(tags: { [key: string]: string }): string[] {
    const facilities: string[] = [];
    
    if (tags.wheelchair === 'yes') facilities.push('Wheelchair Access');
    if (tags.parking) facilities.push('Parking');
    if (tags.internet_access === 'wifi') facilities.push('Wi-Fi');
    if (tags.amenity === 'hospital') {
      facilities.push('Reception', 'Waiting Area');
    }
    
    return facilities;
  }

  /**
   * Initialize medical specializations and their mappings
   */
  private initializeSpecializations(): void {
    this.specializations = [
      {
        id: 'general_medicine',
        name: 'General Medicine',
        tamilName: 'பொது மருத்துவம்',
        keywords: ['fever', 'headache', 'body pain', 'cold', 'flu', 'general health', 'check up'],
        tamilKeywords: ['காய்ச்சல்', 'தலைவலி', 'உடல் வலி', 'சளி', 'பொது மருத்துவம்', 'பரிசோதனை'],
        urgencyLevel: 'low',
        description: 'General health issues, fever, infections, routine checkups'
      },
      {
        id: 'cardiology',
        name: 'Cardiology',
        tamilName: 'இதய மருத்துவம்',
        keywords: ['heart', 'chest pain', 'cardiac', 'heart attack', 'palpitation', 'blood pressure'],
        tamilKeywords: ['இதயம்', 'மார்பு வலி', 'இதய நோய்', 'இரத்த அழுத்தம்', 'இதய துடிப்பு'],
        urgencyLevel: 'high',
        description: 'Heart conditions, chest pain, cardiac emergencies'
      },
      {
        id: 'neurology',
        name: 'Neurology',
        tamilName: 'நரம்பு மருத்துவம்',
        keywords: ['brain', 'nerve', 'headache', 'migraine', 'seizure', 'stroke', 'paralysis'],
        tamilKeywords: ['மூளை', 'நரம்பு', 'தலைவலி', 'வலிப்பு', 'பக்கவாதம்', 'தலைவலி நோய்'],
        urgencyLevel: 'high',
        description: 'Brain, nerve, and neurological disorders'
      },
      {
        id: 'orthopedics',
        name: 'Orthopedics',
        tamilName: 'எலும்பு மருத்துவம்',
        keywords: ['bone', 'joint', 'fracture', 'arthritis', 'back pain', 'knee pain', 'shoulder'],
        tamilKeywords: ['எலும்பு', 'மூட்டு', 'எலும்பு முறிவு', 'முதுகு வலி', 'முழங்கால் வலி', 'தோள்பட்டை'],
        urgencyLevel: 'medium',
        description: 'Bone, joint, and musculoskeletal problems'
      },
      {
        id: 'pediatrics',
        name: 'Pediatrics',
        tamilName: 'குழந்தைகள் மருத்துவம்',
        keywords: ['child', 'baby', 'pediatric', 'vaccination', 'child fever', 'growth'],
        tamilKeywords: ['குழந்தை', 'சிசு', 'குழந்தை மருத்துவம்', 'தடுப்பூசி', 'குழந்தை வளர்ச்சி'],
        urgencyLevel: 'medium',
        description: 'Medical care for infants, children, and adolescents'
      },
      {
        id: 'gynecology',
        name: 'Gynecology',
        tamilName: 'பெண்கள் மருத்துவம்',
        keywords: ['women', 'pregnancy', 'gynecology', 'obstetrics', 'menstrual', 'fertility'],
        tamilKeywords: ['பெண்கள்', 'கர்ப்பம்', 'மகப்பேறு', 'மாதவிடாய்', 'கருவுறுதல்'],
        urgencyLevel: 'medium',
        description: 'Women\'s health, pregnancy, and reproductive care'
      },
      {
        id: 'dermatology',
        name: 'Dermatology',
        tamilName: 'தோல் மருத்துவம்',
        keywords: ['skin', 'rash', 'allergy', 'dermatology', 'acne', 'eczema'],
        tamilKeywords: ['தோல்', 'சொறி', 'ஒவ்வாமை', 'தோல் நோய்', 'முகப்பருக்கள்'],
        urgencyLevel: 'low',
        description: 'Skin conditions, allergies, and dermatological issues'
      },
      {
        id: 'gastroenterology',
        name: 'Gastroenterology',
        tamilName: 'இரைப்பை குடல் மருத்துவம்',
        keywords: ['stomach', 'digestive', 'gastro', 'abdominal pain', 'diarrhea', 'constipation'],
        tamilKeywords: ['வயிறு', 'செரிமானம்', 'வயிற்று வலி', 'வயிற்றுப்போக்கு', 'மலச்சிக்கல்'],
        urgencyLevel: 'medium',
        description: 'Digestive system and gastrointestinal disorders'
      },
      {
        id: 'emergency',
        name: 'Emergency',
        tamilName: 'அவசர சிகிச்சை',
        keywords: ['emergency', 'urgent', 'accident', 'trauma', 'critical', 'severe pain'],
        tamilKeywords: ['அவசரம்', 'அவசர சிகிச்சை', 'விபத்து', 'கடுமையான வலி', 'முக்கியமான'],
        urgencyLevel: 'emergency',
        description: 'Emergency medical care, accidents, trauma'
      },
      {
        id: 'oncology',
        name: 'Oncology',
        tamilName: 'புற்றுநோய் மருத்துவம்',
        keywords: ['cancer', 'tumor', 'oncology', 'chemotherapy', 'radiation'],
        tamilKeywords: ['புற்றுநோய்', 'கட்டி', 'புற்றுநோய் சிகிச்சை'],
        urgencyLevel: 'high',
        description: 'Cancer treatment and oncological care'
      }
    ];
  }

  /**
   * Find nearby clinics based on user location using Overpass API
   */
  async findNearbyClinics(options: ClinicSearchOptions = {}): Promise<Clinic[]> {
    try {
      const userLocation = await this.locationService.getLocationWithCache();
      return this.searchClinicsWithOverpass(userLocation, options);
    } catch (error) {
      console.error('❌ Failed to get location for clinic search:', error);
      throw new Error('Location required for clinic search. Please enable location access.');
    }
  }

  /**
   * Search clinics using Overpass API
   */
  private async searchClinicsWithOverpass(userLocation: UserLocation, options: ClinicSearchOptions): Promise<Clinic[]> {
    const {
      specialization,
      maxDistance = 5000, // Default 5km radius in meters for Overpass
      minRating = 0,
      emergencyOnly = false,
      language,
      sortBy = 'distance',
      limit = 20 // Get more from API, then filter
    } = options;

    // Check cache first
    const cacheKey = `${userLocation.latitude.toFixed(4)}_${userLocation.longitude.toFixed(4)}_${maxDistance}_${specialization || 'all'}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      console.log('📋 Using cached clinic data');
      return this.applyFiltersAndSort(cached.data, userLocation, options);
    }

    try {
      console.log(`🏥 Searching clinics via Overpass API within ${maxDistance}m`);
      
      // Build and execute Overpass query
      const query = this.buildOverpassQuery(
        userLocation.latitude, 
        userLocation.longitude, 
        maxDistance, 
        specialization
      );
      
      console.log('🔍 Overpass query:', query.replace(/\s+/g, ' ').trim());
      
      const response = await this.queryOverpassAPI(query);
      console.log(`📊 Found ${response.elements.length} healthcare facilities`);
      
      // Convert elements to clinics
      const clinics: Clinic[] = [];
      for (const element of response.elements) {
        const clinic = this.convertToClinic(element);
        if (clinic) {
          // Calculate distance
          clinic.distance = this.locationService.calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            clinic.latitude,
            clinic.longitude
          );
          clinics.push(clinic);
        }
      }
      
      console.log(`✅ Converted ${clinics.length} valid clinics`);
      
      // Cache the results
      this.cache.set(cacheKey, {
        data: clinics,
        timestamp: Date.now()
      });
      
      return this.applyFiltersAndSort(clinics, userLocation, options);
      
    } catch (error) {
      console.error('❌ Overpass API error:', error);
      throw new Error(`Failed to search clinics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Apply filters and sorting to clinic results
   */
  private applyFiltersAndSort(clinics: Clinic[], userLocation: UserLocation, options: ClinicSearchOptions): Clinic[] {
    const {
      specialization,
      maxDistance = 5000,
      minRating = 0,
      emergencyOnly = false,
      language,
      sortBy = 'distance',
      limit = 10
    } = options;
    
    let results = [...clinics];
    
    // Apply filters
    results = results.filter(clinic => {
      // Distance filter (convert km to meters if needed)
      const maxDistanceMeters = maxDistance > 100 ? maxDistance : maxDistance * 1000;
      if (clinic.distance && clinic.distance * 1000 > maxDistanceMeters) return false;
      
      // Rating filter
      if (clinic.rating < minRating) return false;
      
      // Emergency filter
      if (emergencyOnly && !clinic.emergencyServices) return false;
      
      // Specialization filter
      if (specialization && !clinic.specializations.includes(specialization)) return false;
      
      // Language filter
      if (language && !clinic.languages.some(lang => 
        lang.toLowerCase().includes(language.toLowerCase())
      )) return false;
      
      return true;
    });
    
    // Sort results
    results.sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          return (a.distance || 0) - (b.distance || 0);
        case 'rating':
          return b.rating - a.rating;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return (a.distance || 0) - (b.distance || 0);
      }
    });
    
    // Limit results
    return results.slice(0, limit);
  }

  /**
   * Get clinic suggestions based on symptoms/condition
   */
  suggestClinicsBySymptoms(symptoms: string, language: 'en' | 'ta' = 'en'): {
    specializations: MedicalSpecialization[];
    urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';
    recommendations: string[];
  } {
    const lowerSymptoms = symptoms.toLowerCase();
    const matchedSpecializations: MedicalSpecialization[] = [];
    let maxUrgency: 'low' | 'medium' | 'high' | 'emergency' = 'low';

    // Find matching specializations
    for (const spec of this.specializations) {
      const keywords = language === 'ta' ? spec.tamilKeywords : spec.keywords;
      const hasMatch = keywords.some(keyword => 
        lowerSymptoms.includes(keyword.toLowerCase())
      );

      if (hasMatch) {
        matchedSpecializations.push(spec);
        
        // Update urgency level
        const urgencyLevels = { 'low': 1, 'medium': 2, 'high': 3, 'emergency': 4 };
        if (urgencyLevels[spec.urgencyLevel] > urgencyLevels[maxUrgency]) {
          maxUrgency = spec.urgencyLevel;
        }
      }
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(matchedSpecializations, maxUrgency, language);

    return {
      specializations: matchedSpecializations,
      urgencyLevel: maxUrgency,
      recommendations
    };
  }

  /**
   * Generate recommendations based on matched specializations
   */
  private generateRecommendations(
    specializations: MedicalSpecialization[],
    urgencyLevel: 'low' | 'medium' | 'high' | 'emergency',
    language: 'en' | 'ta'
  ): string[] {
    const recommendations: string[] = [];

    if (urgencyLevel === 'emergency') {
      recommendations.push(
        language === 'en' 
          ? "🚨 This appears to be an emergency! Please call 108 or visit the nearest emergency room immediately."
          : "🚨 இது அவசர நிலைமை போல் தெரிகிறது! உடனடியாக 108 ஐ அழைக்கவும் அல்லது அருகிலுள்ள அவசர சிகிச்சை பிரிவுக்குச் செல்லவும்."
      );
    }

    if (specializations.length > 0) {
      const specNames = specializations.map(s => 
        language === 'ta' ? s.tamilName : s.name
      ).join(', ');
      
      recommendations.push(
        language === 'en'
          ? `Based on your symptoms, consider visiting a ${specNames} specialist.`
          : `உங்கள் அறிகுறிகளின் அடிப்படையில், ${specNames} நிபுணரை சந்திக்க பரிசீலிக்கவும்.`
      );
    }

    if (urgencyLevel === 'high') {
      recommendations.push(
        language === 'en'
          ? "⚠️ This requires prompt medical attention. Please seek care as soon as possible."
          : "⚠️ இதற்கு உடனடி மருத்துவ கவனம் தேவை. முடிந்தவரை விரைவில் சிகிச்சை பெறவும்."
      );
    }

    return recommendations;
  }


  /**
   * Get all specializations
   */
  getAllSpecializations(): MedicalSpecialization[] {
    return [...this.specializations];
  }

  /**
   * Check if clinic is open now
   */
  isClinicOpen(clinic: Clinic): boolean {
    const now = new Date();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    
    const todayHours = clinic.openingHours[dayName];
    if (!todayHours || todayHours.isClosed) return false;
    if (todayHours.is24Hours) return true;
    
    return currentTime >= todayHours.open && currentTime <= todayHours.close;
  }

  /**
   * Get emergency clinics only
   */
  async getEmergencyClinics(): Promise<Clinic[]> {
    return this.findNearbyClinics({
      emergencyOnly: true,
      sortBy: 'distance',
      limit: 5
    });
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ Clinic cache cleared');
  }

  /**
   * Get cache status
   */
  getCacheStatus(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export default ClinicFinderService;
export type { Clinic, ClinicSearchOptions, MedicalSpecialization };