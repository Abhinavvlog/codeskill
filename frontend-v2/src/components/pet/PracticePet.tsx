"use client";

import { FormEvent, PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUp, ArrowUpRight, Code2, Info, Lightbulb, Loader2, Mic, Minus, MoveDownRight, Square, Volume2, VolumeX, X } from "lucide-react";
import { petAPI } from "@/config/api";
import BytePetCanvas, { PetMood } from "./BytePetCanvas";
import styles from "./PracticePet.module.css";

type PetMessage = {
  role: "assistant" | "user";
  content: string;
  source?: "openrouter" | "deepseek" | "local";
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

type SpeechWorkerMessage =
  | { id: number; type: "loading" | "transcribing" }
  | { id: number; type: "result"; text: string }
  | { id: number; type: "error" };

const PROMPTS = [
  { label: "Understand the input", question: "Help me understand the input with one hint." },
  { label: "Review my code", question: "Give me one specific hint about my current code." },
  { label: "Find my next step", question: "Give me one hint to find my next step." },
];
const POSITION_KEY = "codeskill_byte_position_v3";
const MINIMIZED_KEY = "codeskill_byte_minimized";
const LOCAL_SPEECH_KEY = "codeskill_byte_local_speech";
type Position = { x: number; y: number };

function clampPosition(position: Position): Position {
  const width = 88;
  const height = 100;
  return {
    x: Math.max(8, Math.min(position.x, window.innerWidth - width - 8)),
    y: Math.max(8, Math.min(position.y, window.innerHeight - height - 8)),
  };
}

async function decodeRecordedAudio(blob: Blob): Promise<Float32Array> {
  const context = new AudioContext();
  try {
    const decoded = await context.decodeAudioData(await blob.arrayBuffer());
    const offline = new OfflineAudioContext(1, Math.max(1, Math.ceil(decoded.duration * 16000)), 16000);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start();
    const resampled = await offline.startRendering();
    return resampled.getChannelData(0).slice();
  } finally {
    await context.close();
  }
}

export default function PracticePet({
  problemSlug,
  problemTitle,
  code,
  language,
  workspace = false,
}: {
  problemSlug?: string;
  problemTitle?: string;
  code?: string;
  language?: string;
  workspace?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [hovered, setHovered] = useState(false);
  const [draft, setDraft] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [messages, setMessages] = useState<PetMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [listening, setListening] = useState(false);
  const [recording, setRecording] = useState(false);
  const [microphoneStarting, setMicrophoneStarting] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [notice, setNotice] = useState("");
  const [mood, setMood] = useState<PetMood>("idle");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speechWorkerRef = useRef<Worker | null>(null);
  const speechJobRef = useRef(0);
  const voiceSessionRef = useRef(0);
  const sendQuestionRef = useRef<(question: string, spoken: boolean) => Promise<void>>(async () => {});
  const nativeSpeechUnavailableRef = useRef(false);
  const storedPositionRef = useRef<Position | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const happyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragRef = useRef<{ pointerId: number; x: number; y: number; origin: Position; moved: boolean } | null>(null);
  const suppressClickRef = useRef(false);

  useEffect(() => {
    const compact = localStorage.getItem(MINIMIZED_KEY) === "true";
    let saved: Position | null = null;
    try {
      const parsed = JSON.parse(localStorage.getItem(POSITION_KEY) || "null");
      if (typeof parsed?.x === "number" && typeof parsed?.y === "number" && Number.isFinite(parsed.x) && Number.isFinite(parsed.y)) saved = parsed;
    } catch { /* A stale saved position should not hide the pet. */ }
    storedPositionRef.current = saved;
    const frame = requestAnimationFrame(() => {
      setMinimized(compact);
      setPosition(saved ? clampPosition(saved) : null);
      setViewport({ width: document.documentElement.clientWidth, height: document.documentElement.clientHeight });
    });
    return () => cancelAnimationFrame(frame);
  }, [workspace]);

  useEffect(() => {
    const onResize = () => {
      setViewport({ width: document.documentElement.clientWidth, height: document.documentElement.clientHeight });
      setPosition(previous => previous ? clampPosition(storedPositionRef.current || previous) : previous);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [minimized, workspace]);

  const minimize = () => {
    close();
    setMinimized(true);
    localStorage.setItem(MINIMIZED_KEY, "true");
    setPosition(previous => previous ? clampPosition(previous) : previous);
  };

  const restore = () => {
    setMinimized(false);
    localStorage.setItem(MINIMIZED_KEY, "false");
    setPosition(previous => previous ? clampPosition(previous) : previous);
    setOpen(true);
  };

  const dockToCorner = () => {
    storedPositionRef.current = null;
    setPosition(null);
    localStorage.removeItem(POSITION_KEY);
  };

  const onDragStart = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const origin = position || {
      x: event.currentTarget.getBoundingClientRect().left - (open ? 26 : 0),
      y: event.currentTarget.getBoundingClientRect().top - (open ? 53 : 0),
    };
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, origin, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onDragMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.pointerType === "mouse" && event.buttons !== 1) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 5) return;
    drag.moved = true;
    setPosition(clampPosition({ x: drag.origin.x + dx, y: drag.origin.y + dy }));
  };

  const onDragEnd = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.moved) {
      const next = clampPosition({ x: drag.origin.x + event.clientX - drag.x, y: drag.origin.y + event.clientY - drag.y });
      setPosition(next);
      storedPositionRef.current = next;
      localStorage.setItem(POSITION_KEY, JSON.stringify(next));
      suppressClickRef.current = true;
      window.setTimeout(() => { suppressClickRef.current = false; }, 0);
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    dragRef.current = null;
  };

  useEffect(() => {
    if (messages.length || pending) bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, pending, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => () => {
    voiceSessionRef.current += 1;
    recognitionRef.current?.abort();
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    microphoneStreamRef.current?.getTracks().forEach(track => track.stop());
    speechWorkerRef.current?.terminate();
    if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
    window.speechSynthesis?.cancel();
    if (happyTimerRef.current) clearTimeout(happyTimerRef.current);
  }, []);

  const speak = useCallback((content: string) => {
    if (!("speechSynthesis" in window)) {
      setNotice("Audio replies are not supported in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(content.replace(/[`*#]/g, "").slice(0, 1000));
    utterance.rate = 1.04;
    utterance.pitch = 1.12;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  const sendQuestion = useCallback(async (question: string, spoken = false) => {
    const trimmed = question.trim();
    if (!trimmed || pending) return;
    setOpen(true);
    setDraft("");
    setNotice("");
    setPending(true);
    setMood("thinking");
    setMessages(previous => [...previous, { role: "user", content: trimmed }]);
    try {
      const response = await petAPI.ask({
        question: trimmed,
        problemSlug,
        code: code?.trim() ? code : undefined,
        language: code?.trim() ? language : undefined,
        history: messages.slice(-6).map(({ role, content }) => ({ role, content })),
      });
      const { reply, source, notice: replyNotice } = response.data;
      setMessages(previous => [...previous, { role: "assistant", content: reply, source }]);
      setNotice(replyNotice || "");
      setMood("happy");
      if (happyTimerRef.current) clearTimeout(happyTimerRef.current);
      happyTimerRef.current = setTimeout(() => setMood("idle"), 2600);
      if (spoken || soundOn) speak(reply);
    } catch (error: unknown) {
      const status = error && typeof error === "object" && "response" in error
        ? (error as { response?: { status?: number } }).response?.status
        : undefined;
      const reply = status === 401
        ? "Please sign in to ask me about this problem. Your question will be here when you return."
        : "I couldn’t reach the practice guide right now. Please try again in a moment.";
      setMessages(previous => [...previous, { role: "assistant", content: reply }]);
      setMood("idle");
    } finally {
      setPending(false);
    }
  }, [code, language, messages, pending, problemSlug, soundOn, speak]);

  useEffect(() => {
    sendQuestionRef.current = sendQuestion;
  }, [sendQuestion]);

  const transcribeRecording = async (blob: Blob, session: number) => {
    const id = ++speechJobRef.current;
    setTranscribing(true);
    setNotice("Preparing your recording for on-device transcription…");
    try {
      const audio = await decodeRecordedAudio(blob);
      if (session !== voiceSessionRef.current || id !== speechJobRef.current) return;
      if (audio.length < 8000) {
        setNotice("That recording was too short. Try speaking for a little longer.");
        setTranscribing(false);
        return;
      }
      let energy = 0;
      let samplesChecked = 0;
      for (let index = 0; index < audio.length; index += 32) {
        energy += audio[index] * audio[index];
        samplesChecked += 1;
      }
      if (Math.sqrt(energy / samplesChecked) < 0.0005) {
        setNotice("I didn’t hear speech in that recording. Please try again.");
        setTranscribing(false);
        return;
      }

      let worker = speechWorkerRef.current;
      if (!worker) {
        worker = new Worker(new URL("./speech.worker.ts", import.meta.url), { type: "module" });
        speechWorkerRef.current = worker;
        worker.onmessage = (event: MessageEvent<SpeechWorkerMessage>) => {
          const message = event.data;
          if (message.id !== speechJobRef.current) return;
          if (message.type === "loading") {
            setNotice("Loading the free speech model on this device… first use may take a minute.");
          } else if (message.type === "transcribing") {
            setNotice("Transcribing your question on this device…");
          } else if (message.type === "result") {
            setTranscribing(false);
            if (message.text) void sendQuestionRef.current(message.text, true);
            else setNotice("I couldn’t make out the words. Please try again or type your question.");
          } else {
            setTranscribing(false);
            setNotice("On-device transcription couldn’t start. Check your connection and try again.");
          }
        };
        worker.onerror = () => {
          if (speechWorkerRef.current !== worker) return;
          setTranscribing(false);
          setNotice("On-device transcription couldn’t start. Please try again or type your question.");
          speechWorkerRef.current?.terminate();
          speechWorkerRef.current = null;
        };
      }
      worker.postMessage({ id, audio }, [audio.buffer]);
    } catch {
      if (session !== voiceSessionRef.current || id !== speechJobRef.current) return;
      setTranscribing(false);
      setNotice("I couldn’t process that recording. Please try again or type your question.");
    }
  };

  const startLocalRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setNotice("Microphone recording is unavailable in this browser. You can still type to Byte.");
      return;
    }
    const session = ++voiceSessionRef.current;
    setMicrophoneStarting(true);
    setNotice("Connecting to your microphone…");
    try {
      window.speechSynthesis?.cancel();
      setSpeaking(false);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      if (session !== voiceSessionRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      const recorder = new MediaRecorder(stream);
      microphoneStreamRef.current = stream;
      recorderRef.current = recorder;
      const chunks: Blob[] = [];
      let discard = false;
      recorder.ondataavailable = event => {
        if (event.data.size) chunks.push(event.data);
      };
      recorder.onerror = () => {
        discard = true;
        if (session !== voiceSessionRef.current) return;
        setNotice("The microphone recording stopped unexpectedly. Please try again.");
      };
      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        if (session !== voiceSessionRef.current) return;
        if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
        recordingTimerRef.current = null;
        microphoneStreamRef.current = null;
        recorderRef.current = null;
        setListening(false);
        setRecording(false);
        const audioBlob = new Blob(chunks, { type: recorder.mimeType });
        if (!discard && audioBlob.size) void transcribeRecording(audioBlob, session);
      };
      recorder.start();
      setListening(true);
      setRecording(true);
      setNotice("Recording on this device. Tap the mic again when you finish speaking.");
      recordingTimerRef.current = setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, 15000);
    } catch (error) {
      if (session !== voiceSessionRef.current) return;
      microphoneStreamRef.current?.getTracks().forEach(track => track.stop());
      microphoneStreamRef.current = null;
      recorderRef.current = null;
      setListening(false);
      setRecording(false);
      const name = error instanceof DOMException ? error.name : "";
      setNotice(name === "NotAllowedError"
        ? "Microphone access is blocked. Allow it for this page and try again."
        : name === "NotFoundError"
          ? "No microphone was found. Check your audio input device."
          : "I couldn’t start microphone recording. You can still type to Byte.");
    } finally {
      if (session === voiceSessionRef.current) setMicrophoneStarting(false);
    }
  };

  const toggleMicrophone = () => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
      setNotice("Preparing your recording…");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const speechWindow = window as SpeechWindow;
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition || nativeSpeechUnavailableRef.current || sessionStorage.getItem(LOCAL_SPEECH_KEY) === "true") {
      void startLocalRecording();
      return;
    }
    const session = ++voiceSessionRef.current;
    try {
      window.speechSynthesis?.cancel();
      setSpeaking(false);
      const recognition = new Recognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.continuous = false;
      recognition.onresult = event => {
        if (session !== voiceSessionRef.current) return;
        const transcript = event.results[0]?.[0]?.transcript?.trim();
        if (transcript) {
          setListening(false);
          recognition.stop();
          void sendQuestion(transcript, true);
        }
      };
      recognition.onerror = event => {
        if (session !== voiceSessionRef.current) return;
        if (event.error === "network" || event.error === "service-not-allowed") {
          nativeSpeechUnavailableRef.current = true;
          sessionStorage.setItem(LOCAL_SPEECH_KEY, "true");
          recognitionRef.current = null;
          setListening(false);
          void startLocalRecording();
          return;
        }
        const message = event.error === "not-allowed"
          ? "Microphone or speech permission is blocked in this browser."
          : event.error === "audio-capture"
            ? "No microphone was found. Check your audio input device."
            : event.error === "no-speech"
              ? "I didn’t hear any speech. Try again closer to the microphone."
              : event.error === "network"
                ? "This browser’s speech service is unavailable."
                : `Voice input stopped (${event.error}).`;
        setNotice(message);
        setListening(false);
      };
      recognition.onend = () => {
        if (recognitionRef.current === recognition) {
          recognitionRef.current = null;
          setListening(false);
        }
      };
      recognitionRef.current = recognition;
      recognition.start();
      setListening(true);
      setNotice("Listening… ask your question.");
    } catch {
      nativeSpeechUnavailableRef.current = true;
      sessionStorage.setItem(LOCAL_SPEECH_KEY, "true");
      void startLocalRecording();
    }
  };

  const close = () => {
    voiceSessionRef.current += 1;
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    microphoneStreamRef.current?.getTracks().forEach(track => track.stop());
    microphoneStreamRef.current = null;
    recorderRef.current = null;
    if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
    recordingTimerRef.current = null;
    speechJobRef.current += 1;
    speechWorkerRef.current?.terminate();
    speechWorkerRef.current = null;
    window.speechSynthesis?.cancel();
    setListening(false);
    setRecording(false);
    setMicrophoneStarting(false);
    setTranscribing(false);
    setSpeaking(false);
    setInputFocused(false);
    setOpen(false);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendQuestion(draft);
  };

  const typing = open && inputFocused && draft.length > 0;
  const currentMood: PetMood = listening ? "listening" : speaking ? "talking" : pending || transcribing ? "thinking" : typing ? "typing" : mood === "happy" ? "happy" : open ? "active" : "idle";
  const petWidth = open ? 48 : 88;
  const petHeight = open ? 55 : 100;
  const panelInset = viewport.width >= 420 ? 20 : 12;
  const panelWidth = Math.min(380, Math.max(0, viewport.width - panelInset * 2));
  const panelHeight = Math.min(520, Math.max(180, viewport.height - (workspace ? 140 : 72)));
  const panelLeft = position ? Math.max(12, Math.min(position.x + 88 - panelWidth, viewport.width - panelWidth - 12)) : Math.max(12, viewport.width - panelWidth - panelInset);
  const panelTop = position
    ? Math.max(12, Math.min(position.y + 100 - panelHeight - 24, viewport.height - panelHeight - (workspace ? 84 : 36)))
    : Math.max(12, viewport.height - panelHeight - (workspace ? 116 : 48));
  const petPosition = open && !minimized
    ? { x: panelLeft + panelWidth - 62, y: panelTop + panelHeight - 23 }
    : position;
  const gazeX = petPosition ? Math.max(-1, Math.min(1, (panelLeft + panelWidth / 2 - petPosition.x - petWidth / 2) / 120)) : 0;
  const gazeY = petPosition ? Math.max(-1, Math.min(1, (panelTop + panelHeight - 75 - petPosition.y - petHeight / 2) / 120)) : 0;
  const busy = pending || transcribing || microphoneStarting;
  const status = microphoneStarting ? "Connecting microphone" : listening ? "Listening" : transcribing ? "Transcribing" : pending ? "Thinking" : speaking ? "Speaking" : "One hint at a time";

  return (
    <div className={styles.layer}>
      {open && (
        <section
          aria-label="Ask Byte, the coding companion"
          style={{ ...(position ? { left: panelLeft, top: panelTop } : { right: panelInset, bottom: workspace ? 116 : 48 }), width: panelWidth, height: panelHeight }}
          className={styles.panel}
        >
          <header className={styles.header}>
            <div className={styles.identity}>
              <div className={styles.brandMark} aria-hidden="true"><Code2 size={18} strokeWidth={1.8} /></div>
              <div>
                <h2>Byte</h2>
                <p><span className={`${styles.statusDot} ${listening ? styles.recordingDot : ""}`} />{status}</p>
              </div>
            </div>
            <div className={styles.headerActions}>
              <button
                type="button"
                onClick={() => {
                  setSoundOn(value => !value);
                  if (soundOn) {
                    window.speechSynthesis?.cancel();
                    setSpeaking(false);
                  }
                }}
                aria-label={soundOn ? "Turn off spoken replies" : "Turn on spoken replies"}
                aria-pressed={soundOn}
                title={soundOn ? "Spoken replies on" : "Spoken replies off"}
                className={`${styles.iconButton} ${soundOn ? styles.selectedButton : ""}`}
              >
                {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              {position && <button type="button" onClick={dockToCorner} aria-label="Dock Byte to corner" title="Dock to corner" className={styles.iconButton}><MoveDownRight size={15} /></button>}
              <span className={styles.actionDivider} />
              <button type="button" onClick={minimize} aria-label="Minimize Byte" title="Minimize" className={styles.iconButton}><Minus size={16} /></button>
              <button type="button" onClick={close} aria-label="Close Byte" title="Close" className={styles.iconButton}><X size={16} /></button>
            </div>
          </header>

          <div className={styles.context}>
            <span className={styles.contextLabel}>PRACTICING</span>
            <span className={styles.contextTitle}>{problemTitle || "Coding practice"}</span>
            <details className={styles.contextInfo}>
              <summary aria-label="What Byte can see" title="What Byte can see"><Info size={14} /></summary>
              <p>Byte uses this problem, your editor code, and recent questions to give focused hints. These details are sent to the configured AI provider.</p>
            </details>
          </div>

          <div className={styles.conversation} aria-live="polite" aria-relevant="additions text">
            {messages.length === 0 && (
              <div className={styles.welcome}>
                <div className={styles.welcomeIcon}><Lightbulb size={22} strokeWidth={1.6} /></div>
                <h3>Let’s find your next step.</h3>
                <p>Ask about the input, your approach, or a line of code. Byte will offer one focused hint.</p>
                <div className={styles.suggestions}>
                  {PROMPTS.map(prompt => (
                    <button key={prompt.label} type="button" onClick={() => void sendQuestion(prompt.question)} disabled={busy || listening}>
                      <span>{prompt.label}</span><ArrowUpRight size={14} />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((message, index) => (
              <div key={`${index}-${message.role}`} className={message.role === "user" ? styles.userRow : styles.assistantRow}>
                {message.role === "assistant" && <span className={styles.messageAuthor}>Byte</span>}
                <div className={message.role === "user" ? styles.userMessage : styles.assistantMessage}>{message.content}</div>
              </div>
            ))}
            {pending && <div className={styles.thinking}><Loader2 size={13} className={styles.spinner} />Finding a useful hint…</div>}
            <div ref={bottomRef} />
          </div>

          <div className={styles.composer}>
            {notice && <p className={styles.notice} role="status">{notice}</p>}
            <form onSubmit={onSubmit} className={styles.inputBox}>
              <textarea
                ref={inputRef}
                value={draft}
                rows={2}
                onChange={event => {
                  setDraft(event.target.value);
                  event.currentTarget.style.height = "auto";
                  event.currentTarget.style.height = `${Math.min(event.currentTarget.scrollHeight, 112)}px`;
                }}
                onKeyDown={event => {
                  if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    if (!listening && !busy) void sendQuestion(draft);
                  }
                }}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                maxLength={1200}
                placeholder="Where are you stuck?"
                aria-label="Question for Byte"
              />
              <div className={styles.composerActions}>
                <button type="button" onClick={toggleMicrophone} disabled={busy} aria-label={recording ? "Stop recording and transcribe" : listening ? "Stop listening" : "Ask with your voice"} title={recording ? "Finish recording" : listening ? "Stop listening" : "Use microphone"} className={`${styles.iconButton} ${listening ? styles.activeMic : ""}`}>
                  {transcribing || microphoneStarting ? <Loader2 size={16} className={styles.spinner} /> : recording ? <Square size={12} fill="currentColor" /> : <Mic size={17} />}
                </button>
                <span className={styles.inputHint}>{recording ? "Tap stop when finished" : "Shift + Enter for a new line"}</span>
                <button type="submit" disabled={!draft.trim() || busy || listening} aria-label="Send question" title="Send question" className={styles.sendButton}><ArrowUp size={17} strokeWidth={2.2} /></button>
              </div>
            </form>
            <div className={styles.footerNote}><Lightbulb size={11} /><span>Guidance to help you learn.</span></div>
            {messages.some(message => message.content.startsWith("Please sign in")) && <Link href="/login" className={styles.signIn}>Sign in to ask Byte</Link>}
          </div>
        </section>
      )}

      <div className={styles.petDock} style={position && petPosition ? { left: petPosition.x, top: petPosition.y } : { right: open ? panelInset + 14 : 20, bottom: open ? workspace ? 84 : 16 : workspace ? 74 : 16 }}>
        {!open && (
          <button type="button" onClick={() => minimized ? restore() : setOpen(true)} className={`${styles.askLabel} ${position && position.x < 135 ? styles.labelRight : styles.labelLeft}`}>
            <span className={styles.labelDot} />Ask Byte
          </button>
        )}
        <button
          type="button"
          onClick={event => {
            if (suppressClickRef.current) { suppressClickRef.current = false; event.preventDefault(); return; }
            if (minimized) restore();
            else if (open) close();
            else setOpen(true);
          }}
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          aria-label={minimized ? "Restore Byte, the coding companion" : open ? "Close Byte, the coding companion" : "Ask Byte, the coding companion"}
          aria-expanded={open}
          title={minimized ? "Restore Byte" : "Click to ask · drag to move"}
          className={styles.petButton}
        >
          <BytePetCanvas mood={currentMood} hovered={hovered} active={open} gazeX={gazeX} gazeY={gazeY} />
        </button>
        {!minimized && !open && <button type="button" onClick={minimize} aria-label="Minimize Byte" title="Minimize Byte" className={styles.petMinimize}><Minus size={12} /></button>}
      </div>
    </div>
  );
}
