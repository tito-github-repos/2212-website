// Runs in the audio thread. Turns mic audio into 16 kHz chunks of 20 ms and measures loudness.
// Loaded by lib/useDeepgramVoiceAnswer.ts from /deepgram-worklet.js
class DeepgramChunker extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ratio = sampleRate / 16000;
    this.pos = 0;
    this.out = [];
    this.sumSquares = 0;
    this.count = 0;
  }

  process(inputs) {
    const channel = inputs[0][0];
    if (!channel) return true;

    for (let k = 0; k < channel.length; k++) {
      this.sumSquares += channel[k] * channel[k];
      this.count++;
    }

    // resample to 16 kHz
    while (this.pos < channel.length) {
      const a = Math.floor(this.pos);
      const f = this.pos - a;
      const x = channel[a];
      const y = channel[a + 1] === undefined ? x : channel[a + 1];
      this.out.push(x + (y - x) * f);
      this.pos += this.ratio;
    }
    this.pos -= channel.length;

    // every 20 ms (320 samples) send a chunk to the page
    if (this.out.length >= 320) {
      const pcm = new Int16Array(this.out.length);
      for (let k = 0; k < pcm.length; k++) {
        const v = Math.max(-1, Math.min(1, this.out[k]));
        pcm[k] = v * 32767;
      }
      this.port.postMessage({ pcm, rms: Math.sqrt(this.sumSquares / this.count) }, [pcm.buffer]);
      this.out = [];
      this.sumSquares = 0;
      this.count = 0;
    }

    return true;
  }
}

registerProcessor("p", DeepgramChunker);