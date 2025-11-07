'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Status = 'idle' | 'listening' | 'processing';
type Options = {
  silenceMs?: number;
  threshold?: number;
  transcribeUrl?: string;
  minAudioDuration?: number;
  shouldTranscribe?: (audioBlob: Blob, duration: number) => boolean;
};

export function useTranscriber(options: Options = {}) {
  const {
    silenceMs = 700,
    threshold = 0.05,
    transcribeUrl = '/api/transcribe',
    minAudioDuration = 500,
    shouldTranscribe = (blob, duration) => {
      return duration >= minAudioDuration && blob.size > 25000;
    },
  } = options;

  const [isListening, setIsListening] = useState(false);

  const [status, setStatus] = useState<Status>('idle');
  const [transcript, setTranscript] = useState('');
  const [reply, setReply] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const silenceStartedAtRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const recordingStartedAtRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isListeningRef = useRef(false);

  const cleanupAudio = useCallback(() => {
    try {
      mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    } catch {}
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    } catch {}
    try {
      audioCtxRef.current?.close();
    } catch {}
    mediaRecorderRef.current = null;
    audioCtxRef.current = null;
    analyserRef.current = null;
    sourceRef.current = null;
    streamRef.current = null;
    recordingStartedAtRef.current = null;
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => cleanupAudio();
  }, [cleanupAudio]);

  const handleStop = useCallback(async () => {
    setStatus('processing');
    try {
      const blob = new Blob(chunksRef.current, {
        type: mediaRecorderRef.current?.mimeType || 'audio/webm',
      });
      const duration = recordingStartedAtRef.current
        ? performance.now() - recordingStartedAtRef.current
        : 0;

      chunksRef.current = [];
      recordingStartedAtRef.current = null;

      if (shouldTranscribe(blob, duration)) {
        const fd = new FormData();
        fd.append(
          'audio',
          blob,
          `clip.${blob.type.includes('mp4') ? 'mp4' : 'webm'}`,
        );

        const tRes = await fetch(transcribeUrl, { method: 'POST', body: fd });
        if (!tRes.ok) throw new Error(`Transcription failed (${tRes.status})`);
        const tJson = await tRes.json();
        const text: string = (tJson?.text || '').trim();

        setTranscript(text);
      }

      // If still listening, restart recording immediately
      if (isListeningRef.current && streamRef.current) {
        // Start new recording immediately
        const mr = new MediaRecorder(streamRef.current, {
          mimeType: mediaRecorderRef.current?.mimeType || 'audio/webm',
        });
        mediaRecorderRef.current = mr;
        chunksRef.current = [];
        recordingStartedAtRef.current = performance.now();
        silenceStartedAtRef.current = null;

        mr.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
        };
        mr.onstop = handleStop;
        mr.start(250);
      }
    } catch (e: any) {
      setError(e?.message || 'Something went wrong');
      console.error(e);
    } finally {
      setStatus('listening');
    }
  }, [transcribeUrl, shouldTranscribe]);

  const checkSilence = useCallback(() => {
    if (!isListeningRef.current) return;
    const analyser = analyserRef.current;
    if (!analyser) return;

    // Check if audio context is suspended
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    const data = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(data);

    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
    const rms = Math.sqrt(sum / data.length);

    const now = performance.now();
    const recordingDuration = recordingStartedAtRef.current
      ? now - recordingStartedAtRef.current
      : 0;

    if (rms < threshold) {
      if (silenceStartedAtRef.current == null) {
        silenceStartedAtRef.current = now;
      } else {
        const silenceDuration = now - silenceStartedAtRef.current;
        if (silenceDuration >= silenceMs) {
          if (recordingDuration >= minAudioDuration) {
            try {
              mediaRecorderRef.current?.stop();
            } catch {}
          }
        }
      }
    } else {
      silenceStartedAtRef.current = null;
    }

    if (isListeningRef.current) {
      rafRef.current = requestAnimationFrame(checkSilence);
    }
  }, [silenceMs, threshold, minAudioDuration]);

  const start = useCallback(async () => {
    setTranscript('');
    setReply('');
    setError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('getUserMedia is not supported in this browser');
      return;
    }

    try {
      setStatus('listening');
      setIsListening(true);
      isListeningRef.current = true;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      streamRef.current = stream;
      const ctx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;
      source.connect(analyser);

      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : 'audio/webm';

      const mr = new MediaRecorder(stream, { mimeType: mime });
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = handleStop;
      mr.start(500);

      recordingStartedAtRef.current = performance.now();

      rafRef.current = requestAnimationFrame(checkSilence);
    } catch (e: any) {
      setError(e?.message || 'Mic access failed');
      console.error(e);
      setIsListening(false);
      isListeningRef.current = false;
      setStatus('idle');
      cleanupAudio();
    }
  }, [checkSilence, cleanupAudio, handleStop]);

  const stop = useCallback(() => {
    setIsListening(false);
    isListeningRef.current = false;
    try {
      mediaRecorderRef.current?.stop();
    } catch {}
    cleanupAudio();
  }, [cleanupAudio]);

  return {
    isListening,
    status,
    transcript,
    reply,
    error,
    start,
    stop,
    setThreshold: (v: number) => (options.threshold = v),
    setSilenceMs: (v: number) => (options.silenceMs = v),
  };
}
