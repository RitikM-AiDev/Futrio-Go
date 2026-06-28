import { useState, useRef, useEffect } from 'react'
import './App.css'

declare global {
  interface Window {
    require: (module: string) => any
  }
}

const isElectron = typeof window !== 'undefined' && typeof window.require === 'function'
const electron = isElectron ? window.require('electron') : null
const ipcRenderer = electron?.ipcRenderer ?? null
const shell = electron?.shell ?? null


const API_ENDPOINT = 'http://localhost:8000/api/query/user'

interface Message {
  id: number
  role: 'user' | 'assistant'
  text: string
  isError?: boolean
}

const CHIPS = [
  '🔍 Search the web',
  '🎵 Play music',
  '📰 Latest news',
  '🌤️ Weather today',
  '💡 Tell me a joke',
  '📅 Set a reminder',
]

const GREETINGS = [
  "Hi, how can I help?",
  "Good to see you!",
  "What's on your mind?",
  "Ask me anything.",
]

function FGLogo() {
  return (
    <div className="fg-logo">
      <span>FG</span>
    </div>
  )
}

let msgId = 0

export default function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [greeting] = useState(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)])
  const [showSettings, setShowSettings] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [tavilyKey, setTavilyKey] = useState('')
  const [serperKey, setSerperKey] = useState('')
  const [hasKey, setHasKey] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => { scrollToBottom() }, [messages, loading])

  // Check if all keys exist on load
  useEffect(() => {
    ipcRenderer?.invoke('has-all-keys').then((v: boolean) => setHasKey(v ?? false))
  }, [])

  const saveKey = async () => {
    if (!apiKey.trim() || !tavilyKey.trim() || !serperKey.trim()) return
    await ipcRenderer?.invoke('save-api-key', apiKey.trim())
    await ipcRenderer?.invoke('save-tavily-key', tavilyKey.trim())
    await ipcRenderer?.invoke('save-serper-key', serperKey.trim())
    setHasKey(true)
    setShowSettings(false)
    setApiKey('')
    setTavilyKey('')
    setSerperKey('')
  }

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return

    const userMsg: Message = { id: ++msgId, role: 'user', text: text.trim() }
    setMessages(prev => [...prev, userMsg])
    setQuery('')
    setLoading(true)

    try {
      // Get all 3 decrypted keys from main process
      const [key, tavilyK, serperK] = await Promise.all([
        ipcRenderer?.invoke('get-api-key'),
        ipcRenderer?.invoke('get-tavily-key'),
        ipcRenderer?.invoke('get-serper-key'),
      ])

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key':    key    ?? '',
          'X-Tavily-Key': tavilyK ?? '',
          'X-Serper-Key': serperK ?? '',
        },
        body: JSON.stringify({ query: text.trim().toLowerCase() }),
      })

      if (!response.ok) throw new Error(`Server error: ${response.status}`)

      const data = await response.json()
      if (data.url != "None") {
        shell?.openExternal(data.url)
      }
      const replyText = data.reply || "Completed the task you assigned to me boss"
      setMessages(prev => [...prev, { id: ++msgId, role: 'assistant', text: replyText }])
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: ++msgId,
        role: 'assistant',
        text: `⚠️ ${err.message ?? 'Could not connect to server.'}`,
        isError: true
      }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(query)
    }
  }

  const handleChip = (chip: string) => {
    const text = chip.replace(/^[\p{Emoji}\s]+/u, '').trim()
    sendMessage(text)
  }

  const handleMic = () => {
    setListening(l => !l)
    if (!listening) {
      setTimeout(() => setListening(false), 3000)
    }
  }

  const handleMinimize = () => {
    ipcRenderer?.send('minimize-window')
  }

  const handleClose = () => {
    window.close()
  }

  const showGreeting = messages.length === 0

  return (
    <div className="assistant-card">

      {/* Setup screen - blocks app if no keys */}
      {!hasKey && !showSettings && (
        <div className="settings-overlay">
          <div className="settings-box">
            <FGLogo />
            <h3>Setup Required</h3>
            <p>Enter your API keys to get started</p>
            <input
              type="password"
              placeholder="Gemini API Key (AIza...)"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
            />
            <input
              type="password"
              placeholder="Tavily API Key"
              value={tavilyKey}
              onChange={e => setTavilyKey(e.target.value)}
            />
            <input
              type="password"
              placeholder="Serper API Key"
              value={serperKey}
              onChange={e => setSerperKey(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveKey()}
            />
            <button onClick={saveKey}>Save &amp; Continue</button>
          </div>
        </div>
      )}

      {/* Settings screen */}
      {showSettings && (
        <div className="settings-overlay">
          <div className="settings-box">
            <h3>Update API Keys</h3>
            <input
              type="password"
              placeholder="Gemini API Key (AIza...)"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
            />
            <input
              type="password"
              placeholder="Tavily API Key"
              value={tavilyKey}
              onChange={e => setTavilyKey(e.target.value)}
            />
            <input
              type="password"
              placeholder="Serper API Key"
              value={serperKey}
              onChange={e => setSerperKey(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveKey()}
            />
            <div className="settings-buttons">
              <button onClick={saveKey}>Save</button>
              <button onClick={() => setShowSettings(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Drag Handle */}
      <div className="drag-handle">
        <div className="drag-handle-bar" />
      </div>

      {/* Header */}
      <div className="header">
        <div className="header-logo">
          <FGLogo />
          <span className="header-title">Futrio Go</span>
        </div>
        <div className="header-actions">
          {/* Settings gear button */}
          <button className="icon-btn" title="Settings" onClick={() => setShowSettings(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
            </svg>
          </button>
          <button className="icon-btn" title="Minimize" onClick={handleMinimize}>
            <svg width="14" height="2" viewBox="0 0 14 2" fill="currentColor">
              <rect width="14" height="2" rx="1" />
            </svg>
          </button>
          <button className="icon-btn close-btn" title="Close" onClick={handleClose}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="header-divider" />

      {/* Main Content */}
      {showGreeting ? (
        <div className="greeting-area">
          <div className="google-orb">
            <div className="orb-ring" />
            <div className="orb-inner" />
          </div>
          <div className="greeting-text">{greeting}</div>
          <div className="greeting-sub">Powered by Futrio · AI Assistant</div>
        </div>
      ) : (
        <div className="chat-log">
          {messages.map(msg => (
            <div key={msg.id} className={`message ${msg.role}`}>
              <div className="msg-avatar">
                {msg.role === 'assistant' ? '' : 'U'}
              </div>
              <div className={`msg-bubble ${msg.isError ? 'error-bubble' : ''}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="message assistant">
              <div className="msg-avatar"></div>
              <div className="msg-bubble">
                <div className="typing-dots">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      )}

      {/* Suggestion Chips */}
      {showGreeting && (
        <div className="chips-wrapper" style={{ marginBottom: 12 }}>
          <div className="chips-scroll">
            {CHIPS.map(chip => (
              <button key={chip} className="chip" onClick={() => handleChip(chip)}>
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div className="input-area">
        <div className="input-row">
          <input
            ref={inputRef}
            className="query-input"
            type="text"
            placeholder={listening ? '🎙️ Listening...' : 'Ask anything...'}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            autoFocus
          />
          <div className="input-actions">
            <button
              className={`mic-btn ${listening ? 'listening' : ''}`}
              onClick={handleMic}
              title="Voice input"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 15c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3zm-1 1.93c-3.94-.49-7-3.85-7-7.93h2c0 3.31 2.69 6 6 6s6-2.69 6-6h2c0 4.08-3.06 7.44-7 7.93V21h-2v-4.07z" />
              </svg>
            </button>
            <button
              className="send-btn"
              onClick={() => sendMessage(query)}
              disabled={!query.trim() || loading}
              title="Send"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Google color bar */}
      <div className="google-bar" />
    </div>
  )
}