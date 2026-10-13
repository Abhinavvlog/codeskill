import { env, pipeline } from "@huggingface/transformers";

type TranscribeRequest = { id: number; audio: Float32Array };
type TranscribeResponse =
  | { id: number; type: "loading" | "transcribing" }
  | { id: number; type: "result"; text: string }
  | { id: number; type: "error"; reason: string };

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<TranscribeRequest>) => void) | null;
  postMessage: (message: TranscribeResponse) => void;
};

env.allowLocalModels = false;
if (env.backends.onnx.wasm) env.backends.onnx.wasm.numThreads = 1;

const createTranscriber = () => pipeline(
  "automatic-speech-recognition",
  "Xenova/whisper-tiny.en",
  { device: "wasm", dtype: "q8" },
);
let transcriberPromise: ReturnType<typeof createTranscriber> | null = null;

scope.onmessage = event => {
  const { id, audio } = event.data;
  void (async () => {
    try {
      scope.postMessage({ id, type: "loading" });
      transcriberPromise ||= createTranscriber();
      const transcriber = await transcriberPromise;
      scope.postMessage({ id, type: "transcribing" });
      const result = await transcriber(audio);
      const text = (Array.isArray(result) ? result.map(item => item.text).join(" ") : result.text).trim();
      scope.postMessage({ id, type: "result", text });
    } catch (error) {
      console.error("Byte speech transcription failed:", error);
      transcriberPromise = null;
      scope.postMessage({ id, type: "error", reason: error instanceof Error ? error.message : "Unknown transcription error" });
    }
  })();
};
