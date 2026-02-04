import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface FocusSession {
  id: string;
  startTime: Date;
  duration: number; // in seconds
  taskId?: string;
  pairedCode?: string;
  phonePaired: boolean;
  proctorChecks: ProctorCheck[];
  pointsEarned: number;
  pointsDeducted: number;
  isActive: boolean;
}

export interface ProctorCheck {
  timestamp: Date;
  isStudying: boolean;
  confidence: number;
  reason: string;
}

const PROCTOR_INTERVAL = 3 * 60 * 1000; // Check every 3 minutes
const POINTS_PER_HOUR = 50;
const PENALTY_POINTS = 5;

export const useFocusSession = () => {
  const { user } = useAuth();
  const [session, setSession] = useState<FocusSession | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [lastProctorResult, setLastProctorResult] = useState<ProctorCheck | null>(null);
  const [isProctoring, setIsProctoring] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const proctorRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Generate a random 6-digit code
  const generatePairingCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 480 } 
      });
      setCameraStream(stream);
      return stream;
    } catch (error) {
      console.error('Failed to start camera:', error);
      toast.error('Camera access required for focus mode');
      return null;
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  // Capture frame from video
  const captureFrame = (): string | null => {
    if (!videoRef.current) return null;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      return canvas.toDataURL('image/jpeg', 0.7);
    }
    return null;
  };

  // Proctor check with AI
  const runProctorCheck = async () => {
    if (!isActive || isProctoring) return;

    setIsProctoring(true);
    const imageBase64 = captureFrame();

    if (!imageBase64) {
      setIsProctoring(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('focus-proctor', {
        body: { imageBase64 }
      });

      if (error) throw error;

      const check: ProctorCheck = {
        timestamp: new Date(),
        isStudying: data.isStudying,
        confidence: data.confidence,
        reason: data.reason
      };

      setLastProctorResult(check);
      
      setSession(prev => {
        if (!prev) return null;
        
        const newChecks = [...prev.proctorChecks, check];
        let pointsDeducted = prev.pointsDeducted;

        if (!data.isStudying && data.confidence > 70) {
          // Deduct points but don't go negative overall
          pointsDeducted += PENALTY_POINTS;
          toast.warning(`Focus check failed: -${PENALTY_POINTS} points. ${data.tips || 'Stay focused!'}`);
        }

        return {
          ...prev,
          proctorChecks: newChecks,
          pointsDeducted
        };
      });

    } catch (error) {
      console.error('Proctor check failed:', error);
    } finally {
      setIsProctoring(false);
    }
  };

  // Start focus session
  const startSession = async (taskId?: string) => {
    const stream = await startCamera();
    if (!stream) return null;

    const code = generatePairingCode();
    const newSession: FocusSession = {
      id: `focus_${Date.now()}`,
      startTime: new Date(),
      duration: 0,
      taskId,
      pairedCode: code,
      phonePaired: false,
      proctorChecks: [],
      pointsEarned: 0,
      pointsDeducted: 0,
      isActive: true
    };

    setSession(newSession);
    setIsActive(true);
    setElapsedTime(0);

    // Start timer
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    // Start proctor checks after 1 minute
    setTimeout(() => {
      proctorRef.current = setInterval(runProctorCheck, PROCTOR_INTERVAL);
    }, 60000);

    toast.success('Focus session started! Stay focused! 🎯');
    return newSession;
  };

  // End focus session and award points
  const endSession = async () => {
    if (!session || !user) return null;

    // Stop timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (proctorRef.current) {
      clearInterval(proctorRef.current);
      proctorRef.current = null;
    }

    stopCamera();

    // Calculate points (50 per hour)
    const hours = elapsedTime / 3600;
    const basePoints = Math.floor(hours * POINTS_PER_HOUR);
    const netPoints = Math.max(0, basePoints - session.pointsDeducted);

    // Update profile points
    if (netPoints > 0) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_points, exp, level')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        let newExp = profile.exp + netPoints;
        let newLevel = profile.level;
        
        let expForNextLevel = newLevel * 100;
        while (newExp >= expForNextLevel) {
          newExp -= expForNextLevel;
          newLevel++;
          expForNextLevel = newLevel * 100;
        }

        await supabase
          .from('profiles')
          .update({
            total_points: profile.total_points + netPoints,
            exp: newExp,
            level: newLevel
          })
          .eq('user_id', user.id);

        toast.success(`Focus session complete! +${netPoints} bonus points earned!`);
      }
    } else {
      toast.info('Focus session complete. Keep working on your focus!');
    }

    const finalSession = {
      ...session,
      duration: elapsedTime,
      pointsEarned: netPoints,
      isActive: false
    };

    setSession(null);
    setIsActive(false);
    setElapsedTime(0);
    setLastProctorResult(null);

    return finalSession;
  };

  // Pair phone
  const pairPhone = (code: string): boolean => {
    if (!session || code.toUpperCase() !== session.pairedCode) {
      return false;
    }
    setSession(prev => prev ? { ...prev, phonePaired: true } : null);
    return true;
  };

  // Set video ref for proctor
  const setVideoElement = useCallback((video: HTMLVideoElement | null) => {
    videoRef.current = video;
    if (video && cameraStream) {
      video.srcObject = cameraStream;
    }
  }, [cameraStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (proctorRef.current) clearInterval(proctorRef.current);
      stopCamera();
    };
  }, []);

  // Format time for display
  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return {
    session,
    isActive,
    elapsedTime,
    formattedTime: formatTime(elapsedTime),
    cameraStream,
    lastProctorResult,
    isProctoring,
    startSession,
    endSession,
    pairPhone,
    setVideoElement,
    calculatePoints: () => {
      const hours = elapsedTime / 3600;
      const basePoints = Math.floor(hours * POINTS_PER_HOUR);
      return Math.max(0, basePoints - (session?.pointsDeducted || 0));
    }
  };
};