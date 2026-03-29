/**
 * AudioWorklet Processors for real-time mic capture and audio playback.
 * Loaded at runtime via audioContext.audioWorklet.addModule().
 * Ported from transmit/public/assets/js/audio-worklet-processor.js.
 */

class MicProcessor extends AudioWorkletProcessor {
  process(inputs) {
    var input = inputs[0];
    if (!input || !input[0] || input[0].length === 0) return true;
    var samples = input[0];
    var pcm16 = new Int16Array(samples.length);
    for (var i = 0; i < samples.length; i++) {
      var s = samples[i] * 32768;
      pcm16[i] = s > 32767 ? 32767 : s < -32768 ? -32768 : s | 0;
    }
    this.port.postMessage({ pcm16: pcm16.buffer }, [pcm16.buffer]);
    return true;
  }
}

class PlaybackProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffers = [];
    this.currentBuffer = null;
    this.currentOffset = 0;
    this.wasPlaying = false;
    this.port.onmessage = function (e) {
      if (e.data.cmd === "clear") {
        this.buffers = [];
        this.currentBuffer = null;
        this.currentOffset = 0;
        return;
      }
      if (e.data.samples) {
        this.buffers.push(new Float32Array(e.data.samples));
      }
    }.bind(this);
  }

  process(inputs, outputs) {
    var output = outputs[0];
    if (!output || !output[0]) return true;
    var out = output[0];
    var written = 0;
    while (written < out.length) {
      if (!this.currentBuffer) {
        if (this.buffers.length === 0) {
          if (this.wasPlaying) {
            this.wasPlaying = false;
            this.port.postMessage({ cmd: "drained" });
          }
          for (var i = written; i < out.length; i++) out[i] = 0;
          return true;
        }
        this.currentBuffer = this.buffers.shift();
        this.currentOffset = 0;
      }
      var remaining = this.currentBuffer.length - this.currentOffset;
      var needed = out.length - written;
      var toCopy = remaining < needed ? remaining : needed;
      this.wasPlaying = true;
      for (var j = 0; j < toCopy; j++) {
        out[written + j] = this.currentBuffer[this.currentOffset + j];
      }
      written += toCopy;
      this.currentOffset += toCopy;
      if (this.currentOffset >= this.currentBuffer.length) {
        this.currentBuffer = null;
        this.currentOffset = 0;
      }
    }
    return true;
  }
}

registerProcessor("mic-processor", MicProcessor);
registerProcessor("playback-processor", PlaybackProcessor);
