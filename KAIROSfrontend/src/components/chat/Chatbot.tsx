import React, { useState, useRef, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { 
  X, Send, Bot, User, Loader2, Mic, MicOff,
  Volume2, VolumeX, Pause, Play, RefreshCw, AlertCircle, Globe, ChevronDown
} from 'lucide-react'
import { chatAPI } from '@/services/api'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant'
import { getLanguageConfig, SUPPORTED_LANGUAGES } from '@/utils/languages'
import clsx from 'clsx'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
  language?: string
}

const renderTextWithLinks = (text: string) => {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  const parts = []
  let lastIndex = 0
  let match
  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index))
    }
    parts.push(
      <Link 
        key={match.index} 
        to={match[2]} 
        className="text-primary dark:text-primary-300 underline font-bold hover:text-primary-900 dark:hover:text-white transition-colors"
      >
        {match[1]}
      </Link>
    )
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }

  return parts.map((p, pIdx) => {
    if (typeof p === 'string') {
      const boldParts = p.split(/(\*\*[^*]+\*\*)/g)
      return (
        <span key={pIdx}>
          {boldParts.map((bp, bIdx) => {
            if (bp.startsWith('**') && bp.endsWith('**')) {
              return <strong key={bIdx} className="font-bold text-slate-900 dark:text-white">{bp.slice(2, -2)}</strong>
            }
            return bp
          })}
        </span>
      )
    }
    return p
  })
}

