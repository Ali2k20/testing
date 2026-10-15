"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MAX_SECONDS = 120;

// Chrome/Firefox record Opus in WebM, Safari records AAC in MP4. Whisper takes all of them.
const CANDIDATE_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];

export type RecorderState = "idle" | "recording" | "denied" | "unsupported";

export function useVoiceRecorder(onComplete: (audio: Blob) => void) {
  const [state, setState] = useState<RecorderState>("idle");
  const [seconds, setSeconds] = useState(0);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const discard = useRef(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    recorder.current?.stream.getTracks().forEach((track) => track.stop());
    recorder.current = null;
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const stop = useCallback((send: boolean) => {
    discard.current = !send;
    if (recorder.current?.state === "recording") recorder.current.stop();
  }, []);

  const start = useCallback(async () => {
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setState("unsupported");
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch {
      setState("denied");
      return;
    }

    const mimeType = CANDIDATE_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
    const media = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    chunks.current = [];
    discard.current = false;
    media.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.current.push(event.data);
    };
    media.onstop = () => {
      const blob = new Blob(chunks.current, { type: media.mimeType || mimeType || "audio/webm" });
      cleanup();
      setState("idle");
      setSeconds(0);
      if (!discard.current && blob.size > 0) onComplete(blob);
    };

    recorder.current = media;
    media.start(250);
    setState("recording");
    setSeconds(0);
    timer.current = setInterval(() => {
      setSeconds((value) => {
        if (value + 1 >= MAX_SECONDS) stop(true);
        return value + 1;
      });
    }, 1000);
  }, [cleanup, onComplete, stop]);

  return { state, seconds, start, stop };
}
