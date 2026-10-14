"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ViolationHandler = (type: string, details: string) => void;

export function useAssessmentMedia(sessionId: string, enabled: boolean, onViolation: ViolationHandler) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const violationRef = useRef(onViolation);
  useEffect(() => { violationRef.current = onViolation; }, [onViolation]);
  const sessionRef = useRef({
    id: sessionId,
    ended: false,
    stream: null as MediaStream | null,
    audioContext: null as AudioContext | null,
    analyser: null as AnalyserNode | null,
    audioFrame: null as number | null,
    cooldown: 0,
  });
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const attachVideo = useCallback((video: HTMLVideoElement | null) => {
    videoRef.current = video;
    const stream = sessionRef.current.stream;
    if (!video || !stream || sessionRef.current.ended) return;

    video.srcObject = stream;
    void video.play().catch(() => {});
  }, []);

  const releaseMedia = useCallback(() => {
    const session = sessionRef.current;
    if (session.audioFrame !== null) cancelAnimationFrame(session.audioFrame);
    session.audioFrame = null;
    session.analyser?.disconnect();
    session.analyser = null;
    session.stream?.getTracks().forEach(track => track.stop());
    session.stream = null;
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.srcObject = null;
    }
    const audio = session.audioContext;
    session.audioContext = null;
    if (audio && audio.state !== "closed") void audio.close().catch(() => {});
  }, []);

  const stopCamera = useCallback(() => {
    sessionRef.current.ended = true;
    releaseMedia();
    setCameraActive(false);
    setMicActive(false);
    setAudioLevel(0);
  }, [releaseMedia]);

  useEffect(() => {
    if (sessionRef.current.id !== sessionId) sessionRef.current = {
      id: sessionId, ended: false, stream: null, audioContext: null, analyser: null, audioFrame: null, cooldown: 0,
    };
    const session = sessionRef.current;
    if (!enabled || session.ended) return;
    let cancelled = false;
    const setup = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setCameraError("Camera/Mic not supported by this browser.");
          violationRef.current("media_unsupported", "Browser does not support getUserMedia proctoring");
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: "user" },
          audio: true,
        });
        // A permission prompt may settle after submission, navigation or a StrictMode cleanup.
        if (cancelled || session.ended) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        session.stream = stream;
        setCameraActive(true);
        setMicActive(true);
        setCameraError(null);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play().catch(() => {});
        }
        const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const context = new AudioCtx();
          session.audioContext = context;
          const analyser = context.createAnalyser();
          analyser.fftSize = 512;
          analyser.smoothingTimeConstant = 0.4;
          session.analyser = analyser;
          context.createMediaStreamSource(stream).connect(analyser);
          const data = new Uint8Array(analyser.frequencyBinCount);
          const detectAudio = () => {
            if (cancelled || session.ended || !session.analyser) return;
            analyser.getByteFrequencyData(data);
            const average = data.reduce((sum, value) => sum + value, 0) / data.length;
            const normalized = Math.min(100, Math.round((average / 128) * 100));
            setAudioLevel(normalized);
            const now = Date.now();
            if (normalized > 42 && now > session.cooldown) {
              session.cooldown = now + 7000;
              violationRef.current("voice_detected", "Voice or elevated noise detected by microphone proctor");
            }
            session.audioFrame = requestAnimationFrame(detectAudio);
          };
          detectAudio();
        }
      } catch {
        if (cancelled || session.ended) return;
        releaseMedia();
        setCameraActive(false);
        setMicActive(false);
        setCameraError("Camera & Microphone access is required for proctoring verification.");
        violationRef.current("media_permission_denied", "Candidate denied or has no camera/microphone access");
      }
    };
    void setup();
    const onPageHide = () => stopCamera();
    window.addEventListener("pagehide", onPageHide);
    return () => {
      cancelled = true;
      window.removeEventListener("pagehide", onPageHide);
      releaseMedia();
    };
  }, [enabled, sessionId, releaseMedia, stopCamera]);

  useEffect(() => {
    const session = sessionRef.current;
    if (!session.ended && cameraActive && videoRef.current && session.stream) {
      videoRef.current.srcObject = session.stream;
    }
  }, [cameraActive, sessionId]);

  return { videoRef, attachVideo, cameraActive: enabled && cameraActive, micActive: enabled && micActive, audioLevel: enabled ? audioLevel : 0, cameraError, stopCamera };
}
