import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { PixelPanel } from '@/components/game/PixelPanel';
import { PixelButton } from '@/components/game/PixelButton';
import { PixelInput } from '@/components/game/PixelInput';
import { Timer, Lock, Smartphone, AlertTriangle, Zap, Check, X, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';

 // Cozy study backgrounds - warm, aesthetic lo-fi vibes
 const STUDY_BACKGROUNDS = [
   'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1920&h=1080&fit=crop', // cozy desk setup
   'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=1920&h=1080&fit=crop', // warm coffee shop
   'https://images.unsplash.com/photo-1495314736024-fa5e4b37b979?w=1920&h=1080&fit=crop', // rainy window
   'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1920&h=1080&fit=crop', // library aesthetic
   'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1920&h=1080&fit=crop', // cozy room
 ];

 const PhoneLockPage = () => {
  const [code, setCode] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [backgroundIndex, setBackgroundIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [exitAttempts, setExitAttempts] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Format time
  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Request wake lock to keep screen on
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        console.log('Wake lock acquired');
      }
    } catch (err) {
      console.log('Wake lock error:', err);
    }
  };

  // Release wake lock
  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  };

  // Enter fullscreen
  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch (err) {
      console.log('Fullscreen error:', err);
    }
  };

  // Handle visibility change (detect when user tries to leave)
  useEffect(() => {
    if (!isLocked) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setExitAttempts(prev => prev + 1);
        setShowExitWarning(true);
        
        // Vibrate if supported
        if ('vibrate' in navigator) {
          navigator.vibrate([200, 100, 200]);
        }
        
        toast.warning('Stay focused! Return to the app.');
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isLocked]);

  // Handle lock
  const handleLock = async () => {
    if (code.length !== 6) {
      toast.error('Enter the 6-character code from your laptop');
      return;
    }

    // In a real app, we'd verify this code with the server
    // For now, we just accept any 6-character code
    setIsLocked(true);
    await requestWakeLock();
    await enterFullscreen();

    // Start timer
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    toast.success('Phone locked! Stay focused! 🎯');
  };

  // Handle unlock
  const handleUnlock = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    releaseWakeLock();
    
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }

    setIsLocked(false);
    setElapsedTime(0);
    setCode('');
    setExitAttempts(0);
    setShowExitWarning(false);
    toast.info('Focus session ended on phone');
  };

  // Rotate backgrounds
  useEffect(() => {
    const interval = setInterval(() => {
      setBackgroundIndex(prev => (prev + 1) % STUDY_BACKGROUNDS.length);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      releaseWakeLock();
    };
  }, []);

  // Locked screen
  if (isLocked) {
    return (
      <div className="fixed inset-0 bg-background overflow-hidden">
       {/* Cozy background with gradient overlay */}
       <div className="absolute inset-0">
         <div 
           className="absolute inset-0 bg-cover bg-center transition-all duration-2000"
           style={{ 
             backgroundImage: `url(${STUDY_BACKGROUNDS[backgroundIndex]})`,
           }}
         />
         {/* Warm gradient overlay for cozy vibe - using design tokens */}
         <div className="absolute inset-0 bg-gradient-to-br from-muted via-background/70 to-accent/40" />
         <div className="absolute inset-0 backdrop-blur-sm" />
       </div>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center p-6">
          {/* Exit warning */}
          {showExitWarning && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute top-8 left-4 right-4"
            >
              <div className="bg-destructive/90 text-destructive-foreground p-4 rounded-lg flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                <div>
                  <p className="font-game text-lg font-bold">Stay Focused!</p>
                  <p className="font-game text-sm">
                    {exitAttempts} exit attempt(s). Keep your eyes on the prize!
                  </p>
                </div>
                <button 
                  onClick={() => setShowExitWarning(false)}
                  className="p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Lock icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="mb-8"
          >
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
              <Lock className="w-12 h-12 text-primary" />
            </div>
          </motion.div>

          {/* Timer */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-12"
          >
            <div className="font-pixel text-5xl text-primary mb-4 tracking-wider">
              {formatTime(elapsedTime)}
            </div>
            <p className="font-game text-xl text-muted-foreground">
              Focus session in progress
            </p>
          </motion.div>

          {/* Motivational messages */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center mb-12"
          >
            <PixelPanel className="inline-block">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-game-gold" />
                <span className="font-game text-lg text-foreground">
                  Every minute counts. You got this!
                </span>
              </div>
            </PixelPanel>
          </motion.div>

          {/* Mute toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="absolute bottom-32 right-6 p-3 bg-muted/50 rounded-full"
          >
            {isMuted ? (
              <VolumeX className="w-6 h-6 text-muted-foreground" />
            ) : (
              <Volume2 className="w-6 h-6 text-foreground" />
            )}
          </button>

          {/* Unlock button (at bottom) */}
          <div className="absolute bottom-8 left-4 right-4">
            <PixelButton
              onClick={handleUnlock}
              variant="danger"
              size="lg"
              className="w-full"
            >
              <Timer className="w-5 h-5 mr-2" />
              End Focus Session
            </PixelButton>
          </div>
        </div>
      </div>
    );
  }

  // Code entry screen
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-8"
      >
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
          <Smartphone className="w-10 h-10 text-primary" />
        </div>
        <h1 className="font-pixel text-xl text-primary mb-2">PHONE LOCK-IN</h1>
        <p className="font-game text-xl text-muted-foreground max-w-xs">
          Enter the code from your laptop to lock this phone during focus time
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-xs space-y-6"
      >
        <PixelPanel>
          <div className="space-y-4">
            <PixelInput
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="ENTER CODE"
              maxLength={6}
              className="text-center text-2xl tracking-widest"
              autoFocus
            />
            <p className="font-game text-sm text-muted-foreground text-center">
              6-character code from laptop
            </p>
          </div>
        </PixelPanel>

        <PixelButton
          onClick={handleLock}
          size="lg"
          className="w-full"
          disabled={code.length !== 6}
        >
          <Lock className="w-5 h-5 mr-2" />
          Lock Phone & Focus
        </PixelButton>

        <div className="text-center">
          <p className="font-game text-sm text-muted-foreground">
            This will enable focus mode and discourage app switching
          </p>
        </div>
      </motion.div>
    </div>
  );
 };
 
 export default PhoneLockPage;
