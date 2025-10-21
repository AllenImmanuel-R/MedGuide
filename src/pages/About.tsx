import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Heart, Shield, Users, Globe, MessageCircle, Mail, MapPin, Phone, Star, Award, Zap } from "lucide-react";
import { EnergeticBackground, GlassCard, SectionHeader, MagicButton } from "@/components/ui/energetic-elements";
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import './about.css';

const About = () => {
  const { toast } = useToast();
  const { t } = useTranslation(['about', 'common']);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast({
      title: "Contact form is a demo",
      description: "No backend connected. Your message was not sent.",
    });
  };

  const features = [
    {
      icon: Heart,
      key: "empathetic",
      gradient: "from-red-500 to-pink-500"
    },
    {
      icon: Shield,
      key: "secure",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: Users,
      key: "community",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: Globe,
      key: "accessible",
      gradient: "from-purple-500 to-indigo-500"
    }
  ];

  const stats = [
    { number: "10K+", labelKey: "users", icon: Users },
    { number: "50K+", labelKey: "reports", icon: Award },
    { number: "99.9%", labelKey: "uptime", icon: Zap },
    { number: "24/7", labelKey: "support", icon: MessageCircle }
  ];

  return (
    <EnergeticBackground>
      <div className="min-h-screen px-6 py-8">
        <div className="max-w-6xl mx-auto space-y-20">
          
          {/* Hero Section with Language Switcher */}
          <div className="flex justify-between items-start mb-8">
            <SectionHeader 
              title={t('about:title')} 
              subtitle={t('about:subtitle')}
            />
            <LanguageSwitcher />
          </div>
          
          {/* Mission Section */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <GlassCard className="p-12 text-center mission-card">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                viewport={{ once: true }}
                className="mb-8"
              >
                <div className="w-20 h-20 mx-auto bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-6">
                  <Heart className="w-10 h-10 text-white" />
                </div>
              </motion.div>
              
              <h2 className="text-3xl font-bold text-white mb-6">
                <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                  {t('about:mission.title')}
                </span>
              </h2>
              
              <p className="text-lg text-white/80 leading-relaxed max-w-4xl mx-auto mb-8">
                {t('about:mission.description')}
              </p>
              
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/20">
                <Star className="w-4 h-4 text-yellow-300" />
                <span className="text-white/90 text-sm">{t('about:mission.disclaimer')}</span>
              </div>
            </GlassCard>
          </motion.section>
          
          {/* Features Section */}
          <section>
            <SectionHeader 
              title={t('about:features.title')} 
              subtitle={t('about:features.subtitle')}
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
                    <GlassCard className="p-8 h-full feature-card group">
                      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${feature.gradient} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-4">
                        {t(`about:features.${feature.key}.title`)}
                      </h3>
                      <p className="text-white/70 leading-relaxed">
                        {t(`about:features.${feature.key}.description`)}
                      </p>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>
          </section>
          
          {/* Stats Section */}
          <section>
            <SectionHeader 
              title={t('about:stats.title')} 
              subtitle={t('about:stats.subtitle')}
            />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <GlassCard className="p-6 text-center stat-card">
                      <div className="w-12 h-12 mx-auto bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-3xl font-bold text-white mb-2">{stat.number}</div>
                      <p className="text-white/70 text-sm">{t(`about:stats.${stat.labelKey}`)}</p>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>
          </section>
          
          {/* Contact Section */}
          <section>
            <SectionHeader 
              title={t('about:contact.title')} 
              subtitle={t('about:contact.subtitle')}
            />
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Contact Info */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <GlassCard className="p-8 contact-info">
                  <h3 className="text-2xl font-bold text-white mb-6">{t('about:contact.info.title')}</h3>
                  
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                        <Mail className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">{t('about:contact.info.email')}</h4>
                        <p className="text-white/70">support@medguide.com</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                        <Phone className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">{t('about:contact.info.phone')}</h4>
                        <p className="text-white/70">+1 (555) 123-4567</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">{t('about:contact.info.address')}</h4>
                        <p className="text-white/70">123 Healthcare Ave<br />San Francisco, CA 94102</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8 p-4 bg-white/10 rounded-xl border border-white/20">
                    <p className="text-white/80 text-sm text-center">
                      <MessageCircle className="w-4 h-4 inline mr-2" />
                      {t('about:contact.chatSupport')}
                    </p>
                  </div>
                </GlassCard>
              </motion.div>
              
              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <GlassCard className="p-8 contact-form">
                  <h3 className="text-2xl font-bold text-white mb-6">{t('about:contact.form.title')}</h3>
                  
                  <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-white font-medium">{t('about:contact.form.name')}</Label>
                      <Input 
                        id="name" 
                        placeholder={t('about:contact.form.namePlaceholder')}
                        required 
                        className="bg-white/10 border-white/30 text-white placeholder-white/50 focus:bg-white/20 focus:border-purple-400"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white font-medium">{t('about:contact.form.email')}</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder={t('about:contact.form.emailPlaceholder')}
                        required 
                        className="bg-white/10 border-white/30 text-white placeholder-white/50 focus:bg-white/20 focus:border-purple-400"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-white font-medium">{t('about:contact.form.message')}</Label>
                      <Textarea 
                        id="message" 
                        placeholder={t('about:contact.form.messagePlaceholder')}
                        className="min-h-32 bg-white/10 border-white/30 text-white placeholder-white/50 focus:bg-white/20 focus:border-purple-400 resize-none" 
                        required 
                      />
                    </div>
                    
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <MagicButton 
                        type="submit" 
                        variant="primary" 
                        size="lg" 
                        className="w-full"
                      >
                        <Mail className="w-5 h-5 mr-2" />
                        {t('about:contact.form.submit')}
                      </MagicButton>
                    </motion.div>
                    
                    <p className="text-xs text-white/50 text-center p-3 bg-white/5 rounded-lg border border-white/10">
                      {t('about:contact.form.demo')}
                    </p>
                  </form>
                </GlassCard>
              </motion.div>
            </div>
          </section>
          
        </div>
      </div>
    </EnergeticBackground>
  );
};

export default About;
