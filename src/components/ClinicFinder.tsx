/**
 * Clinic Finder Component for MedGuide
 * Displays nearby clinics with maps, contact info, and specialties
 */

import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Star, Clock, Navigation, ExternalLink, Heart, AlertTriangle, CheckCircle, Map } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import ClinicMap from './ClinicMap';
import type { Clinic, MedicalSpecialization } from '../services/ClinicFinderService';
import type { UserLocation } from '../services/LocationService';

interface ClinicFinderProps {
  clinics: Clinic[];
  userLocation?: UserLocation;
  specializations?: MedicalSpecialization[];
  urgencyLevel?: 'low' | 'medium' | 'high' | 'emergency';
  recommendations?: string[];
  isLoading?: boolean;
  onCallClinic?: (clinic: Clinic) => void;
  onGetDirections?: (clinic: Clinic) => void;
  onViewDetails?: (clinic: Clinic) => void;
  showMap?: boolean;
  className?: string;
}

const ClinicFinder: React.FC<ClinicFinderProps> = ({
  clinics,
  userLocation,
  specializations = [],
  urgencyLevel,
  recommendations = [],
  isLoading = false,
  onCallClinic,
  onGetDirections,
  onViewDetails,
  showMap = true,
  className = ''
}) => {
  const { t, i18n } = useTranslation(['common', 'chat']);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  /**
   * Get urgency color class
   */
  const getUrgencyColor = (level?: string) => {
    switch (level) {
      case 'emergency': return 'bg-red-500/20 border-red-500/50 text-red-300';
      case 'high': return 'bg-orange-500/20 border-orange-500/50 text-orange-300';
      case 'medium': return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300';
      case 'low': return 'bg-green-500/20 border-green-500/50 text-green-300';
      default: return 'bg-gray-500/20 border-gray-500/50 text-gray-300';
    }
  };

  /**
   * Get specialization display name
   */
  const getSpecializationName = (specId: string) => {
    const specialization = specializations.find(s => s.id === specId);
    if (!specialization) return specId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    return i18n.language === 'ta' ? specialization.tamilName : specialization.name;
  };

  /**
   * Format opening hours
   */
  const formatOpeningHours = (clinic: Clinic) => {
    const now = new Date();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
    const todayHours = clinic.openingHours[dayName];
    
    if (!todayHours) return 'Hours not available';
    if (todayHours.isClosed) return i18n.language === 'en' ? 'Closed today' : 'இன்று மூடப்பட்டுள்ளது';
    if (todayHours.is24Hours) return i18n.language === 'en' ? 'Open 24 hours' : '24 மணி நேரம் திறந்திருக்கும்';
    
    return `${todayHours.open} - ${todayHours.close}`;
  };

  /**
   * Check if clinic is currently open
   */
  const isClinicOpen = (clinic: Clinic) => {
    const now = new Date();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.toTimeString().slice(0, 5);
    
    const todayHours = clinic.openingHours[dayName];
    if (!todayHours || todayHours.isClosed) return false;
    if (todayHours.is24Hours) return true;
    
    return currentTime >= todayHours.open && currentTime <= todayHours.close;
  };

  /**
   * Handle phone call
   */
  const handleCall = (clinic: Clinic) => {
    if (onCallClinic) {
      onCallClinic(clinic);
    } else {
      window.open(`tel:${clinic.phone}`, '_self');
    }
  };

  /**
   * Handle directions
   */
  const handleDirections = (clinic: Clinic) => {
    if (onGetDirections) {
      onGetDirections(clinic);
    } else {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${clinic.latitude},${clinic.longitude}`;
      window.open(url, '_blank');
    }
  };

  /**
   * Handle view details
   */
  const handleViewDetails = (clinic: Clinic) => {
    if (onViewDetails) {
      onViewDetails(clinic);
    } else if (clinic.website) {
      window.open(clinic.website, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
          <p className="text-white/60 text-sm">
            {i18n.language === 'en' ? 'Finding nearby clinics...' : 'அருகிலுள்ள கிளினிக்குகளை தேடுகிறேன்...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Urgency Alert */}
      {urgencyLevel && (
        <div className={`p-4 rounded-lg border ${getUrgencyColor(urgencyLevel)}`}>
          <div className="flex items-center gap-2 mb-2">
            {urgencyLevel === 'emergency' && <AlertTriangle className="w-5 h-5" />}
            {urgencyLevel === 'high' && <Heart className="w-5 h-5" />}
            {urgencyLevel === 'medium' && <Clock className="w-5 h-5" />}
            {urgencyLevel === 'low' && <CheckCircle className="w-5 h-5" />}
            <span className="font-semibold text-sm">
              {urgencyLevel === 'emergency' && (i18n.language === 'en' ? 'Emergency' : 'அவசரம்')}
              {urgencyLevel === 'high' && (i18n.language === 'en' ? 'High Priority' : 'உயர் முன்னுரிமை')}
              {urgencyLevel === 'medium' && (i18n.language === 'en' ? 'Medium Priority' : 'நடுத்தர முன்னுரிমை')}
              {urgencyLevel === 'low' && (i18n.language === 'en' ? 'Low Priority' : 'குறைந்த முன்னுரிமை')}
            </span>
          </div>
          
          {/* Recommendations */}
          {recommendations.map((rec, index) => (
            <p key={index} className="text-sm mb-2 last:mb-0">
              {rec}
            </p>
          ))}
        </div>
      )}

      {/* Matched Specializations */}
      {specializations.length > 0 && (
        <div className="mb-4">
          <p className="text-white/80 text-sm mb-2">
            {i18n.language === 'en' ? 'Recommended specializations:' : 'பரிந்துரைக்கப்பட்ட சிறப்புகள்:'}
          </p>
          <div className="flex flex-wrap gap-2">
            {specializations.map((spec) => (
              <Badge key={spec.id} variant="outline" className="text-purple-300 border-purple-400/50">
                {i18n.language === 'ta' ? spec.tamilName : spec.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* View Toggle */}
      {showMap && clinics.length > 0 && (
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-white font-semibold">
            {i18n.language === 'en' ? `Found ${clinics.length} nearby clinics` : `${clinics.length} அருகிலுள்ள கிளினிக்குகள் கண்டுபிடிக்கப்பட்டன`}
          </h3>
          <div className="flex bg-gray-800/50 rounded-lg p-1">
            <Button
              onClick={() => setViewMode('list')}
              size="sm"
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              className={`px-3 py-1 text-xs ${viewMode === 'list' ? 'bg-purple-500 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <MapPin className="w-4 h-4 mr-1" />
              {i18n.language === 'en' ? 'List' : 'பட்டியல்'}
            </Button>
            <Button
              onClick={() => setViewMode('map')}
              size="sm"
              variant={viewMode === 'map' ? 'default' : 'ghost'}
              className={`px-3 py-1 text-xs ${viewMode === 'map' ? 'bg-purple-500 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <Map className="w-4 h-4 mr-1" />
              {i18n.language === 'en' ? 'Map' : 'வரைபடம்'}
            </Button>
          </div>
        </div>
      )}

      {/* Clinics Display */}
      {viewMode === 'map' && showMap ? (
        <div className="space-y-4">
          <ClinicMap
            clinics={clinics}
            userLocation={userLocation}
            height="500px"
            onClinicSelect={(clinic) => {
              console.log('Clinic selected from map:', clinic.name);
            }}
            onCallClinic={onCallClinic}
            onGetDirections={onGetDirections}
            className="rounded-lg"
          />
          
          {/* Quick stats below map */}
          {clinics.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-white">{clinics.length}</div>
                <div className="text-xs text-gray-400">{i18n.language === 'en' ? 'Total' : 'மொத்தம்'}</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-green-400">{clinics.filter(c => !c.emergencyServices).length}</div>
                <div className="text-xs text-gray-400">{i18n.language === 'en' ? 'Clinics' : 'கிளினிக்கள்'}</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-red-400">{clinics.filter(c => c.emergencyServices).length}</div>
                <div className="text-xs text-gray-400">{i18n.language === 'en' ? 'Emergency' : 'அவசரம்'}</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-yellow-400">
                  {clinics.length > 0 ? (clinics.reduce((sum, c) => sum + c.rating, 0) / clinics.length).toFixed(1) : '0'}
                </div>
                <div className="text-xs text-gray-400">{i18n.language === 'en' ? 'Avg Rating' : 'சராசரி மதிப்பீடு'}</div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {clinics.length === 0 ? (
            <Card className="bg-gray-800/50 border-gray-600/50 p-6 text-center">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-white font-medium mb-2">
                {i18n.language === 'en' ? 'No clinics found' : 'கிளினிக்குகள் கிடைக்கவில்லை'}
              </h3>
              <p className="text-white/60 text-sm">
                {i18n.language === 'en' 
                  ? 'Try expanding your search radius or check your location permissions.'
                  : 'உங்கள் தேடல் ஆரையை விரிவுபடுத்த முயற்சிக்கவும் அல்லது இருப்பிட அனுமதிகளை சரிபார்க்கவும்.'
                }
              </p>
            </Card>
        ) : (
          clinics.map((clinic) => (
            <Card key={clinic.id} className="bg-gray-800/80 border-gray-600/50 p-4 hover:bg-gray-800/90 transition-all">
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg mb-1">{clinic.name}</h3>
                  <div className="flex items-center gap-2 text-white/60 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{clinic.address}, {clinic.city}</span>
                    {clinic.distance && (
                      <Badge variant="outline" className="text-xs">
                        {clinic.distance.toFixed(1)} km
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Status Indicator */}
                <div className="flex items-center gap-2">
                  {clinic.emergencyServices && (
                    <Badge variant="outline" className="text-red-300 border-red-500/50 bg-red-500/10">
                      {i18n.language === 'en' ? 'Emergency' : 'அவசர சிகிச்சை'}
                    </Badge>
                  )}
                  <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                    isClinicOpen(clinic) 
                      ? 'bg-green-500/20 text-green-300' 
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    <Clock className="w-3 h-3" />
                    {isClinicOpen(clinic) 
                      ? (i18n.language === 'en' ? 'Open' : 'திறந்திருக்கும்')
                      : (i18n.language === 'en' ? 'Closed' : 'மூடப்பட்டுள்ளது')
                    }
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-white font-medium">{clinic.rating}</span>
                  <span className="text-white/60 text-sm">({clinic.reviews} reviews)</span>
                </div>
                <span className="text-white/40">•</span>
                <span className="text-white/60 text-sm">{formatOpeningHours(clinic)}</span>
              </div>

              {/* Specializations */}
              <div className="mb-3">
                <div className="flex flex-wrap gap-1">
                  {clinic.specializations.slice(0, 4).map((spec) => (
                    <Badge key={spec} variant="secondary" className="text-xs bg-purple-500/20 text-purple-300">
                      {getSpecializationName(spec)}
                    </Badge>
                  ))}
                  {clinic.specializations.length > 4 && (
                    <Badge variant="secondary" className="text-xs bg-gray-500/20 text-gray-300">
                      +{clinic.specializations.length - 4} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* Services */}
              {clinic.services.length > 0 && (
                <div className="mb-3">
                  <p className="text-white/80 text-xs mb-1">
                    {i18n.language === 'en' ? 'Services:' : 'சேவைகள்:'}
                  </p>
                  <p className="text-white/60 text-sm">
                    {clinic.services.slice(0, 3).join(', ')}
                    {clinic.services.length > 3 && '...'}
                  </p>
                </div>
              )}

              {/* Languages */}
              <div className="mb-4">
                <span className="text-white/60 text-xs">
                  {i18n.language === 'en' ? 'Languages: ' : 'மொழிகள்: '}
                  {clinic.languages.join(', ')}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => handleCall(clinic)}
                  size="sm"
                  className="bg-green-600/20 hover:bg-green-600/30 border border-green-500/50 text-green-300"
                >
                  <Phone className="w-4 h-4 mr-1" />
                  {i18n.language === 'en' ? 'Call' : 'அழை'}
                </Button>
                
                <Button
                  onClick={() => handleDirections(clinic)}
                  size="sm" 
                  variant="outline"
                  className="border-blue-500/50 text-blue-300 hover:bg-blue-500/20"
                >
                  <Navigation className="w-4 h-4 mr-1" />
                  {i18n.language === 'en' ? 'Directions' : 'திசைகள்'}
                </Button>
                
                {(clinic.website || onViewDetails) && (
                  <Button
                    onClick={() => handleViewDetails(clinic)}
                    size="sm"
                    variant="outline"
                    className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    {i18n.language === 'en' ? 'Details' : 'விவरங்கள்'}
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
        </div>
      )}

      {/* Call Emergency Button for High Priority */}
      {urgencyLevel === 'emergency' && (
        <Card className="bg-red-500/20 border-red-500/50 p-4">
          <div className="text-center">
            <h3 className="text-red-300 font-semibold mb-2">
              {i18n.language === 'en' ? 'Emergency Services' : 'அவசர சேவைகள்'}
            </h3>
            <p className="text-red-200 text-sm mb-4">
              {i18n.language === 'en' 
                ? 'For immediate emergency assistance, call:'
                : 'உடனடி அவசர உதவிக்கு அழைக்கவும்:'
              }
            </p>
            <div className="flex gap-2 justify-center">
              <Button
                onClick={() => window.open('tel:108', '_self')}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Phone className="w-4 h-4 mr-2" />
                {i18n.language === 'en' ? 'Call 108 (Ambulance)' : '108 ஐ அழைக்கவும் (ஆம்புலன்ஸ்)'}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ClinicFinder;