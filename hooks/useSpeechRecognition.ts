'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// types/speech.d.ts provides the SpeechRecognition global typings

export type SpeechStatus = 'idle' | 'requesting' | 'listening' | 'processing' | 'error';

interface UseSpeechRecognitionReturn {
  status: SpeechStatus;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [status, setStatus] = useState<SpeechStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognitionAPI);
  }, []);

  const buildRecognition = useCallback((): SpeechRecognition | null => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return null;

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    // continuous = false so it auto-stops after user pauses
    recognition.continuous = false;

    recognition.onstart = () => {
      setStatus('listening');
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      setInterimTranscript(interim);
      if (final) {
        setTranscript((prev) => (prev ? prev + ' ' + final : final).trim());
        setInterimTranscript('');
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const msg =
        event.error === 'not-allowed'
          ? 'Microphone access denied. Please allow microphone permissions.'
          : event.error === 'no-speech'
          ? 'No speech detected. Please try again.'
          : `Error: ${event.error}`;
      setError(msg);
      setStatus('error');
    };

    recognition.onend = () => {
      setInterimTranscript('');
      setStatus((s) => (s === 'listening' ? 'idle' : s));
    };

    return recognition;
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
    }

    setStatus('requesting');
    setError(null);

    // Request mic permission explicitly first
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(() => {
        const recognition = buildRecognition();
        if (!recognition) {
          setError('Speech recognition is not supported in your browser.');
          setStatus('error');
          return;
        }
        recognitionRef.current = recognition;
        try {
          recognition.start();
        } catch {
          setStatus('error');
          setError('Failed to start speech recognition.');
        }
      })
      .catch(() => {
        setError('Microphone access denied. Please allow microphone permissions in your browser settings.');
        setStatus('error');
      });
  }, [buildRecognition]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    setStatus('idle');
    setInterimTranscript('');
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { /* ignore */ }
      }
    };
  }, []);

  return {
    status,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  };
}
