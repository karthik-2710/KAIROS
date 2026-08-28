import { useState, useEffect, useRef, useCallback } from 'react'
import { getLanguageConfig } from '@/utils/languages'
import { chatAPI } from '@/services/api'

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error'

interface UseVoiceAssistantProps {
  languageCode?: string
  onSpeechResult?: (finalText: string) => void
}

export function useVoiceAssistant({ languageCode = 'en', onSpeechResult }: UseVoiceAssistantProps = {}) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)

  const isSpeechRecSupported = typeof window !== 'undefined' && (
    'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  )
  const isMediaRecorderSupported = typeof window !== 'undefined' && (
    navigator?.mediaDevices && 'getUserMedia' in navigator.mediaDevices
  )
  const isSupported = isSpeechRecSupported || isMediaRecorderSupported

  const recognitionRef = useRef<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number | null>(null)

  const isListeningRef = useRef(false)
  const onSpeechResultRef = useRef(onSpeechResult)
  const accumulatedRef = useRef('')
  const silenceTimerRef = useRef<any>(null)
  const ttsTimerRef = useRef<any>(null)
  const usingFallbackAsrRef = useRef(false)

  useEffect(() => {
    onSpeechResultRef.current = onSpeechResult
  }, [onSpeechResult])

  const langConfig = getLanguageConfig(languageCode)

  // Pre-load voices into browser cache on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        try {
          window.speechSynthesis.getVoices()
        } catch {}
      }
      loadVoices()
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
  }, [])

  // Audio level meter for visual waveform feedback
  const startAudioMeter = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      const audioCtx = new AudioCtx()
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)

      audioContextRef.current = audioCtx
      analyserRef.current = analyser

      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      const checkLevel = () => {
        if (!isListeningRef.current) return
        analyser.getByteFrequencyData(dataArray)
        let sum = 0
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i]
        }
        const avg = sum / dataArray.length
        const norm = Math.min(1, avg / 45)
        setAudioLevel(norm)
        animFrameRef.current = requestAnimationFrame(checkLevel)
      }

      checkLevel()
    } catch (e) {
      console.debug('[VoiceAssistant] Audio meter not initialized:', e)
    }
  }

  const stopAudioMeter = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close()
      } catch {}
      audioContextRef.current = null
    }
    setAudioLevel(0)
  }

  // Cleanup timers & streams on unmount
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      if (ttsTimerRef.current) clearInterval(ttsTimerRef.current)
      stopAudioMeter()
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop())
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {}
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  // Helper to commit recognized speech text
  const commitSpeechResult = useCallback((textToCommit: string) => {
    const clean = textToCommit.trim()
    if (!clean) return

    setTranscript(clean)
    setInterimTranscript('')
    accumulatedRef.current = ''
    setVoiceState('idle')

    if (onSpeechResultRef.current) {
      onSpeechResultRef.current(clean)
    }
  }, [])

  // Start MediaRecorder Fallback (used when Web Speech is unsupported or throws network error)
  const startMediaRecorderFallback = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Audio recording is not supported in this browser.")
      setVoiceState('error')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      mediaStreamRef.current = stream
      startAudioMeter(stream)
      usingFallbackAsrRef.current = true

      audioChunksRef.current = []
      const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']
      const supportedMime = mimeTypes.find(m => MediaRecorder.isTypeSupported(m)) || ''
      const recorder = new MediaRecorder(stream, supportedMime ? { mimeType: supportedMime } : undefined)

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      recorder.start(100)
      mediaRecorderRef.current = recorder
      setVoiceState('listening')
      setError(null)
    } catch (err: any) {
      console.warn('[VoiceAssistant] MediaRecorder mic access error:', err)
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError("Microphone permission was denied. Please allow microphone access in your browser.")
      } else {
        setError("Could not access microphone: " + (err.message || 'Unknown error'))
      }
      setVoiceState('error')
      isListeningRef.current = false
    }
  }, [])

  // Start Voice Recognition (Web Speech API with Fallback)
  const startListening = useCallback(async () => {
    // 1. Cancel any active Text-to-Speech
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel()
      setSpeakingMsgId(null)
      setIsPaused(false)
    }

    setError(null)
    setTranscript('')
    setInterimTranscript('')
    accumulatedRef.current = ''
    usingFallbackAsrRef.current = false
    isListeningRef.current = true

    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)

    // 2. Primary Engine: Browser Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (SpeechRecognition) {
      try {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.abort()
          } catch {}
        }

        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = langConfig.speechRecLocale || 'en-US'
        recognition.maxAlternatives = 1

        recognition.onstart = () => {
          setVoiceState('listening')
          setError(null)
        }

        recognition.onresult = (event: any) => {
          let fullFinal = ''
          let currentInterim = ''

          for (let i = 0; i < event.results.length; i++) {
            const res = event.results[i]
            const text = res[0]?.transcript || ''
            if (res.isFinal) {
              fullFinal += text + ' '
            } else {
              currentInterim += text
            }
          }

          const combined = (fullFinal + currentInterim).trim()
          if (combined) {
            accumulatedRef.current = combined
            setTranscript(combined)
            setInterimTranscript(currentInterim)
            setAudioLevel(0.6 + Math.random() * 0.4) // Dynamic visual response to speech

            // Reset silence auto-submit timer (auto-submits 2.0 seconds after user stops speaking)
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
            silenceTimerRef.current = setTimeout(() => {
              if (isListeningRef.current && accumulatedRef.current.trim()) {
                stopListening()
              }
            }, 2000)
          }
        }

        recognition.onerror = (e: any) => {
          console.warn('[WebSpeech] Recognition error:', e.error)
          if (e.error === 'not-allowed' || e.error === 'permission-denied') {
            isListeningRef.current = false
            setError("Microphone permission was denied. Please allow microphone access in your browser.")
            setVoiceState('error')
          } else if (e.error === 'network') {
            console.info('[WebSpeech] Network error, switching to Gemini Multimodal ASR fallback...')
            if (isListeningRef.current) {
              startMediaRecorderFallback()
            }
          } else if (e.error === 'no-speech') {
            // Natural silence, keep waiting
          } else {
            console.debug('[WebSpeech] Non-fatal error:', e.error)
          }
        }

        recognition.onend = () => {
          if (isListeningRef.current && !usingFallbackAsrRef.current) {
            // Auto restart if still in listening state
            try {
              recognition.start()
            } catch {
              // Ignore if already running or closed
            }
          }
        }

        recognition.start()
        recognitionRef.current = recognition
        setVoiceState('listening')
        return

      } catch (err: any) {
        console.warn('[WebSpeech] Start failed, falling back to MediaRecorder:', err)
        startMediaRecorderFallback()
      }
    } else {
      // Browser does not support WebSpeech (e.g. Firefox desktop), use MediaRecorder + Gemini
      startMediaRecorderFallback()
    }
  }, [langConfig.speechRecLocale, startMediaRecorderFallback])

  // Stop Listening and Send Query
  const stopListening = useCallback(async () => {
    if (!isListeningRef.current) return
    isListeningRef.current = false

    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    stopAudioMeter()

    // 1. Stop Web Speech Recognition if active
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {}
    }

    const liveSpoken = accumulatedRef.current.trim()

    // 2. If Web Speech produced transcript, commit immediately
    if (liveSpoken) {
      commitSpeechResult(liveSpoken)
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop())
        mediaStreamRef.current = null
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop()
        } catch {}
      }
      return
    }

    // 3. If using MediaRecorder fallback (or Web Speech returned empty), transcribe via Gemini ASR
    const recorder = mediaRecorderRef.current
    const stream = mediaStreamRef.current

    if (stream) {
      stream.getTracks().forEach(t => t.stop())
      mediaStreamRef.current = null
    }

    if (recorder && recorder.state !== 'inactive') {
      setVoiceState('processing')

      recorder.onstop = async () => {
        try {
          const mimeType = recorder.mimeType || 'audio/webm'
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
          audioChunksRef.current = []

          if (audioBlob.size > 200) {
            const serverTranscript = await chatAPI.transcribeAudio(audioBlob, languageCode)
            if (serverTranscript && serverTranscript.trim()) {
              commitSpeechResult(serverTranscript.trim())
              return
            }
          }
          setVoiceState('idle')
        } catch (err: any) {
          console.warn('[VoiceAssistant] Gemini ASR fallback error:', err)
          setVoiceState('idle')
          if (!accumulatedRef.current) {
            setError(err.message || "Could not recognize audio. Please try speaking again.")
          }
        }
      }

      try {
        recorder.stop()
      } catch {
        setVoiceState('idle')
      }
    } else {
      setVoiceState('idle')
    }
  }, [commitSpeechResult, languageCode])

  // Text-To-Speech (TTS) with Multi-language accent selection and Chrome keepalive
  const speak = useCallback((text: string, msgId: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setError('Text-to-speech is not supported in this browser.')
      return
    }

    // Strip markdown links, formatting, bullets for smooth pronunciation
    const cleanText = text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*_~`#>]/g, '')
      .replace(/---+/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/₹/g, 'Rupees ')
      .trim()

    if (!cleanText) return

    window.speechSynthesis.cancel()
    if (ttsTimerRef.current) clearInterval(ttsTimerRef.current)

    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.lang = langConfig.speechSynthLocale || 'en-US'
    utterance.rate = 0.95 // Slightly natural pace for agricultural advisory
    utterance.pitch = 1.0

    // Voice Selection Priority
    const voices = window.speechSynthesis.getVoices()
    const targetLocale = (langConfig.speechSynthLocale || 'en-US').toLowerCase()
    const langCode = (langConfig.code || 'en').toLowerCase()

    // 1. Natural / Google / Premium voice match
    let selectedVoice = voices.find(v => 
      (v.lang.toLowerCase().includes(targetLocale) || v.lang.toLowerCase().startsWith(langCode)) &&
      (v.name.toLowerCase().includes('natural') || 
       v.name.toLowerCase().includes('google') || 
       v.name.toLowerCase().includes('samantha') || 
       v.name.toLowerCase().includes('zira') || 
       v.name.toLowerCase().includes('david') || 
       v.name.toLowerCase().includes('india') ||
       v.name.toLowerCase().includes('indian'))
    )

    // 2. Exact or prefix locale match
    if (!selectedVoice) {
      selectedVoice = voices.find(v => 
        v.lang.toLowerCase() === targetLocale || 
        v.lang.toLowerCase().startsWith(langCode) ||
        (langCode === 'en' && v.lang.toLowerCase().includes('en'))
      )
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice
    }

    utterance.onstart = () => {
      setVoiceState('speaking')
      setSpeakingMsgId(msgId)
      setIsPaused(false)

      // Chrome keepalive tick (prevents speech cutoff on longer responses)
      ttsTimerRef.current = setInterval(() => {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          window.speechSynthesis.pause()
          window.speechSynthesis.resume()
        }
      }, 9000)
    }

    utterance.onend = () => {
      if (ttsTimerRef.current) clearInterval(ttsTimerRef.current)
      setVoiceState('idle')
      setSpeakingMsgId(null)
      setIsPaused(false)
    }

    utterance.onerror = (e) => {
      if (ttsTimerRef.current) clearInterval(ttsTimerRef.current)
      console.warn('[SpeechSynthesis] Playback error:', e)
      setVoiceState('idle')
      setSpeakingMsgId(null)
      setIsPaused(false)
    }

    window.speechSynthesis.speak(utterance)
  }, [langConfig])

  const pauseSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause()
      setIsPaused(true)
    }
  }, [])

  const resumeSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume()
      setIsPaused(false)
    }
  }, [])

  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      if (ttsTimerRef.current) clearInterval(ttsTimerRef.current)
      setVoiceState('idle')
      setSpeakingMsgId(null)
      setIsPaused(false)
    }
  }, [])

  return {
    voiceState,
    setVoiceState,
    transcript,
    interimTranscript,
    audioLevel,
    error,
    setError,
    isSupported,
    speakingMsgId,
    isPaused,
    startListening,
    stopListening,
    speak,
    pauseSpeech,
    resumeSpeech,
    stopSpeech
  }
}
