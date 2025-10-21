import { motion } from "framer-motion";
import { 
  Brain, FileText, Upload, Stethoscope, MessageCircle,
  MapPin, ArrowRight, Clock, Loader2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { reportsAPI, aiAPI } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { clinicFinderService, locationService } from '@/services/clinicServices';
import type { UserLocation } from '@/services/clinicServices';

const Dashboard = () => {
  const { user } = useAuth();
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [isLoadingClinics, setIsLoadingClinics] = useState(false);
  const [stats, setStats] = useState([
    {
      title: "Medical Records",
      value: "0",
      change: "Loading...",
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Nearby Clinics",
      value: "0",
      change: "Getting location...",
      icon: Stethoscope,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Health Consultations",
      value: "0",
      change: "Loading...",
      icon: Brain,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ]);

  // Get user location automatically on page load
  useEffect(() => {
    const getUserLocationAndScanClinics = async () => {
      try {
        setIsLoadingLocation(true);
        
        // Check if location is cached first
        const cachedLocation = locationService.getCachedLocation();
        if (cachedLocation) {
          console.log('📍 Using cached location:', cachedLocation);
          setUserLocation(cachedLocation);
          setIsLoadingLocation(false);
          return;
        }

        console.log('📍 Requesting user location...');
        
        // Proactively request location permission and get location
        const location = await locationService.getLocationWithCache();
        console.log('📍 Location obtained:', location);
        
        setUserLocation(location);
        setIsLoadingLocation(false);
        
        // Immediately start scanning for clinics
        console.log('🏥 Starting clinic scan...');
        setIsLoadingClinics(true);
        
      } catch (error) {
        console.error('❌ Error getting user location:', error);
        setIsLoadingLocation(false);
        
        // Update stats to show location error
        setStats(prevStats => prevStats.map((stat, index) => 
          index === 1 ? {
            ...stat,
            value: "0",
            change: "Location access denied"
          } : stat
        ));
      }
    };

    // Start location process immediately when component mounts
    getUserLocationAndScanClinics();
  }, []);

  // Load dashboard data (medical records and consultations)
  useEffect(() => {
    const loadBasicDashboardData = async () => {
      if (!user) return;
      
      try {
        // Load medical records count
        const reportsResponse = await reportsAPI.getUploadedReports();
        const reportsCount = reportsResponse.success ? reportsResponse.data?.length || 0 : 0;
        
        // Load AI suggestions for consultation count
        const suggestionsResponse = await aiAPI.getSuggestions();
        const consultationsCount = suggestionsResponse.success ? suggestionsResponse.data?.length || 0 : 0;
        
        setStats(prevStats => [
          {
            ...prevStats[0],
            value: reportsCount.toString(),
            change: reportsCount > 0 ? "Ready for travel" : "No records yet"
          },
          prevStats[1], // Keep clinic stats as is
          {
            ...prevStats[2],
            value: consultationsCount.toString(),
            change: "This month"
          }
        ]);
      } catch (error) {
        console.error('Error loading basic dashboard data:', error);
      }
    };

    loadBasicDashboardData();
  }, [user]);

  // Load nearby clinics when location is available
  useEffect(() => {
    const loadNearbyClinics = async () => {
      if (!userLocation) return;
      
      try {
        setIsLoadingClinics(true);
        console.log('🔍 Scanning for nearby clinics...');
        
        const clinics = await clinicFinderService.findNearbyClinics({
          maxDistance: 10000, // 10km in meters
          limit: 50
        });
        
        console.log(`✅ Found ${clinics.length} nearby clinics`);
        
        setStats(prevStats => prevStats.map((stat, index) => 
          index === 1 ? {
            ...stat,
            value: clinics.length.toString(),
            change: `Within 10km`
          } : stat
        ));
        
        setIsLoadingClinics(false);
        
      } catch (error) {
        console.error('❌ Error loading nearby clinics:', error);
        setIsLoadingClinics(false);
        
        // Fallback to demo data
        setStats(prevStats => prevStats.map((stat, index) => 
          index === 1 ? {
            ...stat,
            value: "2",
            change: "Demo data"
          } : stat
        ));
      }
    };

    if (userLocation && !isLoadingLocation) {
      loadNearbyClinics();
    }
  }, [userLocation, isLoadingLocation]);

  const quickActions = [
    { 
      title: "Upload Travel Medical Records", 
      description: "Store and organize your medical documents for travel", 
      icon: Upload, 
      href: "/reports",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    { 
      title: "Find Nearby Hospitals", 
      description: "Locate healthcare facilities in your current location", 
      icon: MapPin, 
      href: "/clinics",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    { 
      title: "Travel Health Chat", 
      description: "Get health guidance for your travel destination", 
      icon: MessageCircle, 
      href: "/chat",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    { 
      title: "View Medical History", 
      description: "Access your complete medical records", 
      icon: FileText, 
      href: "/reports",
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    }
  ];

  const recentActivity = [
    {
      title: "Travel Vaccination Certificate Uploaded",
      time: "2 hours ago",
      type: "upload",
      status: "completed"
    },
    {
      title: "Health Consultation for Japan Trip",
      time: "1 day ago",
      type: "chat",
      status: "completed"
    },
    {
      title: "Hospital Search in Tokyo",
      time: "2 days ago",
      type: "search",
      status: "completed"
    }
  ];

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
            Welcome to MedGuide
          </h1>
          <p className="text-gray-600 text-lg">
            Your travel health companion - manage medical records, find nearby clinics, and get health guidance anywhere in the world
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
        >
          {stats.map((stat, index) => {
            const isClinicStat = index === 1;
            const showLoading = isClinicStat && (isLoadingLocation || isLoadingClinics);
            
            return (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                        {showLoading && (
                          <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {isClinicStat && isLoadingLocation ? "Getting location..." :
                         isClinicStat && isLoadingClinics ? "Scanning clinics..." :
                         stat.change}
                      </p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.bgColor}`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900">Quick Actions</CardTitle>
                <CardDescription>Get started with these common tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickActions.map((action, index) => (
                    <Link key={index} to={action.href}>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${action.bgColor}`}>
                            <action.icon className={`h-5 w-5 ${action.color}`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{action.title}</h3>
                            <p className="text-sm text-gray-600">{action.description}</p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900">Recent Activity</CardTitle>
                <CardDescription>Your latest health interactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <p className="text-xs text-gray-500">{activity.time}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {activity.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* AI Assistant CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8"
        >
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 rounded-full">
                    <Brain className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Travel Health Assistant</h3>
                    <p className="text-blue-100">Get instant health guidance for your travel destination and medical needs</p>
                  </div>
                </div>
                <Link to="/chat">
                  <Button 
                    size="lg" 
                    className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg"
                  >
                    Start Chat
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;