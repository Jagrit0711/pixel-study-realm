import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX, Vibrate, Settings } from 'lucide-react';
import { PixelPanel } from './PixelPanel';
import { PixelButton } from './PixelButton';
import { useSettings, feedback } from '@/hooks/useSettings';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const { soundEnabled, hapticEnabled, soundVolume, toggleSound, toggleHaptic, setSoundVolume } = useSettings();

  const handleToggleSound = () => {
    toggleSound();
    feedback('click');
  };

  const handleToggleHaptic = () => {
    toggleHaptic();
    feedback('click');
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSoundVolume(parseFloat(e.target.value));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md"
          >
            <PixelPanel variant="dialog" className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Settings className="w-6 h-6 text-primary" />
                  <h2 className="font-pixel text-lg text-foreground">Settings</h2>
                </div>
                <PixelButton size="sm" variant="secondary" onClick={onClose}>
                  <X className="w-4 h-4" />
                </PixelButton>
              </div>

              <div className="space-y-6">
                {/* Sound Toggle */}
                <div className="flex items-center justify-between p-4 bg-card/30 pixel-border">
                  <div className="flex items-center gap-3">
                    {soundEnabled ? (
                      <Volume2 className="w-6 h-6 text-primary" />
                    ) : (
                      <VolumeX className="w-6 h-6 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-pixel text-sm text-foreground">Sound Effects</p>
                      <p className="font-game text-sm text-muted-foreground">
                        Button clicks and notifications
                      </p>
                    </div>
                  </div>
                  <PixelButton
                    size="sm"
                    variant={soundEnabled ? 'primary' : 'secondary'}
                    onClick={handleToggleSound}
                  >
                    {soundEnabled ? 'ON' : 'OFF'}
                  </PixelButton>
                </div>

                {/* Volume Slider */}
                {soundEnabled && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4"
                  >
                    <label className="font-pixel text-[8px] text-muted-foreground block mb-2">
                      VOLUME: {Math.round(soundVolume * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={soundVolume}
                      onChange={handleVolumeChange}
                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </motion.div>
                )}

                {/* Haptic Toggle */}
                <div className="flex items-center justify-between p-4 bg-card/30 pixel-border">
                  <div className="flex items-center gap-3">
                    <Vibrate className={`w-6 h-6 ${hapticEnabled ? 'text-accent' : 'text-muted-foreground'}`} />
                    <div>
                      <p className="font-pixel text-sm text-foreground">Haptic Feedback</p>
                      <p className="font-game text-sm text-muted-foreground">
                        Vibration on touch (mobile)
                      </p>
                    </div>
                  </div>
                  <PixelButton
                    size="sm"
                    variant={hapticEnabled ? 'accent' : 'secondary'}
                    onClick={handleToggleHaptic}
                  >
                    {hapticEnabled ? 'ON' : 'OFF'}
                  </PixelButton>
                </div>

                {/* Info */}
                <p className="font-game text-sm text-muted-foreground text-center">
                  Settings are saved automatically
                </p>
              </div>
            </PixelPanel>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
