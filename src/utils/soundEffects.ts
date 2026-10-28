// Web Audio API Synthesizer - 100% self-contained, no external asset dependencies

let audioCtx: AudioContext | null = null;
let soundEnabled = false;

// Check localStorage for saved sound preference
try {
  const saved = localStorage.getItem('UNRELIABLE_CRITIC_SOUND');
  if (saved !== null) {
    soundEnabled = saved === 'true';
  }
} catch {
  soundEnabled = false;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
  try {
    localStorage.setItem('UNRELIABLE_CRITIC_SOUND', String(enabled));
  } catch {}

  if (enabled) {
    getAudioContext();
  }
}

// 1. Soft Pop Sound
export function playPop(freq = 420): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const now = ctx.currentTime;

    osc.frequency.setValueAtTime(freq * 0.7, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.04);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.1);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.13);
  } catch {}
}

// 2. Playful Bounce Sound
export function playBounce(): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(330, now + 0.18);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.21);
  } catch {}
}

// 3. Tiny Crisp Click
export function playClick(): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.025);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.035);
  } catch {}
}

// 4. Subtle Stamp Sound
export function playStamp(): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.15);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);

    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = 'square';
    clickOsc.frequency.setValueAtTime(600, now);
    clickGain.gain.setValueAtTime(0.12, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    clickOsc.connect(clickGain);
    clickGain.connect(ctx.destination);

    clickOsc.start(now);
    clickOsc.stop(now + 0.05);
  } catch {}
}

// 5. Comedic Dramatic Stinger
export function playDramatic(): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const freqs = [330, 311, 293];

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      const noteStart = now + idx * 0.07;

      osc.frequency.setValueAtTime(freq, noteStart);

      gain.gain.setValueAtTime(0.12, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteStart);
      osc.stop(noteStart + 0.22);
    });
  } catch {}
}

// 6. Secret Easter Egg Sound (Cosmic mysterious chime)
export function playEasterEgg(): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    // Low sub drone
    const drone = ctx.createOscillator();
    const droneGain = ctx.createGain();
    drone.type = 'sine';
    drone.frequency.setValueAtTime(65.4, now); // C2
    droneGain.gain.setValueAtTime(0.2, now);
    droneGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    drone.connect(droneGain);
    droneGain.connect(ctx.destination);
    drone.start(now);
    drone.stop(now + 1.25);

    // Eerie high glissando
    const chime = ctx.createOscillator();
    const chimeGain = ctx.createGain();
    chime.type = 'triangle';
    chime.frequency.setValueAtTime(523.25, now + 0.1); // C5
    chime.frequency.exponentialRampToValueAtTime(1046.5, now + 0.4); // C6
    chime.frequency.exponentialRampToValueAtTime(784, now + 0.8);
    chimeGain.gain.setValueAtTime(0.001, now);
    chimeGain.gain.linearRampToValueAtTime(0.15, now + 0.15);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
    chime.connect(chimeGain);
    chimeGain.connect(ctx.destination);
    chime.start(now + 0.1);
    chime.stop(now + 1.05);
  } catch {}
}

// 7. Discard / Trash Sound
export function playTrash(): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.14);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  } catch {}
}
