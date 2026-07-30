/**
 * audioManager.ts
 *
 * Production-grade singleton audio manager for browser notification sounds.
 *
 * Features:
 *  - Single HTML Audio instance (reused, not recreated)
 *  - Preloads audio on construction
 *  - Unlocks audio after first user interaction (click / keydown / touchstart)
 *  - Prevents overlapping playback
 *  - Queues up to 1 sound within a configurable dedup window (default 1s)
 *  - Volume & mute persisted in localStorage
 *  - Logs playback failures in development only
 */

const STORAGE_KEY_VOLUME = 'mehta_notif_volume';
const STORAGE_KEY_MUTED  = 'mehta_notif_muted';
const DEDUP_WINDOW_MS    = 1000;

const isDev = process.env.NODE_ENV !== 'production';

function devWarn(...args: unknown[]) {
  if (isDev) console.warn('[AudioManager]', ...args);
}

class AudioManager {
  private audio: HTMLAudioElement | null = null;
  private unlocked = false;
  private queued = false;
  private lastPlayTime = 0;
  private dedupWindowMs: number;

  constructor(dedupWindowMs = DEDUP_WINDOW_MS) {
    this.dedupWindowMs = dedupWindowMs;
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    // Build element with dual-source fallback: WAV first (universal), MP3 second (Safari compat)
    this.audio = new Audio();
    this.audio.preload = 'auto';

    const src1 = document.createElement('source');
    src1.src  = '/sounds/notification.wav';
    src1.type = 'audio/wav';

    const src2 = document.createElement('source');
    src2.src  = '/sounds/notification.mp3';
    src2.type = 'audio/mpeg';

    this.audio.appendChild(src1);
    this.audio.appendChild(src2);
    this.audio.load();

    // Restore persisted settings
    this.audio.volume = this.getStoredVolume();
    this.audio.muted  = this.getStoredMuted();

    // Attach error listener
    this.audio.addEventListener('error', (e) => {
      devWarn('Audio element error:', e);
    });

    // Register unlock listeners — run once after the first user gesture
    const unlock = () => {
      if (this.unlocked || !this.audio) return;
      // Play a very brief silent segment to unblock the audio context
      this.audio.muted = true;
      this.audio.play()
        .then(() => {
          if (!this.audio) return;
          this.audio.pause();
          this.audio.currentTime = 0;
          this.audio.muted = this.getStoredMuted();
          this.unlocked = true;
          if (isDev) console.log('[AudioManager] Audio unlocked');

          // Drain any pending queued play
          if (this.queued) {
            this.queued = false;
            this._play();
          }
        })
        .catch((err) => {
          devWarn('Unlock play() failed:', err);
          // Keep mute consistent even on failure
          if (this.audio) this.audio.muted = this.getStoredMuted();
        });
    };

    window.addEventListener('click',      unlock, { once: true, passive: true });
    window.addEventListener('keydown',    unlock, { once: true, passive: true });
    window.addEventListener('touchstart', unlock, { once: true, passive: true });
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /** Trigger a notification sound. Respects mute, dedup window, and queuing. */
  play() {
    if (!this.audio) return;
    if (this.audio.muted) return;

    const now = Date.now();
    const sinceLast = now - this.lastPlayTime;

    // Dedup: if sound played very recently, queue at most one extra play
    if (sinceLast < this.dedupWindowMs) {
      if (!this.queued) {
        this.queued = true;
        const delay = this.dedupWindowMs - sinceLast;
        setTimeout(() => {
          this.queued = false;
          if (!this.audio?.muted) this._play();
        }, delay);
      }
      return;
    }

    if (!this.unlocked) {
      // Not yet unlocked — queue for after first gesture
      this.queued = true;
      return;
    }

    this._play();
  }

  private _play() {
    if (!this.audio) return;

    this.lastPlayTime = Date.now();

    // If already playing, restart from beginning
    if (!this.audio.paused) {
      this.audio.pause();
    }
    this.audio.currentTime = 0;

    this.audio.play().catch((err) => {
      devWarn('play() rejected:', err);
    });
  }

  // ─── Volume ─────────────────────────────────────────────────────────────────

  get volume(): number {
    return this.audio?.volume ?? this.getStoredVolume();
  }

  setVolume(v: number) {
    const clamped = Math.max(0, Math.min(1, v));
    if (this.audio) this.audio.volume = clamped;
    try { localStorage.setItem(STORAGE_KEY_VOLUME, String(clamped)); } catch {}
  }

  private getStoredVolume(): number {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_VOLUME);
      if (raw !== null) {
        const v = parseFloat(raw);
        if (!isNaN(v)) return Math.max(0, Math.min(1, v));
      }
    } catch {}
    return 0.8; // sensible default
  }

  // ─── Mute ────────────────────────────────────────────────────────────────────

  get isMuted(): boolean {
    return this.audio?.muted ?? this.getStoredMuted();
  }

  mute() {
    if (this.audio) this.audio.muted = true;
    try { localStorage.setItem(STORAGE_KEY_MUTED, 'true'); } catch {}
  }

  unmute() {
    if (this.audio) this.audio.muted = false;
    try { localStorage.setItem(STORAGE_KEY_MUTED, 'false'); } catch {}
  }

  toggleMute(): boolean {
    const next = !this.isMuted;
    next ? this.mute() : this.unmute();
    return next;
  }

  private getStoredMuted(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEY_MUTED) === 'true';
    } catch {}
    return false;
  }
}

// Singleton export — safe for SSR (only instantiated when window exists)
let _instance: AudioManager | null = null;

export function getAudioManager(): AudioManager {
  if (typeof window === 'undefined') {
    // Return a no-op stub for SSR
    return {
      play: () => {},
      volume: 0.8,
      setVolume: () => {},
      isMuted: false,
      mute: () => {},
      unmute: () => {},
      toggleMute: () => false,
    } as unknown as AudioManager;
  }
  if (!_instance) _instance = new AudioManager();
  return _instance;
}

export default AudioManager;
