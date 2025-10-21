/**
 * Location Service for MedGuide
 * Handles geolocation, permissions, and location-based features
 */

interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface LocationError {
  code: number;
  message: string;
  details?: string;
}

interface LocationPermissionStatus {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
}

class LocationService {
  private currentLocation: UserLocation | null = null;
  private watchId: number | null = null;
  private permissionStatus: LocationPermissionStatus | null = null;

  constructor() {
    console.log('📍 Location Service initialized');
    this.checkPermissionStatus();
  }

  /**
   * Check if geolocation is supported by the browser
   */
  isSupported(): boolean {
    return 'geolocation' in navigator;
  }

  /**
   * Check current permission status for geolocation
   */
  async checkPermissionStatus(): Promise<LocationPermissionStatus> {
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        this.permissionStatus = {
          granted: permission.state === 'granted',
          denied: permission.state === 'denied',
          prompt: permission.state === 'prompt'
        };
        
        console.log('🔐 Location permission status:', permission.state);
        return this.permissionStatus;
      } catch (error) {
        console.warn('⚠️ Could not check permission status:', error);
      }
    }

    // Fallback for browsers that don't support permissions API
    this.permissionStatus = {
      granted: false,
      denied: false,
      prompt: true
    };
    
    return this.permissionStatus;
  }

  /**
   * Get current user location
   */
  async getCurrentLocation(): Promise<UserLocation> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        reject({
          code: 0,
          message: 'Geolocation is not supported by this browser',
          details: 'Please use a modern browser with geolocation support'
        });
        return;
      }

      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes cache
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: UserLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now()
          };

          this.currentLocation = location;
          console.log('📍 Location obtained:', { 
            lat: location.latitude.toFixed(6), 
            lng: location.longitude.toFixed(6),
            accuracy: location.accuracy + 'm'
          });
          
          resolve(location);
        },
        (error) => {
          const locationError = this.handleLocationError(error);
          console.error('❌ Location error:', locationError);
          reject(locationError);
        },
        options
      );
    });
  }

  /**
   * Start watching user location for real-time updates
   */
  watchLocation(callback: (location: UserLocation) => void, errorCallback?: (error: LocationError) => void): boolean {
    if (!this.isSupported()) {
      if (errorCallback) {
        errorCallback({
          code: 0,
          message: 'Geolocation not supported',
          details: 'Browser does not support geolocation'
        });
      }
      return false;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000 // 1 minute cache for watching
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location: UserLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now()
        };

        this.currentLocation = location;
        callback(location);
      },
      (error) => {
        const locationError = this.handleLocationError(error);
        if (errorCallback) {
          errorCallback(locationError);
        }
      },
      options
    );

    console.log('👁️ Started watching location');
    return true;
  }

  /**
   * Stop watching location
   */
  stopWatchingLocation(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      console.log('🛑 Stopped watching location');
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Get cached location if available and not too old
   */
  getCachedLocation(): UserLocation | null {
    if (!this.currentLocation) return null;
    
    const maxAge = 10 * 60 * 1000; // 10 minutes
    const age = Date.now() - this.currentLocation.timestamp;
    
    if (age > maxAge) {
      console.log('📍 Cached location too old, clearing cache');
      this.currentLocation = null;
      return null;
    }
    
    return this.currentLocation;
  }

  /**
   * Get location with fallback to cached location
   */
  async getLocationWithCache(): Promise<UserLocation> {
    const cached = this.getCachedLocation();
    if (cached) {
      console.log('📍 Using cached location');
      return cached;
    }
    
    return this.getCurrentLocation();
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Handle geolocation errors with user-friendly messages
   */
  private handleLocationError(error: GeolocationPositionError): LocationError {
    let message = '';
    let details = '';

    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = 'Location access denied by user';
        details = 'Please enable location permissions to find nearby clinics';
        break;
      case error.POSITION_UNAVAILABLE:
        message = 'Location information unavailable';
        details = 'GPS or network location services may be disabled';
        break;
      case error.TIMEOUT:
        message = 'Location request timed out';
        details = 'Please check your internet connection and try again';
        break;
      default:
        message = 'Unknown location error';
        details = 'An unexpected error occurred while getting your location';
        break;
    }

    return {
      code: error.code,
      message,
      details
    };
  }

  /**
   * Get user-friendly error messages in multiple languages
   */
  getErrorMessage(error: LocationError, language: 'en' | 'ta' = 'en'): string {
    const messages = {
      en: {
        [GeolocationPositionError.PERMISSION_DENIED]: 'Please allow location access to find nearby clinics. Check your browser settings and grant permission.',
        [GeolocationPositionError.POSITION_UNAVAILABLE]: 'Unable to determine your location. Please check your GPS or network settings.',
        [GeolocationPositionError.TIMEOUT]: 'Location request timed out. Please check your internet connection and try again.',
        default: 'Unable to get your location. Please enter your area manually or try again.'
      },
      ta: {
        [GeolocationPositionError.PERMISSION_DENIED]: 'அருகிலுள்ள கிளினிக்குகளைக் கண்டறிய இருப்பிட அணுகலை அனுமதிக்கவும். உங்கள் உலாவி அமைப்புகளைச் சரிபார்த்து அனுமதி வழங்கவும்.',
        [GeolocationPositionError.POSITION_UNAVAILABLE]: 'உங்கள் இருப்பிடத்தை தீர்மானிக்க முடியவில்லை. உங்கள் GPS அல்லது நெட்வொர்க் அமைப்புகளைச் சரிபார்க்கவும்.',
        [GeolocationPositionError.TIMEOUT]: 'இருப்பிட கோரிக்கை நேரம் முடிந்தது. உங்கள் இணைய இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.',
        default: 'உங்கள் இருப்பிடத்தைப் பெற முடியவில்லை. உங்கள் பகுதியை கைமுறையாக உள்ளிடுக அல்லது மீண்டும் முயற்சிக்கவும்.'
      }
    };

    return messages[language][error.code] || messages[language].default;
  }

  /**
   * Clear all location data
   */
  clearLocation(): void {
    this.currentLocation = null;
    this.stopWatchingLocation();
    console.log('🗑️ Location data cleared');
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isSupported: this.isSupported(),
      hasLocation: !!this.currentLocation,
      isWatching: this.watchId !== null,
      permissionStatus: this.permissionStatus,
      lastUpdate: this.currentLocation?.timestamp
    };
  }
}

export default LocationService;
export type { UserLocation, LocationError, LocationPermissionStatus };