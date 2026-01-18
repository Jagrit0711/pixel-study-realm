import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Smartphone, Monitor, CheckCircle } from 'lucide-react';
import { PixelButton } from '@/components/game/PixelButton';
import { PixelPanel } from '@/components/game/PixelPanel';
import { GameBackground } from '@/components/game/GameBackground';
import { Helmet } from 'react-helmet-async';
import logo from '@/assets/logo.png';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPage = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Redirect if already installed
  useEffect(() => {
    if (isInstalled) {
      const timer = setTimeout(() => {
        navigate('/auth');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isInstalled, navigate]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <>
      <Helmet>
        <title>Install STFU Exams - Get the App</title>
        <meta name="description" content="Install STFU Exams on your device for the best experience. Works offline and loads instantly." />
      </Helmet>
      
      <div className="min-h-screen relative">
        <GameBackground />
        
        {/* Navigation */}
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed top-0 left-0 right-0 z-50 px-4 py-3 bg-background/80 backdrop-blur-sm"
        >
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="STFU Exams" className="w-6 h-6" />
              <span className="font-pixel text-[8px] md:text-sm text-foreground">STFU Exams</span>
            </Link>
            <Link to="/">
              <PixelButton size="sm" variant="secondary" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </PixelButton>
            </Link>
          </div>
        </motion.nav>

        <main className="pt-20 md:pt-24 pb-16 px-4">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-center mb-6 md:mb-8"
            >
              <Download className="w-12 h-12 md:w-16 md:h-16 text-primary mx-auto mb-4 md:mb-6 animate-float" />
              <h1 className="font-pixel text-base md:text-xl text-foreground mb-3 md:mb-4">Install STFU Exams</h1>
              <p className="font-game text-xl md:text-2xl text-muted-foreground">
                Get the app on your device for the best experience
              </p>
            </motion.div>

            {isInstalled ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <PixelPanel className="text-center py-6 md:py-8">
                  <CheckCircle className="w-12 h-12 md:w-16 md:h-16 text-primary mx-auto mb-4" />
                  <h2 className="font-pixel text-[10px] md:text-sm text-foreground mb-2">Already Installed!</h2>
                  <p className="font-game text-lg md:text-xl text-muted-foreground mb-4 md:mb-6">
                    STFU Exams is installed. Redirecting to app...
                  </p>
                  <Link to="/auth">
                    <PixelButton>Go to App</PixelButton>
                  </Link>
                </PixelPanel>
              </motion.div>
            ) : (
              <div className="space-y-4 md:space-y-6">
                {/* Direct Install (Android/Chrome) */}
                {deferredPrompt && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                  >
                    <PixelPanel variant="wood" className="text-center py-6 md:py-8">
                      <Smartphone className="w-10 h-10 md:w-12 md:h-12 text-primary-foreground mx-auto mb-4" />
                      <h2 className="font-pixel text-[10px] md:text-sm text-primary-foreground mb-3 md:mb-4">Quick Install</h2>
                      <p className="font-game text-lg md:text-xl text-primary-foreground/80 mb-4 md:mb-6">
                        Click the button below to install STFU Exams
                      </p>
                      <PixelButton variant="gold" onClick={handleInstall}>
                        Install Now
                      </PixelButton>
                    </PixelPanel>
                  </motion.div>
                )}

                {/* iOS Instructions */}
                {isIOS && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <PixelPanel className="py-4 md:py-6">
                      <div className="flex items-center gap-3 md:gap-4 mb-4">
                        <Smartphone className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                        <h2 className="font-pixel text-[8px] md:text-[10px] text-foreground">iPhone / iPad</h2>
                      </div>
                      <ol className="font-game text-lg md:text-xl text-muted-foreground space-y-2 md:space-y-3 list-decimal list-inside">
                        <li>Tap the <strong>Share</strong> button in Safari</li>
                        <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                        <li>Tap <strong>"Add"</strong> in the top right corner</li>
                        <li>Launch STFU Exams from your home screen!</li>
                      </ol>
                    </PixelPanel>
                  </motion.div>
                )}

                {/* Android Instructions */}
                {!deferredPrompt && !isIOS && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <PixelPanel className="py-4 md:py-6">
                      <div className="flex items-center gap-3 md:gap-4 mb-4">
                        <Smartphone className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                        <h2 className="font-pixel text-[8px] md:text-[10px] text-foreground">Android</h2>
                      </div>
                      <ol className="font-game text-lg md:text-xl text-muted-foreground space-y-2 md:space-y-3 list-decimal list-inside">
                        <li>Tap the <strong>menu icon</strong> (three dots) in Chrome</li>
                        <li>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></li>
                        <li>Tap <strong>"Install"</strong> to confirm</li>
                        <li>Launch STFU Exams from your home screen!</li>
                      </ol>
                    </PixelPanel>
                  </motion.div>
                )}

                {/* Desktop Instructions */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <PixelPanel className="py-4 md:py-6">
                    <div className="flex items-center gap-3 md:gap-4 mb-4">
                      <Monitor className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                      <h2 className="font-pixel text-[8px] md:text-[10px] text-foreground">Desktop (Chrome/Edge)</h2>
                    </div>
                    <ol className="font-game text-lg md:text-xl text-muted-foreground space-y-2 md:space-y-3 list-decimal list-inside">
                      <li>Look for the <strong>install icon</strong> in the address bar</li>
                      <li>Click <strong>"Install"</strong> when prompted</li>
                      <li>STFU Exams will open as a standalone app!</li>
                    </ol>
                  </PixelPanel>
                </motion.div>

                {/* Benefits */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <PixelPanel variant="wood" className="py-4 md:py-6">
                    <h2 className="font-pixel text-[10px] md:text-sm text-primary-foreground mb-4 text-center">Why Install?</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                      {[
                        { title: 'Works Offline', desc: 'Access your tasks without internet' },
                        { title: 'Faster Loading', desc: 'Instant launch from home screen' },
                        { title: 'Full Screen', desc: 'No browser UI, more space' },
                        { title: 'Push Notifications', desc: 'Get reminded of your tasks' },
                      ].map((benefit) => (
                        <div key={benefit.title} className="flex items-start gap-2 md:gap-3">
                          <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-game-gold shrink-0 mt-1" />
                          <div>
                            <h3 className="font-game text-lg md:text-xl text-primary-foreground">{benefit.title}</h3>
                            <p className="font-game text-sm md:text-lg text-primary-foreground/70">{benefit.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </PixelPanel>
                </motion.div>
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="py-6 md:py-8 px-4 border-t border-border">
          <div className="max-w-4xl mx-auto text-center">
            <span className="font-game text-lg text-muted-foreground">
              © {new Date().getFullYear()} Zylon Lab. All rights reserved.
            </span>
          </div>
        </footer>
      </div>
    </>
  );
};
