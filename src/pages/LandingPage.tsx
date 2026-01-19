import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, Target, Users, Trophy, Shield, Download, ArrowRight, BookOpen, Clock, TrendingUp, Zap, ChevronDown, Menu, X, Heart, GraduationCap, Briefcase, ExternalLink } from 'lucide-react';
import { PixelButton } from '@/components/game/PixelButton';
import { PixelPanel } from '@/components/game/PixelPanel';
import { GameBackground } from '@/components/game/GameBackground';
import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import logo from '@/assets/logo.png';

const features = [
  {
    icon: Target,
    title: 'Quest System',
    description: 'Turn your study tasks into exciting quests. Schedule, track, and complete daily missions.',
  },
  {
    icon: Users,
    title: 'Squad Accountability',
    description: 'Form squads with friends. Review each others proof and keep each other accountable.',
  },
  {
    icon: Trophy,
    title: 'Points & Rewards',
    description: 'Earn points for completing tasks. Build streaks and climb the leaderboard.',
  },
  {
    icon: Shield,
    title: 'Proof Verification',
    description: 'Submit proof of work. Squad members verify or AI auto-approves after 24 hours.',
  },
];

const stats = [
  { value: '3x', label: 'More Productive', icon: TrendingUp, desc: 'Students study 3x more consistently' },
  { value: '89%', label: 'Streak Maintained', icon: Zap, desc: 'Users maintain their study streaks' },
  { value: '2hrs+', label: 'Daily Focus', icon: Clock, desc: 'Average focused study time per day' },
  { value: '45min', label: 'Longer Sessions', icon: BookOpen, desc: 'Increased study session length' },
];

