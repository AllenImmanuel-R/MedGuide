/**
 * ClinicMap Component using Leaflet and OpenStreetMap
 * Displays clinic locations on an interactive map
 */

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Phone, Star, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Clinic } from '../services/ClinicFinderService';
import type { UserLocation } from '../services/LocationService';

// Fix Leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface ClinicMapProps {
  clinics: Clinic[];
  userLocation?: UserLocation;
  center?: [number, number];
  zoom?: number;
  height?: string;
  onClinicSelect?: (clinic: Clinic) => void;
  onCallClinic?: (clinic: Clinic) => void;
  onGetDirections?: (clinic: Clinic) => void;
  className?: string;
}

const ClinicMap: React.FC<ClinicMapProps> = ({
  clinics,
  userLocation,
  center,
  zoom = 13,
  height = '400px',
  onClinicSelect,
  onCallClinic,
  onGetDirections,
  className = ''
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const { t, i18n } = useTranslation(['common']);

  useEffect(() => {
    if (!mapRef.current) return;

    // Determine map center
    let mapCenter: [number, number];
    if (center) {
      mapCenter = center;
    } else if (userLocation) {
      mapCenter = [userLocation.latitude, userLocation.longitude];
    } else if (clinics.length > 0) {
      // Center on first clinic
      mapCenter = [clinics[0].latitude, clinics[0].longitude];
    } else {
      // Default to Chennai
      mapCenter = [13.0827, 80.2707];
    }

    // Initialize map
    const map = L.map(mapRef.current).setView(mapCenter, zoom);
    mapInstanceRef.current = map;

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Create layer group for markers
    const markersGroup = L.layerGroup().addTo(map);
    markersRef.current = markersGroup;

    // Add user location marker if available
    if (userLocation) {
      const userIcon = L.divIcon({
        html: `<div style="background: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        className: 'user-location-marker',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      L.marker([userLocation.latitude, userLocation.longitude], { icon: userIcon })
        .addTo(markersGroup)
        .bindPopup(`
          <div class="p-2">
            <div class="font-semibold text-blue-600 mb-1">
              ${i18n.language === 'en' ? 'Your Location' : 'உங்கள் இருப்பிடம்'}
            </div>
            <div class="text-xs text-gray-600">
              ${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}
            </div>
          </div>
        `);
    }

    // Add clinic markers
    clinics.forEach(clinic => {
      const markerColor = clinic.emergencyServices ? '#ef4444' : '#10b981'; // Red for emergency, green for regular
      
      const clinicIcon = L.divIcon({
        html: `
          <div style="
            background: ${markerColor}; 
            width: 24px; 
            height: 24px; 
            border-radius: 50%; 
            border: 2px solid white; 
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
          ">
            ${clinic.emergencyServices ? '🏥' : '🩺'}
          </div>
        `,
        className: 'clinic-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([clinic.latitude, clinic.longitude], { icon: clinicIcon })
        .addTo(markersGroup);

      // Create popup content
      const popupContent = `
        <div class="p-3 min-w-64 max-w-80">
          <div class="flex items-start justify-between mb-2">
            <h3 class="font-semibold text-gray-900 text-sm leading-tight pr-2">${clinic.name}</h3>
            ${clinic.emergencyServices ? '<span class="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Emergency</span>' : ''}
          </div>
          
          <div class="space-y-2 text-xs">
            <div class="flex items-start gap-1">
              <svg class="w-3 h-3 mt-0.5 text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
              </svg>
              <span class="text-gray-600">${clinic.address}</span>
            </div>
            
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-1">
                <svg class="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
                <span class="font-medium">${clinic.rating}</span>
                <span class="text-gray-500">(${clinic.reviews})</span>
              </div>
              
              ${clinic.distance ? `<span class="text-blue-600 font-medium">${clinic.distance.toFixed(1)} km</span>` : ''}
            </div>
            
            ${clinic.specializations.length > 0 ? `
            <div class="flex flex-wrap gap-1 mt-2">
              ${clinic.specializations.slice(0, 3).map(spec => 
                `<span class="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded">${spec.replace('_', ' ')}</span>`
              ).join('')}
              ${clinic.specializations.length > 3 ? `<span class="text-gray-500 text-xs">+${clinic.specializations.length - 3} more</span>` : ''}
            </div>
            ` : ''}
            
            <div class="flex gap-2 mt-3 pt-2 border-t border-gray-100">
              ${clinic.phone ? `
              <button onclick="window.open('tel:${clinic.phone}', '_self')" 
                      class="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-2 rounded flex items-center justify-center gap-1 transition-colors">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                </svg>
                ${i18n.language === 'en' ? 'Call' : 'அழை'}
              </button>
              ` : ''}
              
              <button onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${clinic.latitude},${clinic.longitude}', '_blank')" 
                      class="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-2 rounded flex items-center justify-center gap-1 transition-colors">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
                </svg>
                ${i18n.language === 'en' ? 'Directions' : 'திசைகள்'}
              </button>
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 320,
        className: 'clinic-popup'
      });

      // Add click handler
      marker.on('click', () => {
        if (onClinicSelect) {
          onClinicSelect(clinic);
        }
      });
    });

    // Fit map to show all markers if there are any
    if (clinics.length > 0 || userLocation) {
      const group = markersGroup;
      if (group.getLayers().length > 0) {
        try {
          map.fitBounds(group.getBounds(), { 
            padding: [20, 20],
            maxZoom: 15 
          });
        } catch (error) {
          console.warn('Could not fit bounds:', error);
        }
      }
    }

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [clinics, userLocation, center, zoom, onClinicSelect, i18n.language]);

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mapRef} 
        style={{ height, width: '100%' }}
        className="rounded-lg overflow-hidden border border-gray-300"
      />
      
      {/* Map Legend */}
      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full border border-white shadow"></div>
            <span>{i18n.language === 'en' ? 'Your Location' : 'உங்கள் இருப்பிடம்'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full border border-white shadow"></div>
            <span>{i18n.language === 'en' ? 'Clinic' : 'கிளினிக்'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full border border-white shadow"></div>
            <span>{i18n.language === 'en' ? 'Emergency' : 'அவசரம்'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicMap;