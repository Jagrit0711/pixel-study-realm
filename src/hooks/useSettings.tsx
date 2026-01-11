import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  soundEnabled: boolean;
  hapticEnabled: boolean;
  soundVolume: number;
  toggleSound: () => void;
  toggleHaptic: () => void;
  setSoundVolume: (volume: number) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      hapticEnabled: true,
      soundVolume: 0.5,
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      toggleHaptic: () => set((state) => ({ hapticEnabled: !state.hapticEnabled })),
      setSoundVolume: (volume) => set({ soundVolume: volume }),
    }),
    {
      name: 'game-settings',
    }
  )
);

// Haptic feedback utility
export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  const { hapticEnabled } = useSettings.getState();
  if (!hapticEnabled) return;
  
  if ('vibrate' in navigator) {
    const durations = {
      light: 10,
      medium: 25,
      heavy: 50,
    };
    navigator.vibrate(durations[type]);
  }
};

// Sound effects
const soundCache: Record<string, HTMLAudioElement> = {};

const SOUNDS = {
  click: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj2NxezDfDwQO4XD9MRxHwI5h8f2wmQZADOHzf3JZxQALobP/8thDQAqhs//y2ALACeF0P/NYAoAI4TR/89eCAAghNL/0V0GAB2E0//TXAQAGoTU/9VbAwAXhNX/1loCABSE1v/YWQEAEoTX/9lYAAAPhNj/2lcAAA2E2f/bVgAACoTa/9xVAAAIhNv/3VUAAAWF3P/eVAAABIXc/99UAAACHX3f/+NRAAAdfd//41EAAB194//jUAAAHn3j/+NQAAAefOP/40',
  success: 'data:audio/wav;base64,UklGRl9vAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQtvAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+Uyf7Mdig8k9D/z3IiPJHR/9B0ID2Q0v/RdiA+j9P/0nggP47U/9N6IECNMf/UeyBBjNb/1X0gQovX/9Z/IEOKMf/XgCBEiTL/2IEgRYgy/9mCIEaHM//ahCBHhjT/24UgSIU1/9yGIEmENv/dhyBKgzf/3oggS4I4/9+JIEyBOf/giyBNgDr/4YwgTn87/+KNIFAAADv/440gUX47/+SOIFJ9PP/ljyBTexz/5pAgVHoc/+eRIFV5HP/okyBWeBz/6ZQgV3cc/+qVIFh2HP/rliBZdRz/7JcgWnQc/+2YIFtzHP/umSBccxz/75ogXXIc//CbIF5xHP/xnCBfcBz/8p0gYG8c//OeIGFuHP/0nyBibRz/9aAgY2wc//WhIGRrHP/2oiBlaRz/96QgZmgc//ilIGdnHP/5piBnaRz/+acgaGsA//qoIGlqHP/7qSBqaRz//KogbGgc//2rIG1nAP/+qyBuZgD//60gcGQd//+uIHFjHQAAryByYh0AALAgc2EdAACxIHRgHQAAsiB1Xh0AALQgdl0dAAC1IHdcHQAAtiB4Wx0AALcgeVodAAC4IHpZHQAAuSB7WB0AALogfFcdAAC7IH1WHQAA',
  error: 'data:audio/wav;base64,UklGRl9vAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQtvAACBhYqFbF1fdH2CgX9pXV95jI2Jd2Nfdn+Fgnx1YGF4goSBfHVfYXd/gn97dF9geH6Bf3t0YGB3fYB+e3NgYHd8f316cmBgdnx+fXpyYF92e318eXFgX3Z7fXx5cWBfdnt9fHlxYF91e3x8eXFgX3V7fHt5cF9fdXt8e3lwX191e3x7eXBfX3V6fHt5cF9fdHp7e3hwX191ent7eHBfX3R6e3p4cF9fdHp7enhwX190ent6eHBfX3R5e3l3b19fdHl7eXdvX19zeXp5d29fX3N5enl3b19fc3l6eXdvXl9zeXl5d25eX3J5eXh2bl5fcnl5eHZuXl9yeXl4dm5eX3J4eXh2bl5ecnh5eHZuXl5yeHl4dm5eXnJ4eHh1bV5ecnh4eHVtXl5xeHh4dW1eXnF4eHd1bV5ecXd4d3VtXl5xd3d3dWxeXnF3d3d1bF5ecXd3d3VsXV5xd3d3dWxdXnB3d3Z0bF1ecHZ3dnRsXV5wdnd2dGtdXXB2dnZ0a11dcHZ2dnRrXV1wdnZ2dGtdXXB2dnV0a1xdcHZ2dXRrXF1wdnZ1dGpcXW92dnV0alxdb3Z2dXNqXF1vdnV1c2pcXW92dXVzalxdb3V1dXNqXF1vdXV1c2pcXG91dXRzaVxcb3V1dHNpXFxvdXV0c2lcXG91dXRyaVtcb3V0dHJpW1xvdXR0cmlbXG90dHRyaVtcb3R0dHJpW1xvdHR0cmlbW290dHRyaFtbb3R0c3JoW1tvdHRzcmhbW250dHNyaFtbbXR0c3JoW1ttdHNzcmhbW210c3NxZ1tbbXRzc3FnW1ttdHNzcWdbW21zc3NxZ1pbbXNzc3FnWlttc3NzcWdaW21zc3NxZ1pbbXNzc3BmWlttc3NzcGZaW2xzc3NwZlpbbHNzc3BmWlpsc3NzcGZaWmxzc3JwZllabHJzcnBlWVpsc3JycGVZWmxyc3JwZVlabHJycnBlWVlscnJycGVZWWxycnJwZVlZbHJycnBkWVlscnJycGRZWWxycnJvZFlZbHJycm9kWVlrcnJyb2RZWWtycnJvZFhZa3Jycm9kWFhra3Jyb2NYWGtycnJvY1hYa3Jyb29jWFhra3Jvb2NYWGtycm9vY1hYa3Fxb29jV1hra3Fvb2NXV2txcW9vY1dXa3Fxb29jV1drcc',
  levelUp: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+OwfHDejkKOYnF9sVwHAA0h8z6ymYVACqF0f/OYQ0AH4TW/9VaAgAJhN//31MAAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+OwfHDejkKOYnF9sVwHAA0h8z6ymYVACqF0f/OYQ0AH4TW/9VaAgAJhN//31MAAA',
};

export const playSound = (soundName: keyof typeof SOUNDS) => {
  const { soundEnabled, soundVolume } = useSettings.getState();
  if (!soundEnabled) return;

  try {
    let audio = soundCache[soundName];
    if (!audio) {
      audio = new Audio(SOUNDS[soundName]);
      soundCache[soundName] = audio;
    }
    audio.volume = soundVolume;
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Ignore autoplay errors
    });
  } catch (e) {
    // Ignore sound errors
  }
};

// Combined feedback function
export const feedback = (type: 'click' | 'success' | 'error' | 'levelUp' = 'click') => {
  const hapticMap: Record<string, 'light' | 'medium' | 'heavy'> = {
    click: 'light',
    success: 'medium',
    error: 'medium',
    levelUp: 'heavy',
  };
  
  triggerHaptic(hapticMap[type]);
  playSound(type);
};
