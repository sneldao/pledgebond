// Procedural audio cues using Web Audio API — no external assets required.
// Provides: pledgeIn, sealLock, release, fail, crack, coinCascade, tick

let ctx = null;
let muted = false;
let gainMaster = null;

function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      gainMaster = ctx.createGain();
      gainMaster.gain.value = 0.7;
      gainMaster.connect(ctx.destination);
    } catch (e) {
      return null;
    }
  }
  return ctx;
}

export function unlockAudio() {
  const c = getCtx();
  if (c && c.state === "suspended") c.resume().catch(() => {});
}

export function setMuted(m) {
  muted = !!m;
  try {
    localStorage.setItem("pledgebond.muted", muted ? "1" : "0");
  } catch {}
}

export function isMuted() {
  try {
    if (localStorage.getItem("pledgebond.muted") === "1") muted = true;
  } catch {}
  return muted;
}

function envGain(c, when, attack = 0.005, decay = 0.15, peak = 0.5) {
  const g = c.createGain();
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(peak, when + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, when + attack + decay);
  return g;
}

function playTone({ freq = 440, type = "sine", when = 0, attack = 0.005, decay = 0.18, peak = 0.35, freqEnd = null } = {}) {
  if (isMuted()) return;
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t0 + attack + decay);
  const g = envGain(c, t0, attack, decay, peak);
  osc.connect(g).connect(gainMaster);
  osc.start(t0);
  osc.stop(t0 + attack + decay + 0.05);
}

function playNoise({ when = 0, duration = 0.1, peak = 0.25, bandpass = null } = {}) {
  if (isMuted()) return;
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + when;
  const bufSize = Math.floor(c.sampleRate * duration);
  const buffer = c.createBuffer(1, bufSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
  const src = c.createBufferSource();
  src.buffer = buffer;
  const g = envGain(c, t0, 0.005, duration, peak);
  let node = src;
  if (bandpass) {
    const filt = c.createBiquadFilter();
    filt.type = "bandpass";
    filt.frequency.value = bandpass;
    filt.Q.value = 1.2;
    src.connect(filt);
    node = filt;
  }
  node.connect(g).connect(gainMaster);
  src.start(t0);
  src.stop(t0 + duration + 0.02);
}

export const sfx = {
  pledgeIn() {
    // Short wax "tap": low thump + tiny click
    playTone({ freq: 260, freqEnd: 130, type: "sine", attack: 0.004, decay: 0.14, peak: 0.36 });
    playNoise({ duration: 0.06, peak: 0.14, bandpass: 1800 });
  },
  sealLock() {
    // Metallic latch + wax thud
    playTone({ freq: 880, freqEnd: 480, type: "triangle", attack: 0.002, decay: 0.09, peak: 0.28 });
    setTimeout(() => {
      playTone({ freq: 160, freqEnd: 60, type: "sine", attack: 0.005, decay: 0.28, peak: 0.5 });
      playNoise({ duration: 0.16, peak: 0.28, bandpass: 320 });
    }, 90);
  },
  crack() {
    // Dry snap
    playNoise({ duration: 0.09, peak: 0.5, bandpass: 3200 });
    playTone({ freq: 1400, freqEnd: 400, type: "square", attack: 0.001, decay: 0.05, peak: 0.15 });
  },
  release() {
    // Triumph sting chord
    const c = getCtx();
    if (!c) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      playTone({ freq: f, type: "triangle", when: i * 0.06, attack: 0.01, decay: 0.7, peak: 0.22 });
    });
    setTimeout(() => this.coinCascade(), 260);
  },
  coinCascade() {
    for (let i = 0; i < 8; i++) {
      const f = 1400 + Math.random() * 1200;
      playTone({ freq: f, type: "sine", when: i * 0.045, attack: 0.002, decay: 0.09, peak: 0.14 });
    }
  },
  fail() {
    playTone({ freq: 220, freqEnd: 110, type: "sine", attack: 0.01, decay: 0.5, peak: 0.28 });
    playTone({ freq: 165, freqEnd: 82, type: "sine", when: 0.15, attack: 0.01, decay: 0.6, peak: 0.22 });
  },
  tick() {
    playTone({ freq: 2000, type: "triangle", attack: 0.001, decay: 0.02, peak: 0.06 });
  },
};
