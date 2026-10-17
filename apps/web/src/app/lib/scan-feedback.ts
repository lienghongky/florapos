/** Short audio cues for scanning (Web Audio — no asset files). */
let ctx: AudioContext | null = null;

const getCtx = () => {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
};

function tone(freq: number, start: number, duration: number, type: OscillatorType = 'square', volume = 0.08) {
  let c: AudioContext | null;
  try { c = getCtx(); } catch { return; }
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = c.currentTime + start;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(volume, t0 + 0.005);
  gain.gain.setValueAtTime(volume, t0 + duration - 0.02);
  gain.gain.linearRampToValueAtTime(0, t0 + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.01);
}

const SOUND_KEY = 'pos-scanner-sound';
export const isScanSoundEnabled = () => {
  try { return localStorage.getItem(SOUND_KEY) !== 'off'; } catch { return true; }
};
export const setScanSoundEnabled = (on: boolean) => {
  try { localStorage.setItem(SOUND_KEY, on ? 'on' : 'off'); } catch { /* ignore */ }
};

export const scanFeedback = {
  success() {
    if (!isScanSoundEnabled()) return;
    tone(1760, 0, 0.09, 'square', 0.06);
  },
  /** Needs attention (e.g. opening options modal) */
  info() {
    if (!isScanSoundEnabled()) return;
    tone(1320, 0, 0.07, 'sine', 0.1);
    tone(1760, 0.09, 0.07, 'sine', 0.1);
  },
  error() {
    if (!isScanSoundEnabled()) return;
    tone(220, 0, 0.14, 'sawtooth', 0.07);
    tone(180, 0.18, 0.2, 'sawtooth', 0.07);
  },
  vibrate(pattern: number | number[] = 40) {
    try { navigator.vibrate?.(pattern); } catch { /* ignore */ }
  },
};
