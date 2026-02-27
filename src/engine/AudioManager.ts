export class AudioManager {
  private ctx: AudioContext;
  private buffers = new Map<string, AudioBuffer>();
  private masterGain: GainNode;
  private music: { node: AudioBufferSourceNode; gain: GainNode } | null = null;

  constructor() {
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
  }

  // --- loading ---

  async load(key: string, url: string): Promise<void> {
    const res = await fetch(url);
    const raw = await res.arrayBuffer();
    const buffer = await this.ctx.decodeAudioData(raw);
    this.buffers.set(key, buffer);
  }

  async loadAll(entries: Record<string, string>): Promise<void> {
    await Promise.all(Object.entries(entries).map(([key, url]) => this.load(key, url)));
  }

  // --- playback ---

  /** One-shot sound effect */
  play(key: string, volume = 1): void {
    const buffer = this.getBuffer(key);
    const gain = this.ctx.createGain();
    gain.gain.value = volume;
    gain.connect(this.masterGain);

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(gain);
    source.start();
  }

  /** Looping background music — stops any currently playing track */
  playMusic(key: string, volume = 0.5): void {
    this.stopMusic();
    const buffer = this.getBuffer(key);

    const gain = this.ctx.createGain();
    gain.gain.value = volume;
    gain.connect(this.masterGain);

    const node = this.ctx.createBufferSource();
    node.buffer = buffer;
    node.loop = true;
    node.connect(gain);
    node.start();

    this.music = { node, gain };
  }

  stopMusic(): void {
    this.music?.node.stop();
    this.music = null;
  }

  set musicVolume(v: number) {
    if (this.music) this.music.gain.gain.value = v;
  }

  // --- procedural tone (no file needed) ---

  tone(freq: number, duration: number, volume = 0.3, type: OscillatorType = "square"): void {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  // --- master volume ---

  set masterVolume(v: number) {
    this.masterGain.gain.value = Math.max(0, Math.min(1, v));
  }

  get masterVolume(): number {
    return this.masterGain.gain.value;
  }

  /** Browsers block audio until a user gesture — call this on first input */
  resume(): Promise<void> {
    return this.ctx.resume();
  }

  private getBuffer(key: string): AudioBuffer {
    const buf = this.buffers.get(key);
    if (!buf) throw new Error(`Audio not found: "${key}"`);
    return buf;
  }
}
