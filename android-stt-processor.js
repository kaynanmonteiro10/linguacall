// Reusa a faixa de áudio da chamada, sem pedir outra captura do microfone.
class AndroidSttProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.inputPosition = 0;
    this.nextOutputPosition = 0;
    this.output = new Float32Array(2048);
    this.outputLength = 0;
  }

  process(inputs) {
    const input = inputs[0]?.[0];
    if (!input) return true;
    const step = sampleRate / 16000;
    for (let i = 0; i < input.length; i++) {
      const position = this.inputPosition + i;
      if (position < this.nextOutputPosition) continue;
      this.output[this.outputLength++] = input[i];
      this.nextOutputPosition += step;
      if (this.outputLength === this.output.length) {
        this.port.postMessage(this.output, [this.output.buffer]);
        this.output = new Float32Array(2048);
        this.outputLength = 0;
      }
    }
    this.inputPosition += input.length;
    return true;
  }
}

registerProcessor('android-stt-processor', AndroidSttProcessor);
