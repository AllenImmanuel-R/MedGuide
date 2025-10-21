import { motion } from "framer-motion";
import { 
  Activity, Heart, Brain, Shield, TrendingUp, Users, Calendar, 
  AlertCircle, FileText, Upload, Stethoscope, MessageCircle,
  Star, Award, Zap, Plus, MapPin, Languages
} from "lucide-react";
import { EnergeticBackground, GlassCard, SectionHeader, MagicButton } from "@/components/ui/energetic-elements";
import '../styles/auth.css';
import { Link } from "react-router-dom";

const Dashboard = () => {
  const stats = [
    {
      title: "Total Patients",
      value: "2,847",
      change: "+12%",
      icon: Users,
      color: "text-blue-400",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      title: "Active Cases",
      value: "1,423",
      change: "+8%",
      icon: Activity,
      color: "text-green-400",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      title: "Critical Alerts",
      value: "23",
      change: "-15%",
      icon: AlertCircle,
      color: "text-red-400",
      gradient: "from-red-500 to-pink-500"
    },
    {
      title: "Recovery Rate",
      value: "94.2%",
      change: "+5%",
      icon: TrendingUp,
      color: "text-purple-400",
      gradient: "from-purple-500 to-pink-500"
    }
  ];

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Diagnosis",
      description: "Advanced machine learning algorithms analyze symptoms and provide accurate diagnostic suggestions.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: Heart,
      title: "Health Monitoring",
      description: "Continuous tracking of vital signs and health metrics with real-time alerts.",
      gradient: "from-red-500 to-rose-500"
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Enterprise-grade security ensures your medical data remains confidential and protected.",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: MessageCircle,
      title: "AI Health Assistant",
      description: "Get instant health guidance from our floating AI chatbot, available on every page for quick assistance.",
      gradient: "from-blue-500 to-cyan-500"
    }
  ];

  const quickActions = [
    { 
      title: "Upload Reports", 
      description: "Upload and manage your medical documents", 
      icon: FileText, 
      gradient: "from-blue-500 to-cyan-500",
      href: "/reports"
    },
    { 
      title: "Find Clinics", 
      description: "Locate nearby healthcare facilities", 
      icon: MapPin, 
      gradient: "from-purple-500 to-pink-500",
      href: "/clinics"
    },
    { 
      title: "View Analytics", 
      description: "Access your health reports and analytics", 
      icon: TrendingUp, 
      gradient: "from-orange-500 to-yellow-500",
      href: "/reports"
    }
  ];

  return (
    <EnergeticBackground>
      <div className="min-h-screen px-6 py-8">
        <div className="max-w-7xl mx-auto space-y-20">
          
          {/* Hero Section */}
          <section className="text-center py-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-6 shadow-2xl"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Stethoscope className="w-10 h-10 text-white" />
                </motion.div>
              </motion.div>
              
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                  MedGuide
                </span>
              </h1>
              
              <motion.p
                className="text-xl text-white/80 max-w-3xl mx-auto mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                Your intelligent healthcare companion, powered by AI to provide personalized medical guidance and monitoring.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="flex flex-wrap justify-center gap-4"
              >
                <div className="w-44">
                  <Link to="/reports">
                    <MagicButton size="lg" variant="primary" className="w-full flex items-center justify-center">
                      Get Started
                    </MagicButton>
                  </Link>
                </div>
                <div className="w-44">
                  <Link to="/about">
                    <MagicButton size="lg" variant="outline" className="w-full flex items-center justify-center">
                      Learn More
                    </MagicButton>
                  </Link>
                </div>
              </motion.div>
            </motion.div>
          </section>

          {/* Stats Section */}
          <section>
            <SectionHeader 
              title="Real-Time Analytics" 
              subtitle="Monitor your healthcare metrics with live data and insights"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.title}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <GlassCard className="p-6 text-center group">
                      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${stat.gradient} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-sm font-medium text-white/80 mb-2">{stat.title}</h3>
                      <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                      <p className="text-sm text-green-400">{stat.change} from last month</p>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* Features Section */}
          <section>
            <SectionHeader 
              title="Powerful Features" 
              subtitle="Discover what makes MedGuide your ultimate healthcare companion"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: index * 0.2 }}
                    viewport={{ once: true }}
                  >
                    <GlassCard className="p-8 h-full group">
                      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${feature.gradient} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                      <p className="text-white/70 leading-relaxed">{feature.description}</p>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* Quick Actions Section */}
          <section>
            <SectionHeader 
              title="Quick Actions" 
              subtitle="Access essential features with just one click"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <motion.div
                    key={action.title}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <Link to={action.href}>
                      <GlassCard className="group cursor-pointer h-32">
                        <motion.div 
                          className="p-8 flex items-center space-x-6 h-full"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className={`flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-r ${action.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                            <Icon className="w-8 h-8 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-white mb-2">{action.title}</h3>
                            <p className="text-white/70">{action.description}</p>
                          </div>
                          <Plus className="w-6 h-6 text-white/50 group-hover:text-white group-hover:rotate-90 transition-all duration-300" />
                        </motion.div>
                      </GlassCard>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* Achievement Section */}
          <section>
            <SectionHeader 
              title="Your Achievements" 
              subtitle="Track your progress and celebrate milestones"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: "Health Warrior", description: "Completed 30 days of consistent monitoring", progress: 85, icon: Award },
                { title: "Data Champion", description: "Uploaded 50+ medical documents", progress: 65, icon: Upload },
                { title: "Wellness Expert", description: "Maintained optimal health scores", progress: 92, icon: Zap }
              ].map((achievement, index) => {
                const Icon = achievement.icon;
                return (
                  <motion.div
                    key={achievement.title}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                    viewport={{ once: true }}
                  >
                    <GlassCard className="p-6 text-center h-64 flex flex-col justify-between">
                      <div>
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 mb-4">
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">{achievement.title}</h3>
                        <p className="text-white/70 text-sm mb-4">{achievement.description}</p>
                      </div>
                      <div>
                        <div className="w-full bg-white/20 rounded-full h-2 mb-2">
                          <motion.div 
                            className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full"
                            initial={{ width: 0 }}
                            whileInView={{ width: `${achievement.progress}%` }}
                            transition={{ duration: 1, delay: index * 0.2 + 0.5 }}
                            viewport={{ once: true }}
                          />
                        </div>
                        <span className="text-white/60 text-sm">{achievement.progress}% Complete</span>
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* Language Support Section */}
          <section className="pb-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <GlassCard className="p-8 max-w-md mx-auto">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="p-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500">
                    <Languages className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Multilingual Support</h3>
                <p className="text-white/70">
                  Available in multiple languages - Coming soon!
                </p>
              </GlassCard>
            </motion.div>
          </section>

        </div>
      </div>
    </EnergeticBackground>
  );
};

export default Dashboard;
