import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SpotifyTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
  duration: number;
}

interface SpotifyPlayback {
  isPlaying: boolean;
  track: SpotifyTrack | null;
  progress: number;
  deviceId: string | null;
}

const STORAGE_KEY = 'spotify_tokens';

export const useSpotify = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [playback, setPlayback] = useState<SpotifyPlayback>({
    isPlaying: false,
    track: null,
    progress: 0,
    deviceId: null
  });
  const [playlists, setPlaylists] = useState<{ id: string; name: string; image: string }[]>([]);

  // Get tokens from localStorage
  const getTokens = (): SpotifyTokens | null => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  };

  // Save tokens to localStorage
  const saveTokens = (tokens: SpotifyTokens) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  };

  // Clear tokens
  const clearTokens = () => {
    localStorage.removeItem(STORAGE_KEY);
    setIsConnected(false);
  };

  // Refresh token if needed
  const refreshTokenIfNeeded = async (): Promise<string | null> => {
    const tokens = getTokens();
    if (!tokens) return null;

    // If token expires in less than 5 minutes, refresh it
    if (Date.now() > tokens.expiresAt - 300000) {
      try {
        const { data, error } = await supabase.functions.invoke('spotify-auth', {
          body: {
            action: 'refresh_token',
            refreshToken: tokens.refreshToken
          }
        });

        if (error || data.error) {
          clearTokens();
          return null;
        }

        const newTokens: SpotifyTokens = {
          accessToken: data.access_token,
          refreshToken: data.refresh_token || tokens.refreshToken,
          expiresAt: Date.now() + (data.expires_in * 1000)
        };
        saveTokens(newTokens);
        return newTokens.accessToken;
      } catch {
        clearTokens();
        return null;
      }
    }

    return tokens.accessToken;
  };

  // Check connection status on mount
  useEffect(() => {
    const tokens = getTokens();
    if (tokens && Date.now() < tokens.expiresAt) {
      setIsConnected(true);
    }
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');

      if (code && state === 'spotify_auth') {
        setIsLoading(true);
        try {
          const { data, error } = await supabase.functions.invoke('spotify-auth', {
            body: {
              action: 'exchange_code',
              code,
              redirectUri: `${window.location.origin}/game`
            }
          });

          if (error || data.error) {
            toast.error('Failed to connect Spotify');
            return;
          }

          const tokens: SpotifyTokens = {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt: Date.now() + (data.expires_in * 1000)
          };
          saveTokens(tokens);
          setIsConnected(true);
          toast.success('Spotify connected! 🎵');

          // Clear URL params
          window.history.replaceState({}, '', window.location.pathname);
        } catch (err) {
          console.error('Spotify callback error:', err);
          toast.error('Failed to connect Spotify');
        } finally {
          setIsLoading(false);
        }
      }
    };

    handleCallback();
  }, []);

  // Connect to Spotify
  const connect = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: {
          action: 'get_auth_url',
          redirectUri: `${window.location.origin}/game`
        }
      });

      if (error || data.error) {
        toast.error('Failed to get Spotify auth URL');
        return;
      }

      // Add state for verification
      const authUrl = data.authUrl + '&state=spotify_auth';
      window.location.href = authUrl;
    } catch (err) {
      console.error('Spotify connect error:', err);
      toast.error('Failed to connect to Spotify');
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect from Spotify
  const disconnect = () => {
    clearTokens();
    toast.info('Spotify disconnected');
  };

  // Fetch user's playlists
  const fetchPlaylists = useCallback(async () => {
    const accessToken = await refreshTokenIfNeeded();
    if (!accessToken) return;

    try {
      const response = await fetch('https://api.spotify.com/v1/me/playlists?limit=20', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (!response.ok) throw new Error('Failed to fetch playlists');

      const data = await response.json();
      setPlaylists(data.items.map((item: any) => ({
        id: item.id,
        name: item.name,
        image: item.images?.[0]?.url || ''
      })));
    } catch (err) {
      console.error('Error fetching playlists:', err);
    }
  }, []);

  // Get current playback state
  const getPlaybackState = useCallback(async () => {
    const accessToken = await refreshTokenIfNeeded();
    if (!accessToken) return;

    try {
      const response = await fetch('https://api.spotify.com/v1/me/player', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (response.status === 204) {
        setPlayback({ isPlaying: false, track: null, progress: 0, deviceId: null });
        return;
      }

      if (!response.ok) return;

      const data = await response.json();
      setPlayback({
        isPlaying: data.is_playing,
        track: data.item ? {
          id: data.item.id,
          name: data.item.name,
          artist: data.item.artists.map((a: any) => a.name).join(', '),
          albumArt: data.item.album.images?.[0]?.url || '',
          duration: data.item.duration_ms
        } : null,
        progress: data.progress_ms || 0,
        deviceId: data.device?.id || null
      });
    } catch (err) {
      console.error('Error getting playback state:', err);
    }
  }, []);

  // Play/pause toggle
  const togglePlayback = async () => {
    const accessToken = await refreshTokenIfNeeded();
    if (!accessToken) return;

    try {
      const endpoint = playback.isPlaying
        ? 'https://api.spotify.com/v1/me/player/pause'
        : 'https://api.spotify.com/v1/me/player/play';

      await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      setPlayback(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
    } catch (err) {
      console.error('Error toggling playback:', err);
      toast.error('Failed to control playback. Make sure Spotify is open on a device.');
    }
  };

  // Skip to next track
  const skipNext = async () => {
    const accessToken = await refreshTokenIfNeeded();
    if (!accessToken) return;

    try {
      await fetch('https://api.spotify.com/v1/me/player/next', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      setTimeout(getPlaybackState, 500);
    } catch (err) {
      console.error('Error skipping track:', err);
    }
  };

  // Skip to previous track
  const skipPrevious = async () => {
    const accessToken = await refreshTokenIfNeeded();
    if (!accessToken) return;

    try {
      await fetch('https://api.spotify.com/v1/me/player/previous', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      setTimeout(getPlaybackState, 500);
    } catch (err) {
      console.error('Error going to previous track:', err);
    }
  };

  // Play a specific playlist
  const playPlaylist = async (playlistId: string) => {
    const accessToken = await refreshTokenIfNeeded();
    if (!accessToken) return;

    try {
      await fetch('https://api.spotify.com/v1/me/player/play', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          context_uri: `spotify:playlist:${playlistId}`
        })
      });
      setTimeout(getPlaybackState, 500);
    } catch (err) {
      console.error('Error playing playlist:', err);
      toast.error('Failed to play playlist. Make sure Spotify is open on a device.');
    }
  };

  return {
    isConnected,
    isLoading,
    playback,
    playlists,
    connect,
    disconnect,
    fetchPlaylists,
    getPlaybackState,
    togglePlayback,
    skipNext,
    skipPrevious,
    playPlaylist
  };
};