/**
 * Test file for Clinic Finder functionality
 * Run this to test location services and Overpass API integration
 */

import LocationService from './services/LocationService';
import ClinicFinderService from './services/ClinicFinderService';

// Test function
export async function testClinicFinder() {
  console.log('🧪 Testing Clinic Finder functionality...');

  try {
    // Initialize services
    const locationService = new LocationService();
    const clinicFinderService = new ClinicFinderService(locationService);

    console.log('📍 Location service supported:', locationService.isSupported());

    // Test location permissions
    try {
      console.log('🔐 Checking location permissions...');
      const permissions = await locationService.checkPermissionStatus();
      console.log('Permission status:', permissions);

      if (permissions.granted || permissions.prompt) {
        console.log('📍 Getting user location...');
        const location = await locationService.getCurrentLocation();
        console.log('✅ Location obtained:', {
          lat: location.latitude.toFixed(6),
          lng: location.longitude.toFixed(6),
          accuracy: location.accuracy + 'm'
        });

        // Test clinic search
        console.log('🏥 Searching for nearby clinics...');
        const clinics = await clinicFinderService.findNearbyClinics({
          maxDistance: 5000, // 5km
          limit: 10
        });

        console.log(`✅ Found ${clinics.length} clinics:`, clinics.map(c => ({
          name: c.name,
          address: c.address,
          distance: c.distance?.toFixed(2) + 'km',
          rating: c.rating,
          emergency: c.emergencyServices
        })));

        // Test emergency clinics
        console.log('🚨 Searching for emergency clinics...');
        const emergencyClinics = await clinicFinderService.getEmergencyClinics();
        console.log(`✅ Found ${emergencyClinics.length} emergency facilities`);

        // Test specialization matching
        console.log('🩺 Testing symptom analysis...');
        const symptoms = 'I have chest pain and heart palpitations';
        const suggestions = clinicFinderService.suggestClinicsBySymptoms(symptoms, 'en');
        console.log('AI suggestions:', suggestions);

        return {
          success: true,
          location,
          clinics,
          emergencyClinics,
          suggestions
        };

      } else {
        throw new Error('Location permission denied');
      }

    } catch (locationError) {
      console.warn('⚠️ Location error:', locationError);
      
      // Test with fallback location (Chennai)
      console.log('🔄 Using fallback location (Chennai)...');
      const fallbackLocation = {
        latitude: 13.0827,
        longitude: 80.2707,
        accuracy: 100,
        timestamp: Date.now()
      };

      // This won't work without actual user location for Overpass API
      console.log('ℹ️ Overpass API requires actual user location. Skipping clinic search.');
      
      return {
        success: false,
        error: 'Location required for Overpass API',
        fallbackLocation
      };
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Auto-run test if this file is imported directly
if (typeof window !== 'undefined') {
  console.log('🚀 Running Clinic Finder test...');
  testClinicFinder().then(result => {
    console.log('📊 Test result:', result);
  });
}