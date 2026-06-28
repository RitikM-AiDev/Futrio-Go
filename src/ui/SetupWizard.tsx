import { useState } from 'react'
import './SetupWizard.css'

interface Props {
  onComplete: (gemini: string, tavily: string, serper: string) => void
}

type Step = 'welcome' | 'gemini' | 'tavily' | 'serper' | 'done'

const STEP_ORDER: Step[] = ['welcome', 'gemini', 'tavily', 'serper', 'done']

function StepDots({ current }: { current: Step }) {
  const steps: Step[] = ['gemini', 'tavily', 'serper']
  return (
    <div className="sw-dots">
      {steps.map(s => (
        <span
          key={s}
          className={`sw-dot ${current === s ? 'active' : STEP_ORDER.indexOf(current) > STEP_ORDER.indexOf(s) ? 'done' : ''}`}
        />
      ))}
    </div>
  )
}

export default function SetupWizard({ onComplete }: Props) {
  const [step, setStep] = useState<Step>('welcome')
  const [gemini, setGemini] = useState('')
  const [tavily, setTavily] = useState('')
  const [serper, setSerper] = useState('')
  const [show, setShow] = useState({ gemini: false, tavily: false, serper: false })

  const next = () => {
    const idx = STEP_ORDER.indexOf(step)
    if (idx < STEP_ORDER.length - 1) setStep(STEP_ORDER[idx + 1])
  }

  const back = () => {
    const idx = STEP_ORDER.indexOf(step)
    if (idx > 0) setStep(STEP_ORDER[idx - 1])
  }

  const finish = () => {
    if (gemini.trim() && tavily.trim() && serper.trim()) {
      onComplete(gemini.trim(), tavily.trim(), serper.trim())
    }
  }

  const openLink = (url: string) => {
    const isElectron = typeof window !== 'undefined' && typeof (window as any).require === 'function'
    if (isElectron) {
      const { shell } = (window as any).require('electron')
      shell.openExternal(url)
    } else {
      window.open(url, '_blank')
    }
  }

  return (
    <div className="sw-overlay">
      <div className="sw-card">

        {/* ── WELCOME ── */}
        {step === 'welcome' && (
          <div className="sw-screen fade-in">
            <div className="sw-orb-wrap">
              <div className="sw-orb">
                <div className="sw-orb-ring" />
                <div className="sw-orb-inner">
                  <span className="sw-orb-fg">FG</span>
                </div>
              </div>
            </div>
            <h1 className="sw-title">Welcome to Futrio Go</h1>
            <p className="sw-sub">
              To get started, you'll need 3 free API keys.<br />
              We'll guide you through each one — it takes about 2 minutes.
            </p>
            <div className="sw-keys-preview">
              <div className="sw-key-badge gemini-badge">
                <span className="sw-badge-icon">✦</span>
                <div>
                  <div className="sw-badge-name">Gemini API Key</div>
                  <div className="sw-badge-src">Google AI Studio · Free</div>
                </div>
              </div>
              <div className="sw-key-badge tavily-badge">
                <span className="sw-badge-icon">🔍</span>
                <div>
                  <div className="sw-badge-name">Tavily API Key</div>
                  <div className="sw-badge-src">Tavily.com · Free tier</div>
                </div>
              </div>
              <div className="sw-key-badge serper-badge">
                <span className="sw-badge-icon">🌐</span>
                <div>
                  <div className="sw-badge-name">Serper API Key</div>
                  <div className="sw-badge-src">Serper.dev · Free tier</div>
                </div>
              </div>
            </div>
            <button className="sw-btn-primary" onClick={next}>
              Get Started →
            </button>
          </div>
        )}

        {/* ── GEMINI ── */}
        {step === 'gemini' && (
          <div className="sw-screen fade-in">
            <StepDots current="gemini" />
            <div className="sw-step-icon gemini-icon">✦</div>
            <h2 className="sw-step-title">Gemini API Key</h2>
            <p className="sw-step-desc">Get your free key from Google AI Studio</p>

            <div className="sw-steps-list">
              <div className="sw-step-item">
                <span className="sw-step-num">1</span>
                <span>Click the button below to open Google AI Studio</span>
              </div>
              <div className="sw-step-item">
                <span className="sw-step-num">2</span>
                <span>Sign in with your Google account</span>
              </div>
              <div className="sw-step-item">
                <span className="sw-step-num">3</span>
                <span>Click <strong>"Get API key"</strong> → <strong>"Create API key"</strong></span>
              </div>
              <div className="sw-step-item">
                <span className="sw-step-num">4</span>
                <span>Copy the key (starts with <code>AIza</code>) and paste below</span>
              </div>
            </div>

            <button
              className="sw-btn-outline"
              onClick={() => openLink('https://aistudio.google.com')}
            >
              <span>↗</span> Open Google AI Studio
            </button>

            <div className="sw-input-wrap">
              <input
                className="sw-input"
                type={show.gemini ? 'text' : 'password'}
                placeholder="AIzaSy..."
                value={gemini}
                onChange={e => setGemini(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && gemini.trim() && next()}
              />
              <button className="sw-eye" onClick={() => setShow(s => ({ ...s, gemini: !s.gemini }))}>
                {show.gemini ? '🙈' : '👁️'}
              </button>
            </div>

            <div className="sw-nav">
              <button className="sw-btn-ghost" onClick={back}>← Back</button>
              <button
                className="sw-btn-primary"
                disabled={!gemini.trim()}
                onClick={next}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* ── TAVILY ── */}
        {step === 'tavily' && (
          <div className="sw-screen fade-in">
            <StepDots current="tavily" />
            <div className="sw-step-icon tavily-icon">🔍</div>
            <h2 className="sw-step-title">Tavily API Key</h2>
            <p className="sw-step-desc">Powers AI-quality web search — free tier included</p>

            <div className="sw-steps-list">
              <div className="sw-step-item">
                <span className="sw-step-num">1</span>
                <span>Click below to open Tavily.com</span>
              </div>
              <div className="sw-step-item">
                <span className="sw-step-num">2</span>
                <span>Sign up or log in with Google / GitHub</span>
              </div>
              <div className="sw-step-item">
                <span className="sw-step-num">3</span>
                <span>Go to <strong>Dashboard → API Keys</strong></span>
              </div>
              <div className="sw-step-item">
                <span className="sw-step-num">4</span>
                <span>Copy your key (starts with <code>tvly-</code>) and paste below</span>
              </div>
            </div>

            <button
              className="sw-btn-outline"
              onClick={() => openLink('https://app.tavily.com')}
            >
              <span>↗</span> Open Tavily Dashboard
            </button>

            <div className="sw-input-wrap">
              <input
                className="sw-input"
                type={show.tavily ? 'text' : 'password'}
                placeholder="tvly-..."
                value={tavily}
                onChange={e => setTavily(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && tavily.trim() && next()}
              />
              <button className="sw-eye" onClick={() => setShow(s => ({ ...s, tavily: !s.tavily }))}>
                {show.tavily ? '🙈' : '👁️'}
              </button>
            </div>

            <div className="sw-nav">
              <button className="sw-btn-ghost" onClick={back}>← Back</button>
              <button
                className="sw-btn-primary"
                disabled={!tavily.trim()}
                onClick={next}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* ── SERPER ── */}
        {step === 'serper' && (
          <div className="sw-screen fade-in">
            <StepDots current="serper" />
            <div className="sw-step-icon serper-icon">🌐</div>
            <h2 className="sw-step-title">Serper API Key</h2>
            <p className="sw-step-desc">Google Search API — 2,500 free queries/month</p>

            <div className="sw-steps-list">
              <div className="sw-step-item">
                <span className="sw-step-num">1</span>
                <span>Click below to open Serper.dev</span>
              </div>
              <div className="sw-step-item">
                <span className="sw-step-num">2</span>
                <span>Sign up for a free account</span>
              </div>
              <div className="sw-step-item">
                <span className="sw-step-num">3</span>
                <span>Go to <strong>Dashboard → API Key</strong></span>
              </div>
              <div className="sw-step-item">
                <span className="sw-step-num">4</span>
                <span>Copy your key and paste it below</span>
              </div>
            </div>

            <button
              className="sw-btn-outline"
              onClick={() => openLink('https://serper.dev')}
            >
              <span>↗</span> Open Serper Dashboard
            </button>

            <div className="sw-input-wrap">
              <input
                className="sw-input"
                type={show.serper ? 'text' : 'password'}
                placeholder="Paste your Serper API key..."
                value={serper}
                onChange={e => setSerper(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && serper.trim() && next()}
              />
              <button className="sw-eye" onClick={() => setShow(s => ({ ...s, serper: !s.serper }))}>
                {show.serper ? '🙈' : '👁️'}
              </button>
            </div>

            <div className="sw-nav">
              <button className="sw-btn-ghost" onClick={back}>← Back</button>
              <button
                className="sw-btn-primary"
                disabled={!serper.trim()}
                onClick={next}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* ── DONE ── */}
        {step === 'done' && (
          <div className="sw-screen fade-in sw-done-screen">
            <div className="sw-success-ring">
              <div className="sw-success-check">✓</div>
            </div>
            <h2 className="sw-title">All Set!</h2>
            <p className="sw-sub">
              Your API keys are saved securely on your device.<br />
              You're ready to use Futrio Go.
            </p>

            <div className="sw-keys-summary">
              <div className="sw-summary-row">
                <span className="sw-summary-icon gemini-icon-sm">✦</span>
                <span className="sw-summary-label">Gemini</span>
                <span className="sw-summary-val">{gemini.slice(0, 8)}••••</span>
              </div>
              <div className="sw-summary-row">
                <span className="sw-summary-icon tavily-icon-sm">🔍</span>
                <span className="sw-summary-label">Tavily</span>
                <span className="sw-summary-val">{tavily.slice(0, 8)}••••</span>
              </div>
              <div className="sw-summary-row">
                <span className="sw-summary-icon serper-icon-sm">🌐</span>
                <span className="sw-summary-label">Serper</span>
                <span className="sw-summary-val">{serper.slice(0, 8)}••••</span>
              </div>
            </div>

            <button className="sw-btn-primary sw-btn-launch" onClick={finish}>
              Launch Futrio Go 🚀
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
