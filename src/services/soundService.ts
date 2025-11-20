export const soundService = {
  ctx: null as AudioContext | null,

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Ensure context is running (browsers pause it until user interaction)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(e => console.error("Audio resume failed", e));
    }
  },

  playNote(count: number) {
    if (!this.ctx) this.init();
    if (!this.ctx) return;

    // Calculate volume: 10% per finger (0.1 per count)
    // Cap at 1.0 (100%) to prevent clipping/distortion
    let volume = count * 0.1;
    if (volume > 1.0) volume = 1.0;
    if (volume < 0.1 && count > 0) volume = 0.1; 

    const ctx = this.ctx;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // C Major Scale Frequencies
    const frequencies = [
      261.63, // 1: C4
      293.66, // 2: D4
      329.63, // 3: E4
      349.23, // 4: F4
      392.00, // 5: G4
      440.00, // 6: A4
      493.88, // 7: B4
      523.25, // 8: C5
      587.33, // 9: D5
      659.25, // 10: E5
      698.46, // 11: F5
      783.99, // 12: G5
      880.00, // 13: A5
      987.77, // 14: B5
      1046.50, // 15: C6
      1174.66, // 16: D6
      1318.51, // 17: E6
      1396.91, // 18: F6
      1567.98, // 19: G6
      1760.00  // 20: A6
    ];

    // Map count to index safely
    const index = Math.max(0, Math.min(count - 1, frequencies.length - 1));
    const freq = frequencies[index];

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    // Envelope with dynamic volume
    gain.gain.setValueAtTime(0, t);
    // Attack to target volume
    gain.gain.linearRampToValueAtTime(volume, t + 0.03);
    // Decay
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.start(t);
    osc.stop(t + 0.4);
  },

  playSuccess() {
    // Default fallback
    this.playNote(8);
  }
};