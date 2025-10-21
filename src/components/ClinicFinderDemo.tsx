/**
 * Demo Component for Clinic Finder Features
 * Shows off key functionality of the clinic finder system
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Zap, Globe, Brain, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ClinicFinderDemo: React.FC = () => {
  const { i18n } = useTranslation();

  const features = [
    {
      icon: <Globe className="w-6 h-6 text-blue-400" />,
      title: i18n.language === 'en' ? 'Real-Time Data' : 'நேரலை தரவுகள்',
      description: i18n.language === 'en' 
        ? 'Live clinic data from OpenStreetMap via Overpass API'
        : 'Overpass API வழியாக OpenStreetMap இலிருந்து நேரலை கிளினிக் தரவுகள்',
      badge: 'OSM + Overpass'
    },
    {
      icon: <MapPin className="w-6 h-6 text-green-400" />,
      title: i18n.language === 'en' ? 'Interactive Maps' : 'ஊடாடும் வரைபடங்கள்',
      description: i18n.language === 'en'
        ? 'Leaflet maps with custom markers and rich popups'
        : 'தனிப்பயன் குறிப்பான்கள் மற்றும் வளமான பாப்அப்களுடன் Leaflet வரைபடங்கள்',
      badge: 'Leaflet'
    },
    {
      icon: <Brain className="w-6 h-6 text-purple-400" />,
      title: i18n.language === 'en' ? 'AI-Powered Suggestions' : 'AI சக்தியான பரிந்துரைகள்',
      description: i18n.language === 'en'
        ? 'Symptom analysis with specialization recommendations'
        : 'சிறப்பு பரிந்துரைகளுடன் அறிகுறி பகுப்பாய்வு',
      badge: 'AI Enhanced'
    },
    {
      icon: <Zap className="w-6 h-6 text-yellow-400" />,
      title: i18n.language === 'en' ? 'Smart Caching' : 'ஸ்மார்ட் கேச்சிங்',
      description: i18n.language === 'en'
        ? 'Intelligent caching for faster subsequent searches'
        : 'வேகமான தொடர்ச்சியான தேடல்களுக்கு அறிவார்ந்த கேச்சிங்',
      badge: '10min Cache'
    },
    {
      icon: <Clock className="w-6 h-6 text-orange-400" />,
      title: i18n.language === 'en' ? 'Opening Hours' : 'திறக்கும் நேரங்கள்',
      description: i18n.language === 'en'
        ? 'Real-time open/closed status with operating hours'
        : 'இயங்கும் நேரங்களுடன் நேரலை திறந்த/மூடப்பட்ட நிலை',
      badge: 'Live Status'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          🚀 {i18n.language === 'en' ? 'Clinic Finder Features' : 'கிளினிக் கண்டுபிடிப்பு அம்சங்கள்'}
        </h2>
        <p className="text-white/70">
          {i18n.language === 'en'
            ? 'Powered by OpenStreetMap, Leaflet, and AI technology'
            : 'OpenStreetMap, Leaflet மற்றும் AI தொழில்நுட்பத்தால் இயக்கப்படுகிறது'
          }
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature, index) => (
          <Card key={index} className="bg-gray-800/80 border-gray-600/50 p-4 hover:bg-gray-800/90 transition-all hover:scale-105">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-gray-700/50">
                {feature.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-white text-sm">
                    {feature.title}
                  </h3>
                  <Badge variant="secondary" className="text-xs bg-purple-500/20 text-purple-300 border-purple-500/30">
                    {feature.badge}
                  </Badge>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Technical Stack */}
      <Card className="bg-gradient-to-r from-gray-800/80 to-gray-700/80 border-gray-600/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 text-center">
          🔧 {i18n.language === 'en' ? 'Technical Stack' : 'தொழில்நுட்ப அடுக்கு'}
        </h3>
        <div className="flex flex-wrap justify-center gap-3">
          {[
            'OpenStreetMap',
            'Overpass API', 
            'Leaflet',
            'React',
            'TypeScript',
            'Geolocation API',
            'Tamil Support',
            'Real-time Data'
          ].map((tech, index) => (
            <Badge 
              key={index} 
              variant="outline" 
              className="text-gray-300 border-gray-500/50 bg-gray-700/30 hover:bg-gray-600/30 transition-colors"
            >
              {tech}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Usage Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-blue-500/10 border-blue-500/20 p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">🌍</div>
          <div className="text-lg font-semibold text-white">Global</div>
          <div className="text-xs text-blue-300">Coverage</div>
        </Card>
        <Card className="bg-green-500/10 border-green-500/20 p-4 text-center">
          <div className="text-2xl font-bold text-green-400">⚡</div>
          <div className="text-lg font-semibold text-white">Fast</div>
          <div className="text-xs text-green-300">Search</div>
        </Card>
        <Card className="bg-purple-500/10 border-purple-500/20 p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">🤖</div>
          <div className="text-lg font-semibold text-white">AI</div>
          <div className="text-xs text-purple-300">Enhanced</div>
        </Card>
        <Card className="bg-orange-500/10 border-orange-500/20 p-4 text-center">
          <div className="text-2xl font-bold text-orange-400">🔄</div>
          <div className="text-lg font-semibold text-white">Live</div>
          <div className="text-xs text-orange-300">Updates</div>
        </Card>
      </div>
    </div>
  );
};

export default ClinicFinderDemo;