export function Chatbot() {
  const { t, i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const currentLangCode = i18n.language || 'en'
  const langConfig = getLanguageConfig(currentLangCode)

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [autoVoice, setAutoVoice] = useState(true)
  const [showLangMenu, setShowLangMenu] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize Welcome Message according to Language
  useEffect(() => {
    const welcomeMap: Record<string, string> = {
      en: "Hello! I am the **KAIROS AI Assistant**. Tap the 🎙️ mic to speak or type your question about crops, live ESP32 sensors, forecasts, or recommendations.",
      ta: "வணக்கம்! நான் **KAIROS AI விவசாய உதவியாளர்**. பேச 🎙️ மைக்கை தொடவும் அல்லது பயிர், நேரலை ESP32 சென்சார், முன்னறிவிப்பு மற்றும் பரிந்துரைகள் பற்றி கேட்கவும்.",
      mr: "नमस्कार! मी **KAIROS AI कृषी सहाय्यक** आहे. बोलण्यासाठी 🎙️ माइक टॅप करा किंवा पीक, थेट ESP32 हवामान, अंदाज आणि शिफारसीबद्दल विचारा.",
      hi: "नमस्ते! मैं **KAIROS AI कृषि सहायक** हूँ। बोलने के लिए 🎙️ माइक दबाएं या फसल, लाइव ESP32 मौसम, पूर्वानुमान एवं सिफारिशों के बारे में पूछें।"
    }
    
    setMessages([
      {
        id: 'init',
        text: welcomeMap[currentLangCode] || welcomeMap.en,
        sender: 'bot',
        timestamp: new Date(),
        language: currentLangCode
      }
    ])
  }, [currentLangCode])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen, isTyping])

  // Core Text Sending Function
  const handleSendText = useCallback(async (textToSend: string, fromVoice: boolean = false) => {
    if (!textToSend.trim() || isTyping) return

    stopSpeech()
    const userText = textToSend.trim()
    setInput('')

    // Add user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      text: userText,
      sender: 'user',
      timestamp: new Date(),
      language: currentLangCode
    }
    setMessages(prev => [...prev, userMsg])
    setIsTyping(true)

    try {
      // Build conversation history turns
      const historyContext = messages.slice(-4).map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        content: m.text
      }))

      // Fetch grounded AI response from KAIROS backend
      const responseText = await chatAPI.sendMessage(
        userText, 
        currentLangCode, 
        1, 
        historyContext
      )
      
      const botMsgId = `bot-${Date.now()}`
      const botMsg: Message = {
        id: botMsgId,
        text: responseText,
        sender: 'bot',
        timestamp: new Date(),
        language: currentLangCode
      }
      setMessages(prev => [...prev, botMsg])

      // Auto-speak response if auto voice is enabled or if question was asked by voice
      if (autoVoice || fromVoice) {
        setTimeout(() => {
          speak(responseText, botMsgId)
        }, 200)
      }

    } catch (error: any) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        text: error.message || t("Sorry, I am having trouble connecting right now. Please try again later."),
        sender: 'bot',
        timestamp: new Date(),
        language: currentLangCode
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsTyping(false)
    }
  }, [currentLangCode, isTyping, messages, autoVoice, t])

  // Voice Assistant Hook Handler (Invoked when Speech Audio is Transcribed)
  const handleFinalSpeech = useCallback((transcribedText: string) => {
    if (transcribedText.trim()) {
      setInput(transcribedText.trim())
      handleSendText(transcribedText.trim(), true)
    }
  }, [handleSendText])

  const {
    voiceState,
    transcript,
    audioLevel,
    error: voiceError,
    speakingMsgId,
    isPaused,
    startListening,
    stopListening,
    speak,
    pauseSpeech,
    resumeSpeech,
    stopSpeech
  } = useVoiceAssistant({
    languageCode: currentLangCode,
    onSpeechResult: handleFinalSpeech
  })

  // Synchronize live recognized speech into the input field in real time
  useEffect(() => {
    if (voiceState === 'listening' && transcript) {
      setInput(transcript)
    }
  }, [transcript, voiceState])

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    handleSendText(input)
  }

  // Toggle Push-to-Talk Microphone
  const toggleMic = () => {
    if (voiceState === 'listening') {
      stopListening()
    } else {
      startListening()
    }
  }

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code)
    localStorage.setItem('kairos_language', code)
    setShowLangMenu(false)
  }

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {!isOpen && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(true)}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-900 text-white shadow-premium hover:shadow-xl transition-all duration-300 group"
            >
              <Bot className="h-7 w-7 group-hover:scale-110 transition-transform" />
              {/* Subtle Pulsing Ring */}
              <span className="absolute top-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-400 ring-2 ring-white animate-pulse" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Chat Window */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-0 right-0 w-[360px] sm:w-[430px] h-[590px] max-h-[85vh] flex flex-col rounded-3xl bg-white dark:bg-dark-surface shadow-2xl overflow-hidden border border-slate-200/80 dark:border-white/10"
            >
              {/* Header */}
              <div className="flex items-center justify-between bg-gradient-to-r from-primary to-primary-900 px-4 py-3 text-white">
                <div className="flex items-center space-x-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-inner">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <h3 className="text-sm font-black tracking-tight">{t("KAIROS AI Assistant")}</h3>
                      <span className="text-[9px] font-bold bg-white/20 px-1.5 py-0.2 rounded-full uppercase tracking-wider">Voice + Chat</span>
                    </div>
                    <p className="text-[10px] text-green-100 font-medium">{t("Knowledge-driven Agronomy")}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5">
                  {/* Language Selector Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowLangMenu(!showLangMenu)}
                      className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-bold text-white transition-colors"
                      title="Switch Language"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      <span>{langConfig.nativeName.split(' ')[0]}</span>
                      <ChevronDown className="h-3 w-3 opacity-70" />
                    </button>

                    {showLangMenu && (
                      <div className="absolute right-0 mt-1.5 w-32 rounded-xl bg-white dark:bg-dark-surface p-1 shadow-2xl border border-slate-200 dark:border-white/10 z-50 animate-fade-in text-slate-800 dark:text-slate-200">
                        {SUPPORTED_LANGUAGES.filter(l => l.isPrimary).map(l => (
                          <button
                            key={l.code}
                            onClick={() => handleLanguageChange(l.code)}
                            className={clsx(
                              "w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors",
                              currentLangCode === l.code ? "bg-primary/10 text-primary font-bold" : "hover:bg-slate-100 dark:hover:bg-white/5"
                            )}
                          >
                            <span>{l.nativeName}</span>
                            {currentLangCode === l.code && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Auto Audio Toggle */}
                  <button
                    type="button"
                    onClick={() => setAutoVoice(!autoVoice)}
                    className={clsx(
                      "p-1.5 rounded-lg text-xs font-bold transition-colors",
                      autoVoice ? "bg-white/20 text-white" : "text-white/60 hover:text-white"
                    )}
                    title={autoVoice ? t("Auto Voice ON") : t("Auto Voice OFF")}
                  >
                    {autoVoice ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </button>

                  {/* Close Button */}
                  <button 
                    onClick={() => { setIsOpen(false); stopSpeech(); }}
                    className="rounded-full p-1.5 hover:bg-white/20 transition-colors text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-dark-elevated p-4 space-y-3.5">
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex max-w-[85%] items-end space-x-2 ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm ${msg.sender === 'user' ? 'bg-primary text-white' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'}`}>
                        {msg.sender === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                      </div>

                      <div 
                        className={`rounded-2xl px-4 py-2.5 text-xs font-medium shadow-sm ${
                          msg.sender === 'user' 
                            ? 'bg-primary text-white rounded-br-none' 
                            : 'bg-white dark:bg-dark-surface text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-white/10 rounded-bl-none'
                        }`}
                      >
                        <div className="leading-relaxed whitespace-pre-wrap">
                          {renderTextWithLinks(msg.text)}
                        </div>

                        {/* Text-to-Speech Controls for Bot Messages */}
                        {msg.sender === 'bot' && (
                          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px]">
                            {speakingMsgId === msg.id ? (
                              <div className="flex items-center space-x-2">
                                {isPaused ? (
                                  <button onClick={resumeSpeech} className="text-primary font-bold hover:underline flex items-center">
                                    <Play className="h-3 w-3 mr-0.5" /> {t("Resume")}
                                  </button>
                                ) : (
                                  <button onClick={pauseSpeech} className="text-amber-500 font-bold hover:underline flex items-center">
                                    <Pause className="h-3 w-3 mr-0.5" /> {t("Pause")}
                                  </button>
                                )}
                                <button onClick={stopSpeech} className="text-rose-500 font-bold hover:underline flex items-center ml-1">
                                  <VolumeX className="h-3 w-3 mr-0.5" /> {t("Stop")}
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => speak(msg.text, msg.id)}
                                className="text-primary dark:text-primary-300 font-bold hover:underline flex items-center"
                              >
                                <Volume2 className="h-3 w-3 mr-1" /> {t("Listen")}
                              </button>
                            )}

                            {speakingMsgId === msg.id && !isPaused && (
                              <span className="flex items-center space-x-0.5">
                                <span className="h-1.5 w-1 bg-primary rounded-full animate-bounce" />
                                <span className="h-2 w-1 bg-primary rounded-full animate-bounce [animation-delay:0.1s]" />
                                <span className="h-1.5 w-1 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Typing / Processing Indicator */}
                {(isTyping || voiceState === 'processing') && (
                  <div className="flex justify-start">
                    <div className="flex max-w-[80%] items-end space-x-2">
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                      <div className="rounded-2xl rounded-bl-none bg-white dark:bg-dark-surface px-4 py-2.5 shadow-sm border border-slate-100 dark:border-white/10 flex items-center space-x-2 text-xs font-semibold text-slate-400">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
                        <span>{voiceState === 'processing' ? t("Transcribing speech with AI...") : t("Analyzing KAIROS data...")}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recording Active Status Banner with Live Waveform */}
                {voiceState === 'listening' && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs font-bold text-rose-600 dark:text-rose-400 shadow-sm flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="h-3 w-3 rounded-full bg-rose-600 animate-ping" />
                      <span>
                        {currentLangCode === 'ta' 
                          ? "🔴 குரல் பதிவு செய்யப்படுகிறது... பேசி முடித்ததும் மைக்கை தொடவும்" 
                          : currentLangCode === 'mr' 
                          ? "🔴 आवाज रेकॉर्ड करत आहे... बोलणे संपल्यावर मायक्रोफोन टॅप करा" 
                          : currentLangCode === 'hi' 
                          ? "🔴 आवाज रिकॉर्ड हो रही है... बोलने के बाद माइक दबाएं" 
                          : "🔴 Recording audio... Tap mic when finished"}
                      </span>
                    </div>

                    {/* Animated Live Audio Wave Bars */}
                    <div className="flex items-center space-x-1 h-5 px-1">
                      {[0.4, 0.8, 1.2, 0.6, 1.0].map((multiplier, idx) => {
                        const h = Math.max(4, Math.min(20, Math.round((audioLevel || 0.3) * 20 * multiplier)))
                        return (
                          <div
                            key={idx}
                            style={{ height: `${h}px` }}
                            className="w-1 bg-rose-600 rounded-full transition-all duration-75"
                          />
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Voice Error Notification */}
                {voiceError && (
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] font-semibold text-amber-700 dark:text-amber-300 flex items-center justify-between shadow-sm">
                    <div className="flex items-center space-x-1.5">
                      <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
                      <span>{voiceError}</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Suggested Quick Question Chips */}
              <div className="px-3 py-2 bg-slate-100/70 dark:bg-white/5 border-t border-slate-200/50 dark:border-white/5 overflow-x-auto flex space-x-1.5 no-scrollbar">
                {langConfig.suggestedQuestions.slice(0, 4).map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendText(q)}
                    className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-white dark:bg-dark-surface border border-slate-200 dark:border-white/10 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:border-primary hover:text-primary transition-all shadow-sm"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Input Area with Integrated Microphone Button */}
              <div className="bg-white dark:bg-dark-surface p-3 border-t border-slate-100 dark:border-white/5">
                <form 
                  onSubmit={handleSend}
                  className="flex items-center space-x-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-2 py-1.5 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all shadow-inner"
                >
                  {/* Push-To-Talk Microphone Button */}
                  <button
                    type="button"
                    onClick={toggleMic}
                    className={clsx(
                      "h-8 w-8 rounded-xl flex items-center justify-center transition-all shadow-sm",
                      voiceState === 'listening' 
                        ? "bg-rose-600 text-white animate-pulse shadow-rose-500/40 ring-2 ring-rose-400" 
                        : voiceState === 'processing'
                        ? "bg-amber-500 text-white animate-spin"
                        : "bg-white dark:bg-dark-surface border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-primary hover:border-primary"
                    )}
                    title={voiceState === 'listening' ? t("Stop recording") : `${t("Tap to speak")} (${langConfig.nativeName})`}
                  >
                    {voiceState === 'listening' ? (
                      <MicOff className="h-4 w-4 text-white" />
                    ) : voiceState === 'processing' ? (
                      <RefreshCw className="h-4 w-4 text-white animate-spin" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </button>

                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      voiceState === 'listening' 
                        ? (currentLangCode === 'ta' ? "🔴 பேசவும்... முடித்ததும் மைக்கை தொடவும்" : currentLangCode === 'mr' ? "🔴 बोलणे झाल्यावर माइक टॅप करा..." : currentLangCode === 'hi' ? "🔴 बोलने के बाद माइक दबाएं..." : "🔴 Speak now, then tap mic to finish...")
                        : voiceState === 'processing'
                        ? (currentLangCode === 'ta' ? "⚡ குரல் உரை மாற்றப்படுகிறது..." : "⚡ Transcribing speech with AI...")
                        : (currentLangCode === 'ta' ? "விவசாய கேள்விகளைக் கேட்கவும்..." : currentLangCode === 'mr' ? "कृषी प्रश्न विचारा किंवा बोला..." : currentLangCode === 'hi' ? "कृषि प्रश्न पूछें या बोलें..." : t("Ask about KAIROS features..."))
                    }
                    className="flex-1 bg-transparent px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none"
                    disabled={isTyping || voiceState === 'processing'}
                  />

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={!input.trim() || isTyping || voiceState === 'processing'}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary hover:bg-primary-600 text-white disabled:opacity-40 transition-colors shadow-sm"
                  >
                    {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
