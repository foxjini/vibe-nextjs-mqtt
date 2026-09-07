'use client';

import { VoiceTone } from '@/types/mqtt';

export interface TTSOptions {
  pitch?: number;
  rate?: number;
  volume?: number;
  tone?: VoiceTone;
  voiceURI?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: unknown) => void;
}

interface QueuedUtterance {
  text: string;
  options: TTSOptions;
  resolve: () => void;
  reject: (err: unknown) => void;
}

class TTSEngine {
  private synth: SpeechSynthesis | null = null;
  private koreanVoices: SpeechSynthesisVoice[] = [];
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private isUnlocked: boolean = false;
  private queue: QueuedUtterance[] = [];
  private isProcessingQueue: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private listeners: Set<(speaking: boolean, text: string) => void> = new Set();
  private voiceListeners: Set<(voices: SpeechSynthesisVoice[]) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.initVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private initVoices() {
    if (!this.synth) return;
    const allVoices = this.synth.getVoices();
    // Filter Korean voices
    const koVoices = allVoices.filter(v => v.lang.toLowerCase().startsWith('ko') || v.lang.includes('KR'));
    this.koreanVoices = koVoices;

    // Explicitly prioritize "Google 한국어" in Chrome
    const googleVoice = allVoices.find(v => v.name === 'Google 한국어') 
      || allVoices.find(v => v.name.includes('Google') && v.lang.startsWith('ko'))
      || koVoices[0] 
      || allVoices.find(v => v.lang.startsWith('ko')) 
      || null;

    if (googleVoice) {
      this.selectedVoice = googleVoice;
    }

    this.voiceListeners.forEach(listener => listener(this.koreanVoices));
  }

  public getKoreanVoices(): SpeechSynthesisVoice[] {
    return this.koreanVoices;
  }

  public getSelectedVoice(): SpeechSynthesisVoice | null {
    return this.selectedVoice;
  }

  public setSelectedVoice(voiceURI: string) {
    const voice = this.koreanVoices.find(v => v.voiceURI === voiceURI);
    if (voice) {
      this.selectedVoice = voice;
    }
  }

  public subscribeSpeakingState(fn: (speaking: boolean, text: string) => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  public subscribeVoices(fn: (voices: SpeechSynthesisVoice[]) => void) {
    this.voiceListeners.add(fn);
    if (this.koreanVoices.length > 0) {
      fn(this.koreanVoices);
    }
    return () => {
      this.voiceListeners.delete(fn);
    };
  }

  private notifySpeaking(speaking: boolean, text: string = '') {
    this.listeners.forEach(fn => fn(speaking, text));
  }

  /**
   * Unlock Web Audio & SpeechSynthesis context for Chrome
   */
  public async unlockAudio(): Promise<boolean> {
    if (!this.synth) return false;
    try {
      this.synth.cancel();
      const testUtterance = new SpeechSynthesisUtterance('');
      testUtterance.volume = 0;
      this.initVoices();
      testUtterance.rate = 2;
      this.synth.speak(testUtterance);
      this.isUnlocked = true;
      return true;
    } catch {
      return false;
    }
  }

  public isAudioUnlocked(): boolean {
    return this.isUnlocked;
  }

  /**
   * Speak text with Korean bright/cheerful tone settings
   */
  public speak(text: string, options: TTSOptions = {}): Promise<void> {
    if (!this.synth) {
      return Promise.reject(new Error('SpeechSynthesis not supported in this browser'));
    }

    return new Promise((resolve, reject) => {
      this.queue.push({ text, options, resolve, reject });
      this.processQueue();
    });
  }

  private processQueue() {
    if (this.isProcessingQueue || this.queue.length === 0 || !this.synth) return;

    this.isProcessingQueue = true;
    const item = this.queue.shift()!;
    const { text, options, resolve, reject } = item;

    // Pitch & Rate default 1.0 (자연스러운 기본값)
    const pitch = options.pitch ?? 1.0;
    const rate = options.rate ?? 1.0;
    const volume = options.volume ?? 1.0;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.pitch = pitch;
    utterance.rate = rate;
    utterance.volume = volume;

    // Ensure "Google 한국어" is active
    if (!this.selectedVoice && this.synth) {
      const allVoices = this.synth.getVoices();
      const gVoice = allVoices.find(v => v.name === 'Google 한국어') 
        || allVoices.find(v => v.name.includes('Google') && v.lang.startsWith('ko'))
        || allVoices.find(v => v.lang.startsWith('ko'));
      if (gVoice) {
        this.selectedVoice = gVoice;
      }
    }

    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    } else if (this.koreanVoices.length > 0) {
      utterance.voice = this.koreanVoices[0];
    }

    this.currentUtterance = utterance;

    utterance.onstart = () => {
      this.notifySpeaking(true, text);
      options.onStart?.();
    };

    const cleanup = () => {
      this.currentUtterance = null;
      this.notifySpeaking(false, '');
      this.isProcessingQueue = false;
      setTimeout(() => this.processQueue(), 50);
    };

    utterance.onend = () => {
      options.onEnd?.();
      cleanup();
      resolve();
    };

    utterance.onerror = (e) => {
      // If canceled due to user interruption, treat gracefully
      if (e.error === 'interrupted' || e.error === 'canceled') {
        cleanup();
        resolve();
      } else {
        options.onError?.(e);
        cleanup();
        reject(e);
      }
    };

    // Chrome bug prevention: speech synthesis can freeze if idle too long
    if (this.synth.paused) {
      this.synth.resume();
    }

    this.synth.speak(utterance);
  }

  public stop() {
    this.queue = [];
    if (this.synth) {
      this.synth.cancel();
    }
    this.currentUtterance = null;
    this.notifySpeaking(false, '');
    this.isProcessingQueue = false;
  }
}

// Export singleton instance
export const ttsEngine = typeof window !== 'undefined' ? new TTSEngine() : ({} as TTSEngine);
