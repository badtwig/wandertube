import { VIDEO_DATABASE, VideoItem } from '../data/videos';

// In-memory session tracking only (stateless across page reloads, zero reliance on browser localStorage or disk cache)
const MAX_RECENT_SESSION_HISTORY = 18;
const sessionRecentIds: string[] = [];
let sessionRollCount = 1;
let activeVideoItem: VideoItem | null = null;
let lastDrawTime = 0;

// True cryptographic random integer [0, max - 1]
function getSecureRandomInt(max: number): number {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return Math.floor((array[0] / (0xffffffff + 1)) * max);
  }
  return Math.floor(Math.random() * max);
}

export interface DeckStats {
  remainingInDeck: number;
  totalInCatalog: number;
  seenCountInCycle: number;
  cycleNumber: number;
  sessionRolls: number;
}

export class ShuffleDeckEngine {
  /**
   * Pure, unbiased, cache-independent random video picker.
   * Does NOT check localStorage or rely on persistent cookies/cache.
   * Avoids repeating the currently active video and avoids recent videos in the active session.
   */
  public static drawNextVideo(forceDifferentFromId?: string): { video: VideoItem; stats: DeckStats } {
    const total = VIDEO_DATABASE.length;
    if (total === 0) {
      throw new Error('Video database is empty');
    }

    const currentId = forceDifferentFromId || activeVideoItem?.id;

    // Filter candidates to avoid the immediate active video and recent session rolls
    let candidates = VIDEO_DATABASE.filter(v => v.id !== currentId && !sessionRecentIds.includes(v.id));

    // If recent history has filtered out too many, just avoid the immediate active video
    if (candidates.length === 0) {
      candidates = VIDEO_DATABASE.filter(v => v.id !== currentId);
    }

    // Safety fallback
    if (candidates.length === 0) {
      candidates = VIDEO_DATABASE;
    }

    // Pick uniformly at random with cryptographic entropy
    const randomIndex = getSecureRandomInt(candidates.length);
    const chosenVideo = candidates[randomIndex];

    // Record to lightweight session memory
    sessionRecentIds.push(chosenVideo.id);
    if (sessionRecentIds.length > MAX_RECENT_SESSION_HISTORY) {
      sessionRecentIds.shift();
    }

    sessionRollCount++;
    activeVideoItem = chosenVideo;
    lastDrawTime = Date.now();

    return {
      video: chosenVideo,
      stats: this.getStats(),
    };
  }

  /**
   * Safe initial video selection on page load / refresh.
   * Uses pure cryptographic randomness directly with zero cache dependency.
   * Guards against React 19 Strict Mode double-calling initializers in the same tick.
   */
  public static getOrDrawInitialVideo(forceDifferentFromId?: string): { video: VideoItem; stats: DeckStats } {
    const now = Date.now();
    if (activeVideoItem && now - lastDrawTime < 250) {
      return {
        video: activeVideoItem,
        stats: this.getStats(),
      };
    }

    return this.drawNextVideo(forceDifferentFromId);
  }

  /**
   * Returns current session stats
   */
  public static getStats(): DeckStats {
    return {
      remainingInDeck: VIDEO_DATABASE.length,
      totalInCatalog: VIDEO_DATABASE.length,
      seenCountInCycle: sessionRecentIds.length,
      cycleNumber: 1,
      sessionRolls: sessionRollCount,
    };
  }

  /**
   * Reset the current session roll history
   */
  public static resetDeck(): DeckStats {
    sessionRecentIds.length = 0;
    sessionRollCount = 1;
    return this.getStats();
  }
}
