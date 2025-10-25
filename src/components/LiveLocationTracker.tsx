/**
 * Live Location Tracker Component
 * Provides real-time GPS tracking with visual feedback
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MapPin, Target, Navigation, Clock, Satellite, 
  AlertTriangle, CheckCircle, Loader2, RefreshCw 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveLocation } from '@/hooks/useLiveLocation';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import type { UserLocation } from '@/services/clinicServices';

interface LiveLocationTrackerProps {
  onLocationUpdate?: (location: UserLocation) => void;
  onError?: (error: any) => void;
  autoStart?: boolean;
  showMap?: boolean;
  compact?: boolean;
  className?: string;
}

const LiveLocationTracker: React.FC<LiveLocationTrackerProps> = ({
  onLocationUpdate,
  onError,
  autoStart = false,
  showMap = false,
  compact = false,
  className = ''
}) => {
  const { i18n } = useTranslation(['common']);
  const { toast } = useToast();
  
  const {
    location,
    isTracking,
    isLoading,
    error,
    accuracy,
    source,
    lastUpdate,
    startTracking,
    stopTracking,
    getCurrentLocation,
    getLocationQuality,
    isLocationStale
  } = useLiveLocation({
    autoStart,
    onLocationUpdate,
    onError
  });

  const [trackingDuration, setTrackingDuration] = useState(0);

  // Update tracking duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTracking) {
      interval = setInterval(() => {
        setTrackingDuration(prev => prev + 1);
      }, 1000);
    } else {
      setTrackingDuration(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking]);

  // Handle single location request
  const handleGetCurrentLocation = async () => {
    try {
      await getCurrentLocation();
      toast({
        title: i18n.language === 'en' ? 'Location Found' : 'இருப்பிடம் கண்டுபிடிக்கப்பட்டது',
        description: i18n.language === 'en' 
          ? 'Your current location has been detected'
          : 'உங்கள் தற்போதைய இருப்பிடம் கண்டறியப்பட்டது',
      });
    } catch (err) {
      toast({
        title: i18n.language === 'en' ? 'Location Error' : 'இருப்பிட பிழை',
        description: i18n.language === 'en' ? 'Failed to get location' : 'இருப்பிடம் பெற முடியவில்லை',
        variant: 'destructive',
      });
    }
  };

  // Get quality color
  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-700 bg-green-100 border-green-200';
      case 'good': return 'text-blue-700 bg-blue-100 border-blue-200';
      case 'fair': return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'poor': return 'text-red-700 bg-red-100 border-red-200';
      default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  // Format tracking duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          {isTracking ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-green-700 font-medium">
                {i18n.language === 'en' ? 'Live GPS' : 'நேரலை GPS'}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full" />
              <span className="text-sm text-gray-600">
                {i18n.language === 'en' ? 'GPS Off' : 'GPS அணைக்கப்பட்டது'}
              </span>
            </div>
          )}
        </div>

        {/* Location Info */}
        {location && (
          <Badge className={getQualityColor(getLocationQuality())}>
            ±{accuracy?.toFixed(1)}m
          </Badge>
        )}

        {/* Controls */}
        <div className="flex gap-1">
          {!isTracking ? (
            <Button
              onClick={startTracking}
              disabled={isLoading}
              size="sm"
              variant="outline"
            >
              {isLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Satellite className="w-3 h-3" />
              )}
            </Button>
          ) : (
            <Button
              onClick={stopTracking}
              size="sm"
              variant="outline"
            >
              <Target className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className={`border-0 shadow-lg ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Satellite className="w-5 h-5 text-blue-600" />
            {i18n.language === 'en' ? 'Live GPS Tracking' : 'நேரலை GPS கண்காணிப்பு'}
          </CardTitle>
          
          {isTracking && (
            <Badge variant="outline" className="text-green-700 bg-green-50 border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2" />
              {formatDuration(trackingDuration)}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {error.message}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Location Information */}
        {location && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <MapPin className="w-4 h-4 text-gray-600 mx-auto mb-1" />
              <div className="text-xs text-gray-600 mb-1">
                {i18n.language === 'en' ? 'Latitude' : 'அட்சரேகை'}
              </div>
              <div className="text-sm font-mono font-semibold">
                {location.latitude.toFixed(6)}
              </div>
            </div>

            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <MapPin className="w-4 h-4 text-gray-600 mx-auto mb-1" />
              <div className="text-xs text-gray-600 mb-1">
                {i18n.language === 'en' ? 'Longitude' : 'தீர்க்கரேகை'}
              </div>
              <div className="text-sm font-mono font-semibold">
                {location.longitude.toFixed(6)}
              </div>
            </div>

            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Target className="w-4 h-4 text-gray-600 mx-auto mb-1" />
              <div className="text-xs text-gray-600 mb-1">
                {i18n.language === 'en' ? 'Accuracy' : 'துல்லியம்'}
              </div>
              <Badge className={getQualityColor(getLocationQuality())}>
                ±{accuracy?.toFixed(1)}m
              </Badge>
            </div>

            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Clock className="w-4 h-4 text-gray-600 mx-auto mb-1" />
              <div className="text-xs text-gray-600 mb-1">
                {i18n.language === 'en' ? 'Updated' : 'புதுப்பிக்கப்பட்டது'}
              </div>
              <div className="text-sm font-semibold">
                {lastUpdate ? lastUpdate.toLocaleTimeString() : '--'}
              </div>
            </div>
          </motion.div>
        )}

        {/* Additional Info */}
        {location && (
          <div className="flex flex-wrap gap-2 justify-center">
            {source && (
              <Badge variant="outline" className="text-purple-700 bg-purple-50 border-purple-200">
                {source}
              </Badge>
            )}
            
            {location.altitude && (
              <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200">
                🏔️ {location.altitude.toFixed(1)}m
              </Badge>
            )}
            
            {location.speed !== undefined && location.speed > 0 && (
              <Badge variant="outline" className="text-green-700 bg-green-50 border-green-200">
                🚗 {(location.speed * 3.6).toFixed(1)} km/h
              </Badge>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-3 justify-center">
          {!isTracking ? (
            <>
              <Button
                onClick={startTracking}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Satellite className="w-4 h-4 mr-2" />
                )}
                {i18n.language === 'en' ? 'Start Live Tracking' : 'நேரலை கண்காணிப்பு தொடங்கு'}
              </Button>
              
              <Button
                onClick={handleGetCurrentLocation}
                disabled={isLoading}
                variant="outline"
              >
                <Target className="w-4 h-4 mr-2" />
                {i18n.language === 'en' ? 'Get Location' : 'இருப்பிடம் பெறு'}
              </Button>
            </>
          ) : (
            <Button
              onClick={stopTracking}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {i18n.language === 'en' ? 'Stop Tracking' : 'கண்காணிப்பு நிறுத்து'}
            </Button>
          )}
        </div>

        {/* Quick Actions */}
        {location && (
          <div className="flex gap-2 justify-center">
            <Button
              onClick={() => {
                const url = `https://www.google.com/maps/search/${location.latitude},${location.longitude}`;
                window.open(url, '_blank');
              }}
              size="sm"
              variant="ghost"
            >
              <Navigation className="w-3 h-3 mr-1" />
              {i18n.language === 'en' ? 'View on Map' : 'வரைபடத்தில் பார்க்க'}
            </Button>
            
            <Button
              onClick={() => {
                const coords = `${location.latitude.toFixed(8)}, ${location.longitude.toFixed(8)}`;
                navigator.clipboard.writeText(coords);
                toast({
                  title: i18n.language === 'en' ? 'Copied!' : 'நகலெடுக்கப்பட்டது!',
                  description: i18n.language === 'en' ? 'Coordinates copied to clipboard' : 'ஆயத்தொலைவுகள் கிளிப்போர்டுக்கு நகலெடுக்கப்பட்டன',
                });
              }}
              size="sm"
              variant="ghost"
            >
              📋 {i18n.language === 'en' ? 'Copy' : 'நகல்'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveLocationTracker;