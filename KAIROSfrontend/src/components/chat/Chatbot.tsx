import React, { useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react'
import { chatAPI } from '@/services/api'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

const renderTextWithLinks = (text: string) => {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push(
      <Link key={match.index} to={match[2]} className="text-primary dark:text-primary-300 underline font-semibold hover:text-primary-900 dark:text-primary-200 transition-colors">
        {match[1]}
      </Link>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  return parts.length > 0 ? parts : text;
}

export function Chatbot() {
  const { t, i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      text: 'Hello! I am the KAIROS Assistant. How can I help you with your farming features today?',
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen])

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || isTyping) return

    const userText = input.trim()
    setInput('')

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      text: userText,
      sender: 'user',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMsg])
    setIsTyping(true)

    try {
      // Fetch AI response
      const responseText = await chatAPI.sendMessage(userText, i18n.language)
      
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botMsg])
    } catch (error: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: error.message || 'Sorry, I am having trouble connecting right now. Please try again later.',
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsTyping(false)
    }
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
              className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-900 text-white shadow-lg shadow-green-900/20 hover:shadow-xl transition-all duration-300"
            >
              <MessageSquare className="h-6 w-6" />
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
              className="absolute bottom-0 right-0 w-[350px] sm:w-[400px] h-[500px] max-h-[80vh] flex flex-col rounded-2xl bg-white dark:bg-dark-surface shadow-2xl overflow-hidden border border-slate-100"
            >
              {/* Header */}
              <div className="flex items-center justify-between bg-gradient-to-r from-primary to-primary-900 px-4 py-3 text-white">
                <div className="flex items-center space-x-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-dark-surface/20 backdrop-blur-sm">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{t('KAIROS AI')}</h3>
                    <p className="text-xs text-green-100">{t('Always here to help')}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-1.5 hover:bg-white dark:bg-dark-surface/20 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-white/5 dark:bg-white dark:bg-dark-surface/5 p-4 space-y-4">
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex max-w-[80%] items-end space-x-2 ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${msg.sender === 'user' ? 'bg-slate-200' : 'bg-green-100 text-green-700'}`}>
                        {msg.sender === 'user' ? <User className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400 dark:text-slate-400" /> : <Bot className="h-3.5 w-3.5" />}
                      </div>
                      <div 
                        className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                          msg.sender === 'user' 
                            ? 'bg-primary dark:bg-primary-600 text-white rounded-br-sm' 
                            : 'bg-white dark:bg-dark-surface text-slate-700 dark:text-slate-300 dark:text-slate-300 border border-slate-100 rounded-bl-sm'
                        }`}
                      >
                        {msg.sender === 'bot' ? renderTextWithLinks(t(msg.text)) : msg.text}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex max-w-[80%] items-end space-x-2">
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                      <div className="rounded-2xl rounded-bl-sm bg-white dark:bg-dark-surface px-4 py-3 shadow-sm border border-slate-100">
                        <div className="flex space-x-1">
                          <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: '0ms' }}></div>
                          <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: '150ms' }}></div>
                          <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="bg-white dark:bg-dark-surface p-3 border-t border-slate-100">
                <form 
                  onSubmit={handleSend}
                  className="flex items-center space-x-2 rounded-full border border-slate-200 bg-slate-50 dark:bg-white/5 dark:bg-white dark:bg-dark-surface/5 px-2 py-1.5 focus-within:border-green-500 focus-within:ring-1 focus-within:ring-green-500 transition-all"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={t("Ask about KAIROS features...")}
                    className="flex-1 bg-transparent px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 dark:text-slate-300 placeholder-slate-400 focus:outline-none"
                    disabled={isTyping}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isTyping}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-primary dark:bg-primary-600 text-white disabled:opacity-50 hover:bg-[#1B5E20] transition-colors"
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
