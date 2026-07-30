"use client";

/**
 * useAudio.ts
 *
 * React hook wrapping the AudioManager singleton.
 * Provides reactive volume/mute state that syncs with localStorage.
 *
 * Usage:
 *   const { play, volume, setVolume, isMuted, toggleMute } = useAudio();
 */

import { useState, useCallback, useEffect } from 'react';
import { getAudioManager } from '@/lib/audioManager';

interface UseAudioReturn {
  /** Play the notification chime (respects mute & dedup window) */
  play: () => void;
  /** Current volume (0–1) */
  volume: number;
  /** Set volume (0–1) and persist to localStorage */
  setVolume: (v: number) => void;
  /** Whether the audio is currently muted */
  isMuted: boolean;
  /** Toggle mute; returns new muted state */
  toggleMute: () => boolean;
}

export function useAudio(): UseAudioReturn {
  const manager = getAudioManager();

  const [volume, setVolumeState] = useState<number>(() => manager.volume);
  const [isMuted, setIsMutedState] = useState<boolean>(() => manager.isMuted);

  // Sync state from manager on mount (handles values restored from localStorage)
  useEffect(() => {
    setVolumeState(manager.volume);
    setIsMutedState(manager.isMuted);
  }, []);

  const play = useCallback(() => {
    manager.play();
  }, []);

  const setVolume = useCallback((v: number) => {
    manager.setVolume(v);
    setVolumeState(Math.max(0, Math.min(1, v)));
  }, []);

  const toggleMute = useCallback((): boolean => {
    const nowMuted = manager.toggleMute();
    setIsMutedState(nowMuted);
    return nowMuted;
  }, []);

  return { play, volume, setVolume, isMuted, toggleMute };
}
