import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, Target, Users, Trophy, Shield, Gamepad2, Download, ArrowRight } from 'lucide-react';
import { PixelButton } from '@/components/game/PixelButton';
import { PixelPanel } from '@/components/game/PixelPanel';
import { GameBackground } from '@/components/game/GameBackground';
import { Helmet } from 'react-helmet-async';

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

export const LandingPage = () => {
  return (
    <>
      <Helmet>
        <title>GrindQuest - Gamified Study Accountability</title>
        <meta name="description" content="Transform your study routine into an epic adventure. Track tasks, earn points, and stay accountable with friends in this cozy pixel-art study game." />
      </Helmet>
      
      <div className="min-h-screen relative overflow-hidden">
        <GameBackground />
        
        {/* Navigation */}
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed top-0 left-0 right-0 z-50 px-4 py-4"
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Gamepad2 className="w-8 h-8 text-primary" />
              </motion.div>
              <span className="font-pixel text-sm text-foreground">GrindQuest</span>
            </div>
            
            <div className="flex items-center gap-4">
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
          </div>
        </motion.nav>

        {/* Hero Section */}
        <section className="pt-32 pb-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <div className="flex items-center justify-center gap-4 mb-6">
                <Sparkles className="w-10 h-10 text-game-gold animate-float" />
                <h1 className="font-pixel text-2xl md:text-3xl text-foreground text-shadow-pixel">
                  GrindQuest
                </h1>
                <Sparkles className="w-10 h-10 text-game-gold animate-float" />
              </div>
              <p className="font-game text-3xl md:text-4xl text-muted-foreground max-w-2xl mx-auto">
                Transform your study routine into an epic pixel-art adventure
              </p>
            </motion.div>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="font-game text-xl text-muted-foreground mb-8 max-w-xl mx-auto"
            >
              Track tasks, earn points, complete quests, and stay accountable with your squad. 
              The cozy way to crush your study goals.
            </motion.p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link to="/auth">
                <PixelButton variant="primary" className="flex items-center gap-2 text-lg px-8 py-4">
                  Start Your Quest
                  <ArrowRight className="w-5 h-5" />
                </PixelButton>
              </Link>
              <PixelButton 
                variant="secondary" 
                className="flex items-center gap-2"
                onClick={() => {
                  if ('BeforeInstallPromptEvent' in window) {
                    // PWA install will be handled by browser
                  }
                  window.location.href = '/install';
                }}
              >
                <Download className="w-5 h-5" />
                Install App
              </PixelButton>
            </motion.div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
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
                    <div className="flex items-start gap-4">
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                      >
                        <feature.icon className="w-10 h-10 text-primary shrink-0" />
                      </motion.div>
                      <div>
                        <h3 className="font-pixel text-[10px] text-foreground mb-2">{feature.title}</h3>
                        <p className="font-game text-xl text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  </PixelPanel>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* How it Works */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              className="font-pixel text-lg text-center text-foreground mb-12"
            >
              How It Works
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                  <PixelPanel variant="wood" className="mb-4 inline-block px-6 py-3">
                    <span className="font-pixel text-lg text-primary-foreground">{item.step}</span>
                  </PixelPanel>
                  <h3 className="font-pixel text-[10px] text-foreground mb-2">{item.title}</h3>
                  <p className="font-game text-xl text-muted-foreground">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <PixelPanel variant="wood" className="text-center py-12">
              <Trophy className="w-16 h-16 text-game-gold mx-auto mb-6 animate-float" />
              <h2 className="font-pixel text-lg text-primary-foreground mb-4">
                Ready to Level Up?
              </h2>
              <p className="font-game text-2xl text-primary-foreground/80 mb-8">
                Join thousands of students who've gamified their study routine
              </p>
              <Link to="/auth">
                <PixelButton variant="gold" className="text-lg px-8 py-4">
                  Create Free Account
                </PixelButton>
              </Link>
            </PixelPanel>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 border-t border-border">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-muted-foreground" />
              <span className="font-game text-lg text-muted-foreground">GrindQuest by Zylon Labs</span>
            </div>
            <div className="flex items-center gap-6">
              <Link to="/privacy" className="font-game text-lg text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="font-game text-lg text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </Link>
            </div>
            <span className="font-game text-lg text-muted-foreground">
              © {new Date().getFullYear()} Zylon Labs
            </span>
          </div>
        </footer>
      </div>
    </>
  );
};