export const LandingPage = () => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }
  }, []);

  return (
    <>
      <Helmet>
        <title>STFU Exams - Studying Because of Bro | by Zylon Lab</title>
        <meta name="description" content="Transform your study routine into an epic adventure. Track tasks, earn points, and stay accountable with friends. Studying because of bro - the cozy way to crush your exams." />
      </Helmet>
      
      <div className="min-h-screen relative overflow-hidden">
        <GameBackground />
        
        {/* Navigation */}
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed top-0 left-0 right-0 z-50 px-4 py-3 bg-background/80 backdrop-blur-sm"
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={logo} alt="STFU Exams" className="w-8 h-8 md:w-10 md:h-10 object-contain" />
              <div className="flex flex-col">
                <span className="font-pixel text-[8px] md:text-[10px] text-foreground">STFU Exams</span>
                <span className="font-game text-xs text-muted-foreground hidden sm:block">by Zylon Lab</span>
              </div>
            </div>
            
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-4">
              <Link to="/privacy">
                <span className="font-game text-lg text-muted-foreground hover:text-foreground transition-colors">Privacy</span>
              </Link>
              <Link to="/terms">
                <span className="font-game text-lg text-muted-foreground hover:text-foreground transition-colors">Terms</span>
              </Link>
              <Link to="/auth">
                <PixelButton size="sm">
                  Login
                </PixelButton>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:hidden absolute top-full left-0 right-0 bg-card/95 backdrop-blur-sm border-b-4 border-foreground p-4"
            >
              <div className="flex flex-col gap-3">
                <Link to="/privacy" className="font-game text-xl text-muted-foreground py-2">Privacy</Link>
                <Link to="/terms" className="font-game text-xl text-muted-foreground py-2">Terms</Link>
                <Link to="/auth">
                  <PixelButton className="w-full">Login</PixelButton>
                </Link>
              </div>
            </motion.div>
          )}
        </motion.nav>

        {/* Hero Section */}
        <section className="pt-24 md:pt-32 pb-12 md:pb-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-6 md:mb-8"
            >
              <div className="flex items-center justify-center gap-3 md:gap-4 mb-4 md:mb-6">
                <Sparkles className="w-6 h-6 md:w-10 md:h-10 text-game-gold animate-float" />
                <img src={logo} alt="STFU Exams" className="w-16 h-16 md:w-24 md:h-24 object-contain animate-float" />
                <Sparkles className="w-6 h-6 md:w-10 md:h-10 text-game-gold animate-float" />
              </div>
              <h1 className="font-pixel text-lg md:text-2xl lg:text-3xl text-foreground text-shadow-pixel mb-2">
                STFU Exams
              </h1>
              <p className="font-game text-xl md:text-2xl text-primary mb-4">
                studying because of bro 📚
              </p>
              <p className="font-game text-2xl md:text-3xl lg:text-4xl text-muted-foreground max-w-2xl mx-auto">
                Transform your study routine into an epic pixel-art adventure
              </p>
            </motion.div>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="font-game text-lg md:text-xl text-muted-foreground mb-6 md:mb-8 max-w-xl mx-auto px-4"
            >
              Track tasks, earn points, complete quests, and stay accountable with your squad. 
              The cozy way to crush your exams.
            </motion.p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 px-4"
            >
              <Link to="/auth" className="w-full sm:w-auto">
                <PixelButton variant="primary" className="flex items-center justify-center gap-2 text-base md:text-lg px-6 md:px-8 py-3 md:py-4 w-full">
                  Start Your Quest
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                </PixelButton>
              </Link>
              {!isInstalled && (
                <Link to="/install" className="w-full sm:w-auto">
                  <PixelButton 
                    variant="secondary" 
                    className="flex items-center justify-center gap-2 w-full"
                  >
                    <Download className="w-5 h-5" />
                    Install App
                  </PixelButton>
                </Link>
              )}
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 md:mt-12"
            >
              <ChevronDown className="w-6 h-6 mx-auto text-muted-foreground animate-bounce" />
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 md:py-16 px-4 bg-primary/5">
          <div className="max-w-5xl mx-auto">
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              className="font-pixel text-sm md:text-lg text-center text-foreground mb-3"
            >
              Study Smarter, Not Harder
            </motion.h2>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-game text-xl md:text-2xl text-center text-muted-foreground mb-8 md:mb-12"
            >
              See how much better you could study with STFU Exams
            </motion.p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <PixelPanel className="text-center py-4 md:py-6 h-full">
                    <stat.icon className="w-6 h-6 md:w-8 md:h-8 text-primary mx-auto mb-2" />
                    <div className="font-pixel text-lg md:text-2xl text-game-gold mb-1">{stat.value}</div>
                    <div className="font-pixel text-[6px] md:text-[8px] text-foreground mb-1">{stat.label}</div>
                    <p className="font-game text-sm md:text-lg text-muted-foreground px-2">{stat.desc}</p>
                  </PixelPanel>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-12 md:py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                >
                  <PixelPanel className="h-full">
                    <div className="flex items-start gap-3 md:gap-4">
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                      >
                        <feature.icon className="w-8 h-8 md:w-10 md:h-10 text-primary shrink-0" />
                      </motion.div>
                      <div>
                        <h3 className="font-pixel text-[8px] md:text-[10px] text-foreground mb-2">{feature.title}</h3>
                        <p className="font-game text-lg md:text-xl text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  </PixelPanel>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* How it Works */}
        <section className="py-12 md:py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              className="font-pixel text-sm md:text-lg text-center text-foreground mb-8 md:mb-12"
            >
              How It Works
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {[
                { step: '1', title: 'Schedule Quests', desc: 'Add your study tasks and set due dates. AI analyzes difficulty and assigns points.' },
                { step: '2', title: 'Complete & Prove', desc: 'Finish your task and upload proof - a screenshot, photo, or take a quiz.' },
                { step: '3', title: 'Get Verified', desc: 'Squad members review your proof. Earn points and maintain your streak!' },
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <PixelPanel variant="wood" className="mb-4 inline-block px-4 md:px-6 py-2 md:py-3">
                    <span className="font-pixel text-base md:text-lg text-primary-foreground">{item.step}</span>
                  </PixelPanel>
                  <h3 className="font-pixel text-[8px] md:text-[10px] text-foreground mb-2">{item.title}</h3>
                  <p className="font-game text-lg md:text-xl text-muted-foreground">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 md:py-16 px-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <PixelPanel variant="wood" className="text-center py-8 md:py-12 px-4">
              <Trophy className="w-12 h-12 md:w-16 md:h-16 text-game-gold mx-auto mb-4 md:mb-6 animate-float" />
              <h2 className="font-pixel text-sm md:text-lg text-primary-foreground mb-3 md:mb-4">
                Ready to Level Up?
              </h2>
              <p className="font-game text-xl md:text-2xl text-primary-foreground/80 mb-6 md:mb-8">
                Join students who've gamified their study routine
              </p>
              <Link to="/auth">
                <PixelButton variant="gold" className="text-base md:text-lg px-6 md:px-8 py-3 md:py-4">
                  Create Free Account
                </PixelButton>
              </Link>
            </PixelPanel>
          </motion.div>
        </section>

        {/* Made with Zuup Section */}
        <section className="py-12 md:py-16 px-4 bg-primary/5">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
            >
              <PixelPanel className="text-center py-8 px-6">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Heart className="w-5 h-5 text-destructive" />
                  <span className="font-pixel text-[10px] text-foreground">MADE WITH HELP FROM</span>
                  <Heart className="w-5 h-5 text-destructive" />
                </div>
                
                <a 
                  href="https://zuup.dev" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <h2 className="font-pixel text-xl md:text-2xl text-primary hover:text-primary/80 transition-colors mb-2">
                    Zuup
                  </h2>
                </a>
                
                <p className="font-game text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
                  Zuup is a social impact initiative by Zylon Labs that focuses on bridging the digital divide for underprivileged teenagers.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <GraduationCap className="w-8 h-8 text-primary mx-auto mb-2" />
                    <h3 className="font-pixel text-[8px] text-foreground mb-1">SKILL TRAINING</h3>
                    <p className="font-game text-sm text-muted-foreground">
                      Graphic design, MS Office, Python & video editing
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <Users className="w-8 h-8 text-game-gold mx-auto mb-2" />
                    <h3 className="font-pixel text-[8px] text-foreground mb-1">30+ LEARNERS</h3>
                    <p className="font-game text-sm text-muted-foreground">
                      Trained in foundational digital skills
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <Briefcase className="w-8 h-8 text-game-energy mx-auto mb-2" />
                    <h3 className="font-pixel text-[8px] text-foreground mb-1">FREELANCE READY</h3>
                    <p className="font-game text-sm text-muted-foreground">
                      Connecting students to real earning opportunities
                    </p>
                  </div>
                </div>

                <p className="font-game text-lg text-muted-foreground mb-4">
                  "Teach a person to fish" - providing marginalized youth with tools to participate in the digital economy.
                </p>

                <a 
                  href="https://zuup.dev" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <PixelButton variant="secondary" size="sm">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Learn More at zuup.dev
                  </PixelButton>
                </a>
              </PixelPanel>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-6 md:py-8 px-4 border-t border-border">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src={logo} alt="STFU Exams" className="w-6 h-6 object-contain" />
              <span className="font-game text-lg text-muted-foreground">STFU Exams by Zylon Lab</span>
            </div>
            <div className="flex items-center gap-4 md:gap-6">
              <Link to="/privacy" className="font-game text-lg text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link to="/terms" className="font-game text-lg text-muted-foreground hover:text-foreground transition-colors">
                Terms
              </Link>
            </div>
            <span className="font-game text-lg text-muted-foreground">
              © {new Date().getFullYear()} Zylon Lab
            </span>
          </div>
        </footer>
      </div>
    </>
  );
};
