// Web Audio API Sound Synthesizer for Visualizers

class AudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Play a tone corresponding to a value within a min..max range
   * @param val current array element value
   * @param min minimum value in array
   * @param max maximum value in array
   * @param duration duration in seconds (e.g. 0.05)
   */
  public playValueTone(val: number, min: number = 10, max: number = 100, duration: number = 0.06) {
    if (this.isMuted) return;

    try {
      this.initContext();
      if (!this.ctx) return;

      // Map value to frequency between 220Hz (A3) and 880Hz (A5)
      const minFreq = 220;
      const maxFreq = 880;
      const normalized = Math.max(0, Math.min(1, (val - min) / (max - min || 1)));
      const freq = minFreq + normalized * (maxFreq - minFreq);

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      // Envelope to avoid clicks
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Audio context error fallback
    }
  }

  /**
   * Play a completion arpeggio / flourish when sorting finishes
   */
  public playCompletionTone() {
    if (this.isMuted) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        try {
          this.initContext();
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
          gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + 0.15);
        } catch {}
      }, idx * 60);
    });
  }
}

export const audioEngine = new AudioEngine();
