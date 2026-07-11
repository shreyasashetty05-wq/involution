"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseSpeechRecognitionReturn {
    isListening: boolean;
    isSupported: boolean;
    error: string | null;
    interimResult: string;
    startListening: () => void;
    stopListening: () => void;
    clearError: () => void;
}

export function useSpeechRecognition(onFinalTranscript: (text: string) => void): UseSpeechRecognitionReturn {
    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [interimResult, setInterimResult] = useState('');
    
    const recognitionRef = useRef<any>(null);
    const onFinalTranscriptRef = useRef(onFinalTranscript);

    useEffect(() => {
        onFinalTranscriptRef.current = onFinalTranscript;
    }, [onFinalTranscript]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        const isSecureContext = window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        
        if (!SpeechRecognition || !isSecureContext) {
            console.log("[Speech Debug] Browser does not support SpeechRecognition or is not in a secure context.");
            setIsSupported(false);
            return;
        }

        console.log("[Speech Debug] Initializing SpeechRecognition instance.");
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => {
            console.log("[Speech Debug] Recognition started successfully (onstart).");
            setIsListening(true);
            setError(null);
            setInterimResult('');
        };
        
        recognition.onaudiostart = () => console.log("[Speech Debug] Audio capturing started (onaudiostart).");
        recognition.onsoundstart = () => console.log("[Speech Debug] Sound detected (onsoundstart).");
        recognition.onspeechstart = () => console.log("[Speech Debug] Speech detected (onspeechstart).");

        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            let currentInterim = '';
            
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    currentInterim += event.results[i][0].transcript;
                }
            }
            
            if (currentInterim) {
                setInterimResult(currentInterim);
            }
            
            if (finalTranscript) {
                onFinalTranscriptRef.current(finalTranscript);
                setInterimResult('');
            }
        };

        recognition.onspeechend = () => console.log("[Speech Debug] Speech stopped (onspeechend).");
        recognition.onsoundend = () => console.log("[Speech Debug] Sound stopped (onsoundend).");
        recognition.onaudioend = () => console.log("[Speech Debug] Audio capturing ended (onaudioend).");

        recognition.onerror = (event: any) => {
            console.log("[Speech Debug] Recognition error fired:", event.error);
            setIsListening(false);
            setInterimResult('');
            
            switch(event.error) {
                case 'no-speech':
                    setError("No speech detected. Please try again.");
                    break;
                case 'not-allowed':
                    setError("Microphone permission denied. Please allow access in your browser settings.");
                    break;
                case 'audio-capture':
                    setError("No microphone was found. Ensure that a microphone is installed and configured.");
                    break;
                case 'service-not-allowed':
                    setError("Speech recognition service is not allowed.");
                    break;
                case 'network':
                    setError("Network error occurred during speech recognition. Check your connection.");
                    break;
                case 'language-not-supported':
                    setError("The language (en-US) is not supported.");
                    break;
                case 'aborted':
                    console.log("[Speech Debug] Recognition aborted by user.");
                    break;
                default:
                    setError(`Recognition failed (${event.error}).`);
            }
        };

        recognition.onend = () => {
            console.log("[Speech Debug] Recognition ended naturally (onend).");
            setIsListening(false);
            setInterimResult('');
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                console.log("[Speech Debug] Unmounting, aborting recognition.");
                recognitionRef.current.abort();
            }
        };
    }, []);

    const startListening = useCallback(async () => {
        if (!recognitionRef.current) {
            console.warn("[Speech Debug] startListening called but no recognition instance exists.");
            return;
        }
        
        try {
            if (navigator.permissions && navigator.permissions.query) {
                const permissionStatus = await navigator.permissions.query({ name: "microphone" as PermissionName });
                if (permissionStatus.state === 'denied') {
                    setError("Microphone permission denied. Please allow access in your browser settings.");
                    return;
                }
            }
        } catch (err) {
            console.log("[Speech Debug] navigator.permissions.query not supported or failed.");
        }
        
        console.log("[Speech Debug] startListening invoked.");
        setError(null);
        setInterimResult('');
        
        try {
            recognitionRef.current.start();
        } catch (e: any) {
            console.error("[Speech Debug] Failed to start recognition:", e);
            if (e.name === 'InvalidStateError') {
                console.warn("[Speech Debug] Recognition is already active.");
            } else {
                setError("Failed to start microphone. Please refresh and try again.");
            }
        }
    }, []);

    const stopListening = useCallback(() => {
        if (!recognitionRef.current) return;
        console.log("[Speech Debug] stopListening invoked.");
        try {
            recognitionRef.current.stop();
        } catch (e) {
            console.error("[Speech Debug] Failed to stop recognition:", e);
        }
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        isListening,
        isSupported,
        error,
        interimResult,
        startListening,
        stopListening,
        clearError
    };
}
