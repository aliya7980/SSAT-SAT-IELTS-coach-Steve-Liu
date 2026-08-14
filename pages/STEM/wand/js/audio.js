export class GameAudio {
  constructor() {
    this.context = null;
    this.enabled = true;
  }

  init() {
    if (this.context) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.context = new AudioContext();
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  play(type) {
    if (!this.enabled || !this.context) return;
    const sounds = {
      dot: [[640, 0.05, "sine", 0.035]],
      energy: [[360, 0.09, "triangle", 0.05], [760, 0.16, "sine", 0.04, 0.06]],
      enemyDefeated: [[250, 0.08, "square", 0.04], [820, 0.18, "triangle", 0.05, 0.08]],
      lifeLost: [[180, 0.18, "sawtooth", 0.06], [90, 0.24, "sawtooth", 0.04, 0.12]],
      levelComplete: [[520, 0.1, "triangle", 0.05], [760, 0.12, "triangle", 0.05, 0.1], [1040, 0.18, "sine", 0.045, 0.22]],
      surge: [[120, 0.14, "sawtooth", 0.06], [180, 0.14, "sawtooth", 0.06, 0.16], [120, 0.18, "sawtooth", 0.06, 0.32]],
      star: [[900, 0.1, "sine", 0.04], [1180, 0.13, "triangle", 0.04, 0.1]],
      victory: [[440, 0.16, "triangle", 0.05], [660, 0.16, "triangle", 0.05, 0.14], [990, 0.24, "sine", 0.05, 0.3]]
    };
    for (const sound of sounds[type] || []) this.tone(...sound);
  }

  tone(freq, duration, type = "sine", gain = 0.05, delay = 0) {
    const oscillator = this.context.createOscillator();
    const volume = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, this.context.currentTime + delay);
    volume.gain.setValueAtTime(0.001, this.context.currentTime + delay);
    volume.gain.linearRampToValueAtTime(gain, this.context.currentTime + delay + 0.01);
    volume.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + delay + duration);
    oscillator.connect(volume);
    volume.connect(this.context.destination);
    oscillator.start(this.context.currentTime + delay);
    oscillator.stop(this.context.currentTime + delay + duration + 0.03);
  }
}
