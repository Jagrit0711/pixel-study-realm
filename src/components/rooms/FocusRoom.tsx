import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocusSession } from '@/hooks/useFocusSession';
import { useSpotify } from '@/hooks/useSpotify';
import { useTasks, Task } from '@/hooks/useTasks';
import { PixelPanel } from '@/components/game/PixelPanel';
import { PixelButton } from '@/components/game/PixelButton';
import { 
  Timer, 
  Camera, 
  Smartphone, 
  Music, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  Eye,
  EyeOff,
  Copy,
  Check,
  X,
  AlertTriangle,
  Sparkles,
  Zap,
  Target,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

// Cozy study background images
const STUDY_BACKGROUNDS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&h=1080&fit=crop&blur=5',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&h=1080&fit=crop&blur=5',
  'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1920&h=1080&fit=crop&blur=5',
];

export const FocusRoom = () => {
  const {
    session,
    isActive,
    elapsedTime,
    formattedTime,
    cameraStream,
    lastProctorResult,
    isProctoring,
    startSession,
    endSession,
    setVideoElement,
    calculatePoints
  } = useFocusSession();

  const {
    isConnected: spotifyConnected,
    isLoading: spotifyLoading,
    playback,
    playlists,
    connect: connectSpotify,
    fetchPlaylists,
    getPlaybackState,
    togglePlayback,
    skipNext,
    skipPrevious,
    playPlaylist
  } = useSpotify();

  const { tasks } = useTasks();

  const [showSetup, setShowSetup] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [showCamera, setShowCamera] = useState(true);
  const [backgroundIndex, setBackgroundIndex] = useState(0);
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Get today's tasks
  const todaysTasks = tasks.filter(t => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return t.date === today && t.status === 'planned';
  });

  // Setup video element when camera stream is ready
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
      setVideoElement(videoRef.current);
    }
  }, [cameraStream, setVideoElement]);

  // Fetch spotify playlists when connected
  useEffect(() => {
    if (spotifyConnected) {
      fetchPlaylists();
      getPlaybackState();
    }
  }, [spotifyConnected, fetchPlaylists, getPlaybackState]);

  // Poll playback state
  useEffect(() => {
    if (spotifyConnected && isActive) {
      const interval = setInterval(getPlaybackState, 5000);
      return () => clearInterval(interval);
    }
  }, [spotifyConnected, isActive, getPlaybackState]);

  // Rotate backgrounds
  useEffect(() => {
    const interval = setInterval(() => {
      setBackgroundIndex(prev => (prev + 1) % STUDY_BACKGROUNDS.length);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleStartSession = async () => {
    await startSession(selectedTaskId || undefined);
    setShowSetup(false);
  };

  const handleEndSession = async () => {
    const result = await endSession();
    if (result) {
      setShowSetup(true);
      setSelectedTaskId(null);
    }
  };

  const copyCode = () => {
    if (session?.pairedCode) {
      navigator.clipboard.writeText(session.pairedCode);
      setCodeCopied(true);
      toast.success('Code copied!');
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  // Setup screen
  if (showSetup) {
    return (
      <div className="min-h-screen p-4 pt-24 pb-32 md:pb-20">
        <div className="max-w-2xl mx-auto space-y-6">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <PixelPanel className="text-center p-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Target className="w-8 h-8 text-primary" />
                <h1 className="font-pixel text-lg text-primary">FOCUS ROOM</h1>
              </div>
              <p className="font-game text-xl text-muted-foreground">
                Deep focus sessions with AI proctoring and bonus points
              </p>
            </PixelPanel>
          </motion.div>

          {/* Spotify Connection */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <PixelPanel>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-game-energy" />
                  <h2 className="font-pixel text-[10px] text-foreground">SPOTIFY</h2>
                </div>
                {spotifyConnected ? (
                  <span className="font-game text-sm text-game-energy flex items-center gap-1">
                    <Check className="w-4 h-4" /> Connected
                  </span>
                ) : (
                  <span className="font-game text-sm text-muted-foreground">Not connected</span>
                )}
              </div>

              {!spotifyConnected ? (
                <div className="space-y-4">
                  <p className="font-game text-lg text-muted-foreground">
                    Connect Spotify to play study music during your focus session.
                  </p>
                  <PixelButton
                    onClick={connectSpotify}
                    disabled={spotifyLoading}
                    className="w-full"
                  >
                    <Music className="w-4 h-4 mr-2" />
                    {spotifyLoading ? 'Connecting...' : 'Connect Spotify'}
                  </PixelButton>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="font-game text-lg text-game-energy">
                    ✓ Ready to play music during focus session
                  </p>
                  {playback.track && (
                    <div className="flex items-center gap-3 p-2 bg-muted rounded">
                      {playback.track.albumArt && (
                        <img 
                          src={playback.track.albumArt} 
                          alt="Album" 
                          className="w-10 h-10 rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-game text-sm text-foreground truncate">
                          {playback.track.name}
                        </p>
                        <p className="font-game text-xs text-muted-foreground truncate">
                          {playback.track.artist}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </PixelPanel>
          </motion.div>

          {/* Task Selection */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <PixelPanel>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-game-gold" />
                <h2 className="font-pixel text-[10px] text-foreground">SELECT TASK (OPTIONAL)</h2>
              </div>

              {todaysTasks.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {todaysTasks.map(task => (
                    <button
                      key={task.id}
                      onClick={() => setSelectedTaskId(
                        selectedTaskId === task.id ? null : task.id
                      )}
                      className={`w-full p-3 rounded text-left transition-colors ${
                        selectedTaskId === task.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      <p className="font-game text-lg">{task.title}</p>
                      <p className="font-game text-sm opacity-70">
                        {task.subject} • {task.points} pts
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="font-game text-lg text-muted-foreground">
                  No tasks for today. You can still start a free focus session!
                </p>
              )}
            </PixelPanel>
          </motion.div>

          {/* Camera Permission Info */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <PixelPanel>
              <div className="flex items-center gap-2 mb-4">
                <Camera className="w-5 h-5 text-primary" />
                <h2 className="font-pixel text-[10px] text-foreground">AI PROCTOR</h2>
              </div>
              <p className="font-game text-lg text-muted-foreground mb-2">
                Camera access is required for AI focus verification.
              </p>
              <ul className="font-game text-sm text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-game-gold" />
                  +50 bonus points per hour of focused study
                </li>
                <li className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  -5 points if AI detects you're not studying
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-game-energy" />
                  Points can't go negative overall
                </li>
              </ul>
            </PixelPanel>
          </motion.div>

          {/* Start Button */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <PixelButton
              onClick={handleStartSession}
              size="lg"
              className="w-full"
            >
              <Target className="w-5 h-5 mr-2" />
              Start Focus Session
            </PixelButton>
          </motion.div>
        </div>
      </div>
    );
  }

  // Active focus session (fullscreen-like)
  return (
    <div className="fixed inset-0 z-40 bg-background">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
        style={{ 
          backgroundImage: `url(${STUDY_BACKGROUNDS[backgroundIndex]})`,
          filter: 'blur(8px) brightness(0.3)'
        }}
      />

      {/* Content overlay */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center p-4">
        {/* Timer */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center mb-8"
        >
          <div className="font-pixel text-6xl md:text-8xl text-primary mb-4 tracking-wider">
            {formattedTime}
          </div>
          <div className="flex items-center justify-center gap-4 text-muted-foreground">
            <span className="font-game text-xl flex items-center gap-2">
              <Zap className="w-5 h-5 text-game-gold" />
              {calculatePoints()} bonus pts
            </span>
            {session?.pointsDeducted && session.pointsDeducted > 0 && (
              <span className="font-game text-xl text-destructive">
                (-{session.pointsDeducted} penalties)
              </span>
            )}
          </div>
        </motion.div>

        {/* Pairing Code */}
        {session?.pairedCode && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <PixelPanel className="text-center">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="w-4 h-4 text-primary" />
                <span className="font-pixel text-[8px] text-foreground">PHONE LOCK-IN CODE</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-pixel text-2xl text-primary tracking-widest">
                  {session.pairedCode}
                </span>
                <button
                  onClick={copyCode}
                  className="p-2 hover:bg-muted rounded transition-colors"
                >
                  {codeCopied ? (
                    <Check className="w-5 h-5 text-game-energy" />
                  ) : (
                    <Copy className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              </div>
              <p className="font-game text-sm text-muted-foreground mt-2">
                Enter this code on your phone to lock in
              </p>
            </PixelPanel>
          </motion.div>
        )}

        {/* Spotify Player */}
        {spotifyConnected && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-8 w-full max-w-sm"
          >
            <PixelPanel className="p-3">
              {playback.track ? (
                <div className="flex items-center gap-3">
                  {playback.track.albumArt && (
                    <img 
                      src={playback.track.albumArt} 
                      alt="Album" 
                      className="w-12 h-12 rounded shadow-lg"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-game text-sm text-foreground truncate">
                      {playback.track.name}
                    </p>
                    <p className="font-game text-xs text-muted-foreground truncate">
                      {playback.track.artist}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={skipPrevious}
                      className="p-2 hover:bg-muted rounded"
                    >
                      <SkipBack className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={togglePlayback}
                      className="p-2 hover:bg-muted rounded"
                    >
                      {playback.isPlaying ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5" />
                      )}
                    </button>
                    <button 
                      onClick={skipNext}
                      className="p-2 hover:bg-muted rounded"
                    >
                      <SkipForward className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p className="font-game text-sm text-muted-foreground mb-2">
                    No music playing
                  </p>
                  <button
                    onClick={() => setShowPlaylistPicker(true)}
                    className="font-game text-sm text-primary hover:underline"
                  >
                    Pick a playlist →
                  </button>
                </div>
              )}
            </PixelPanel>
          </motion.div>
        )}

        {/* Proctor Status */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          {isProctoring ? (
            <div className="flex items-center gap-2 text-primary animate-pulse">
              <Eye className="w-5 h-5" />
              <span className="font-game text-sm">AI checking focus...</span>
            </div>
          ) : lastProctorResult ? (
            <div className={`flex items-center gap-2 ${
              lastProctorResult.isStudying ? 'text-game-energy' : 'text-destructive'
            }`}>
              {lastProctorResult.isStudying ? (
                <Check className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
              <span className="font-game text-sm">{lastProctorResult.reason}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Eye className="w-5 h-5" />
              <span className="font-game text-sm">First check in ~1 minute</span>
            </div>
          )}
        </motion.div>

        {/* Camera Preview */}
        <AnimatePresence>
          {showCamera && cameraStream && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed bottom-24 right-4 md:bottom-8"
            >
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-32 h-24 md:w-48 md:h-36 rounded-lg border-4 border-foreground object-cover"
                />
                <button
                  onClick={() => setShowCamera(false)}
                  className="absolute -top-2 -right-2 p-1 bg-destructive rounded-full"
                >
                  <X className="w-3 h-3 text-destructive-foreground" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Camera toggle */}
        {!showCamera && cameraStream && (
          <button
            onClick={() => setShowCamera(true)}
            className="fixed bottom-24 right-4 md:bottom-8 p-3 bg-muted rounded-full"
          >
            <Camera className="w-5 h-5" />
          </button>
        )}

        {/* End Session Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <PixelButton
            onClick={handleEndSession}
            variant="danger"
            size="lg"
          >
            <Timer className="w-5 h-5 mr-2" />
            End Session
          </PixelButton>
        </motion.div>

        {/* Playlist Picker Modal */}
        <AnimatePresence>
          {showPlaylistPicker && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
              onClick={() => setShowPlaylistPicker(false)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                onClick={e => e.stopPropagation()}
              >
                <PixelPanel className="w-80 max-h-96 overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-pixel text-[10px] text-foreground">YOUR PLAYLISTS</h3>
                    <button onClick={() => setShowPlaylistPicker(false)}>
                      <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {playlists.map(playlist => (
                      <button
                        key={playlist.id}
                        onClick={() => {
                          playPlaylist(playlist.id);
                          setShowPlaylistPicker(false);
                        }}
                        className="w-full flex items-center gap-3 p-2 bg-muted hover:bg-muted/80 rounded transition-colors"
                      >
                        {playlist.image ? (
                          <img 
                            src={playlist.image} 
                            alt="" 
                            className="w-10 h-10 rounded"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-primary/20 rounded flex items-center justify-center">
                            <Music className="w-5 h-5 text-primary" />
                          </div>
                        )}
                        <span className="font-game text-sm text-foreground truncate">
                          {playlist.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </PixelPanel>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hidden video element for proctor (if camera preview is hidden) */}
      {!showCamera && cameraStream && (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="hidden"
        />
      )}
    </div>
  );
};