// Whisper pequeno e multilíngue roda no próprio navegador. O áudio não sai do aparelho.
const languages = {
  pt: 'portuguese', en: 'english', es: 'spanish', fr: 'french',
  de: 'german', it: 'italian', ja: 'japanese', zh: 'chinese',
  ru: 'russian', ar: 'arabic', hi: 'hindi', ko: 'korean',
  tr: 'turkish', id: 'indonesian', nl: 'dutch', pl: 'polish',
  th: 'thai', vi: 'vietnamese'
};

let transcriber;
let loading;

async function loadModel() {
  if (!loading) {
    loading = (async () => {
      const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.2');
      env.backends.onnx.wasm.numThreads = 1;
      transcriber = await pipeline('automatic-speech-recognition', 'onnx-community/whisper-tiny', {
        device: 'wasm',
        dtype: 'q8',
        progress_callback: (item) => {
          if (item.status === 'progress' && Number.isFinite(item.progress)) {
            self.postMessage({ type: 'progress', progress: Math.round(item.progress) });
          }
        }
      });
      self.postMessage({ type: 'ready' });
    })();
  }
  return loading;
}

self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'load') {
      await loadModel();
    } else if (data.type === 'transcribe') {
      await loadModel();
      const language = languages[String(data.lang || '').split('-')[0]];
      const result = await transcriber(data.audio, {
        task: 'transcribe',
        ...(language ? { language } : {})
      });
      self.postMessage({ type: 'result', text: String(result?.text || '').trim() });
    }
  } catch (error) {
    self.postMessage({ type: 'error', message: error?.message || String(error) });
  }
};
