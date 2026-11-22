// Tiny synthesized sounds: WebAudio oscillators, no audio files, no network.
// The context starts on the first user gesture, so the title screen stays silent.

export function createBeeps() {
  let ctx = null;

  function ensure() {
    if (ctx) return ctx;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      ctx = new AudioContext();
    } catch {
      ctx = null;
    }
    return ctx;
  }

  function tone(freq, seconds, type = 'sine', gain = 0.08, when = 0) {
    const ac = ensure();
    if (!ac) return;
    if (ac.state === 'suspended') ac.resume().catch(() => {});
    const t0 = ac.currentTime + when;
    const osc = ac.createOscillator();
    const amp = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    amp.gain.setValueAtTime(gain, t0);
    amp.gain.exponentialRampToValueAtTime(0.001, t0 + seconds);
    osc.connect(amp);
    amp.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + seconds + 0.02);
  }

  return {
    /** Called on the first click or key, so later tones are allowed to play. */
    unlock() {
      ensure();
    },
    pickup(kind) {
      if (kind === 'diamond') {
        tone(880, 0.12, 'sine', 0.09);
        tone(1174, 0.16, 'sine', 0.09, 0.08);
        tone(1568, 0.22, 'sine', 0.08, 0.16);
      } else {
        tone(660, 0.09, 'sine', 0.08);
        tone(990, 0.12, 'sine', 0.07, 0.06);
      }
    },
    denied() {
      tone(140, 0.18, 'square', 0.05);
    },
    tool() {
      tone(520, 0.1, 'triangle', 0.07);
      tone(780, 0.14, 'triangle', 0.06, 0.07);
    },
    crackTick() {
      tone(1200, 0.04, 'square', 0.03);
    },
    alarmTick() {
      tone(220, 0.08, 'square', 0.04);
    },
    room() {
      tone(440, 0.1, 'sine', 0.07);
      tone(587, 0.14, 'sine', 0.07, 0.08);
    },
    win() {
      [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.2, 'sine', 0.08, i * 0.11));
    },
    busted() {
      tone(196, 0.4, 'sawtooth', 0.06);
      tone(147, 0.5, 'sawtooth', 0.05, 0.15);
    },
  };
}
