import type { SoundEvent } from '../game/types';

// Tiny retro sound effects made with the Web Audio API — no audio files needed.
let audio: AudioContext | null = null;
let muted = false;

export const setMuted = (value: boolean) => {
  muted = value;
};

const TONES: Record<SoundEvent, { freq: number; to?: number; dur: number; type: OscillatorType }> = {
  paddle: { freq: 240, dur: 0.06, type: 'square' },
  brick: { freq: 520, dur: 0.05, type: 'square' },
  steel: { freq: 900, dur: 0.04, type: 'triangle' },
  powerup: { freq: 520, to: 1200, dur: 0.18, type: 'sine' },
  lose: { freq: 220, to: 55, dur: 0.45, type: 'sawtooth' },
  win: { freq: 523, to: 1046, dur: 0.4, type: 'triangle' },
  laser: { freq: 1400, to: 600, dur: 0.06, type: 'sawtooth' },
};

export function playSound(event: SoundEvent) {
  if (muted) return;
  try {
    audio ??= new AudioContext();
    const tone = TONES[event];
    const t = audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = tone.type;
    osc.frequency.setValueAtTime(tone.freq, t);
    if (tone.to) osc.frequency.exponentialRampToValueAtTime(tone.to, t + tone.dur);
    gain.gain.setValueAtTime(0.07, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + tone.dur);
    osc.connect(gain).connect(audio.destination);
    osc.start(t);
    osc.stop(t + tone.dur);
  } catch {
    // audio unavailable — play silently
  }
}
