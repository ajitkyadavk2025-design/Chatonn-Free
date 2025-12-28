
export enum AppMode {
  CHAT = 'chat',
  SEARCH = 'search',
  IMAGE = 'image',
  VIDEO = 'video',
  LIVE = 'live'
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  thinking?: string;
  type: 'text' | 'image' | 'video' | 'search-results';
  metadata?: any;
  timestamp: number;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface VideoConfig {
  aspectRatio: '16:9' | '9:16';
  resolution: '720p' | '1080p';
}

export interface ImageConfig {
  aspectRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
}

// Global interface for window.aistudio
export interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

declare global {
  interface Window {
    // Fix: Removed duplicate 'aistudio' property declaration.
    // The property 'aistudio' is already defined by the global environment.
    // Re-declaring it here, even with the same interface name, can cause type collisions
    // if the definitions are not identically referenced from the same module scope.
    webkitAudioContext: typeof AudioContext;
  }
}
