/**
 * React Hook for Live GPS Location Tracking
 * Provides real-time location updates with high accuracy
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { locationService } from '@/services/clinicServices';
import type { UserLocation, LocationError } from '@/services/clinicServices';

interface LiveLocationState {
  location: UserLocation | null;
  isTracking: boolean;
  isLoading: boolean;
  error: LocationError | null;
  accuracy: number | null;
  source: string | null;
  lastUpdate: Date | null;
}

interface LiveLocationOptions {
  autoStart?: boolean;
  highAccuracy?: boolean;
  trackMovement?: boolean;
  onLocationUpdate?: (location: UserLocation) => void;
  onError?: (error: LocationError) => void;
}

export const useLiveLocation = (options: LiveLocationOptions = {}) => {
  const {
    autoStart = false,
    highAccuracy = true,
    trackMovement = true,
    onLocationUpdate,
    onError
  } = options;

  const [state, setState] = useState<LiveLocationState>({
    location: null,
    isTracking: false,
    isLoading: false,
    error: null,
    accuracy: null,
    source: null,
    lastUpdate: null
  });

  const callbacksRef = useRef({ onLocationUpdate, onError });
  callbacksRef.current = { onLocationUpdate, onError };

  // Location update callback
  const handleLocationUpdate = useCallback((location: UserLocation) => {
    setState(prev => ({
      ...prev,
      location,
      accuracy: location.accuracy,
      source: location.source || null,
      lastUpdate: new Date(),
      isLoading: false,
      error: null
    }));

    // Call external callback if provided
    if (callbacksRef.current.onLocationUpdate) {
      callbacksRef.current.onLocationUpdate(location);
    }
  }, []);

  // Error callback
  const handleError = useCallback((error: LocationError) => {
    setState(prev => ({
      ...prev,
      error,
      isLoading: false
    }));

    // Call external callback if provided
    if (callbacksRef.current.onError) {
      callbacksRef.current.onError(error);
    }
  }, []);

  // Start live tracking
  const startTracking = useCallback(() => {
    if (state.isTracking) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    const success = locationService.startLiveTracking(
      handleLocationUpdate,
      handleError
    );

    if (success) {
      setState(prev => ({ ...prev, isTracking: true }));
      console.log('🎯 Live location tracking started via hook');
    } else {
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: { code: 0, message: 'Failed to start tracking' }
      }));
    }
  }, [state.isTracking, handleLocationUpdate, handleError]);

  // Stop live tracking
  const stopTracking = useCallback(() => {
    if (!state.isTracking) return;

    locationService.stopLiveTracking(handleLocationUpdate, handleError);
    setState(prev => ({ 
      ...prev, 
      isTracking: false,
      isLoading: false 
    }));
    console.log('🛑 Live location tracking stopped via hook');
  }, [state.isTracking, handleLocationUpdate, handleError]);

  // Get single high-accuracy location
  const getCurrentLocation = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const location = await locationService.getHighAccuracyLocation(3, 10);
      setState(prev => ({
        ...prev,
        location,
        accuracy: location.accuracy,
        source: location.source || null,
        lastUpdate: new Date(),
        isLoading: false,
        error: null
      }));
      return location;
    } catch (error) {
      const locationError = error as LocationError;
      setState(prev => ({
        ...prev,
        error: locationError,
        isLoading: false
      }));
      throw locationError;
    }
  }, []);

  // Auto-start tracking if requested
  useEffect(() => {
    if (autoStart && !state.isTracking) {
      startTracking();
    }

    // Cleanup on unmount
    return () => {
      if (state.isTracking) {
        locationService.stopLiveTracking(handleLocationUpdate, handleError);
      }
    };
  }, [autoStart]); // Only run on mount/unmount

  // Calculate distance moved since last update
  const getDistanceMoved = useCallback((newLocation: UserLocation): number => {
    if (!state.location) return 0;
    
    return locationService.calculateDistance(
      state.location.latitude,
      state.location.longitude,
      newLocation.latitude,
      newLocation.longitude
    );
  }, [state.location]);

  // Get location quality assessment
  const getLocationQuality = useCallback((): 'excellent' | 'good' | 'fair' | 'poor' => {
    if (!state.accuracy) return 'poor';
    
    if (state.accuracy <= 5) return 'excellent';
    if (state.accuracy <= 20) return 'good';
    if (state.accuracy <= 100) return 'fair';
    return 'poor';
  }, [state.accuracy]);

  // Check if location is stale
  const isLocationStale = useCallback((maxAgeMinutes: number = 5): boolean => {
    if (!state.lastUpdate) return true;
    
    const ageMs = Date.now() - state.lastUpdate.getTime();
    const ageMinutes = ageMs / (1000 * 60);
    return ageMinutes > maxAgeMinutes;
  }, [state.lastUpdate]);

  return {
    // State
    ...state,
    
    // Actions
    startTracking,
    stopTracking,
    getCurrentLocation,
    
    // Utilities
    getDistanceMoved,
    getLocationQuality,
    isLocationStale,
    
    // Status
    isSupported: locationService.isSupported(),
    isLiveTrackingActive: locationService.isLiveTrackingActive(),
    activeCallbacks: locationService.getActiveCallbackCount()
  };
};

export default useLiveLocation;