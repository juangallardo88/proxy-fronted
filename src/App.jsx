import { useCallback, useEffect, useRef, useState } from 'react'
import { api, API_URL } from './api.js'
import { getOrCreateUserId, saveUserId } from './utils.js'
import { useNow } from './hooks/useNow.js'
import PlanBadge from './components/PlanBadge.jsx'
import QuotaCard from './components/QuotaCard.jsx'
import RateLimitCard from './components/RateLimitCard.jsx'
import UsageChart from './components/UsageChart.jsx'
import Chat from './components/Chat.jsx'
import UpgradeModal from './components/UpgradeModal.jsx'

let nextId = 1
const newId = () => nextId++

export default function App() {
  const [userId, setUserId] = useState(getOrCreateUserId)
  const [editingUser, setEditingUser] = useState(false)
  const [userDraft, setUserDraft] = useState('')

  const [status, setStatus] = useState(null)
  const [history, setHistory] = useState(null)
  const [minuteResetAt, setMinuteResetAt] = useState(null) // ms: próximo reinicio del contador por minuto
  const [blockedUntil, setBlockedUntil] = useState(null) // ms: fin del bloqueo por 429
  const [messages, setMessages] = useState([])
  const [sending, setSending] = useState(false)
  const [modal, setModal] = useState({ open: false, reason: 'manual' })
  const [connError, setConnError] = useState('')

  const now = useNow()

  const applyStatus = useCallback((s) => {
    setStatus(s)
    setMinuteResetAt(Date.now() + s.secondsUntilRateLimitReset * 1000)
  }, [])

  const refreshStatus = useCallback(async () => {
    try {
      applyStatus(await api.status(userId))
      setConnError('')
    } catch (e) {
      setConnError(e.message)
    }
  }, [userId, applyStatus])

  const refreshHistory = useCallback(async () => {
    try {
      setHistory(await api.history(userId))
    } catch {
      /* el error de conexión ya se muestra con el estado */
    }
  }, [userId])

  // Carga inicial y cuando cambia el usuario
  useEffect(() => {
    setStatus(null)
    setHistory(null)
    setMessages([])
    setBlockedUntil(null)
    refreshStatus()
    refreshHistory()
  }, [refreshStatus, refreshHistory])

  // Estado "en tiempo real": se consulta cada 10 s
  useEffect(() => {
    const id = setInterval(refreshStatus, 10_000)
    return () => clearInterval(id)
  }, [refreshStatus])

  // Cuando llega el reinicio del minuto o termina el bloqueo, se vuelve a consultar
  useEffect(() => {
    if (minuteResetAt && now >= minuteResetAt + 300) {
      setMinuteResetAt(null)
      refreshStatus()
    }
    if (blockedUntil && now >= blockedUntil) {
      setBlockedUntil(null)
      refreshStatus()
    }
  }, [now, minuteResetAt, blockedUntil, refreshStatus])

  const secondsToReset = minuteResetAt ? Math.max(0, (minuteResetAt - now) / 1000) : null

  const limitReached =
    status &&
    status.requestsPerMinuteLimit >= 0 &&
    status.requestsRemainingThisMinute === 0 &&
    minuteResetAt &&
    now < minuteResetAt
  const blocked429 = blockedUntil && now < blockedUntil
  const rateLimited = Boolean(limitReached || blocked429)
  const blockedSeconds = rateLimited
    ? Math.max(blocked429 ? (blockedUntil - now) / 1000 : 0, limitReached ? (minuteResetAt - now) / 1000 : 0)
    : 0

  const quotaExhausted = Boolean(status && status.monthlyTokenLimit >= 0 && status.tokensRemaining === 0)

  // Si la cuota se agota, se abre el modal de upgrade una vez
  const quotaModalShown = useRef(false)
  useEffect(() => {
    if (quotaExhausted && !quotaModalShown.current) {
      quotaModalShown.current = true
      setModal({ open: true, reason: 'quota' })
    }
    if (!quotaExhausted) quotaModalShown.current = false
  }, [quotaExhausted])

  const addSystem = (kind, text) => setMessages((ms) => [...ms, { id: newId(), role: 'system', kind, text }])

  async function send(prompt) {
    const pendingId = newId()
    setSending(true)
    setMessages((ms) => [...ms, { id: newId(), role: 'user', text: prompt }, { id: pendingId, role: 'pending' }])

    try {
      const r = await api.generate(userId, prompt)
      setMessages((ms) =>
        ms.map((m) =>
          m.id === pendingId
            ? { id: pendingId, role: 'ai', text: r.text, meta: { totalTokens: r.totalTokens, latencyMs: r.latencyMs } }
            : m
        )
      )
      // Actualización inmediata con lo que devolvieron los proxies
      setStatus((s) =>
        s
          ? {
              ...s,
              plan: r.plan,
              tokensUsed: r.tokensUsedThisMonth,
              tokensRemaining: r.tokensRemaining,
              requestsRemainingThisMinute: r.requestsRemainingThisMinute,
              requestsThisMinute:
                s.requestsPerMinuteLimit >= 0 ? s.requestsPerMinuteLimit - r.requestsRemainingThisMinute : s.requestsThisMinute + 1,
            }
          : s
      )
      refreshStatus()
      refreshHistory()
      return true
    } catch (e) {
      setMessages((ms) => ms.filter((m) => m.id !== pendingId))
      if (e.status === 429) {
        const secs = e.retryAfter || 60
        setBlockedUntil(Date.now() + secs * 1000)
        addSystem('rate', `429 · Superaste el límite de requests por minuto. Espera ${secs} s para volver a enviar.`)
      } else if (e.status === 402) {
        addSystem('quota', '402 · Agotaste la cuota mensual de tokens de tu plan.')
        quotaModalShown.current = true
        setModal({ open: true, reason: 'quota' })
      } else {
        addSystem('error', e.message)
      }
      refreshStatus()
      return false
    } finally {
      setSending(false)
    }
  }

  async function upgrade(targetPlan, cardLast4) {
    const res = await api.upgrade(userId, { targetPlan, paymentMethod: 'CARD', cardLast4 })
    applyStatus(res.status)
    setBlockedUntil(null)
    refreshHistory()
    addSystem('success', `Plan mejorado de ${res.previousPlan} a ${res.newPlan}. Transacción ${res.transactionId}.`)
    return res
  }

  function saveUser(e) {
    e.preventDefault()
    const id = userDraft.trim()
    if (/^[A-Za-z0-9_.@-]{1,64}$/.test(id)) {
      saveUserId(id)
      setUserId(id)
      setEditingUser(false)
    }
  }

  const canUpgrade = status && status.plan !== 'ENTERPRISE'

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden="true">
            P
          </span>
          <div>
            <h1>Proxy IA</h1>
            <p>Rate limiting y cuotas por plan</p>
          </div>
        </div>

        <div className="topbar-right">
          {editingUser ? (
            <form className="user-form" onSubmit={saveUser}>
              <input
                value={userDraft}
                onChange={(e) => setUserDraft(e.target.value)}
                aria-label="Nombre de usuario"
                autoFocus
                maxLength={64}
              />
              <button className="btn btn-small btn-primary">Usar</button>
              <button type="button" className="btn btn-small btn-ghost" onClick={() => setEditingUser(false)}>
                ×
              </button>
            </form>
          ) : (
            <button
              className="user-chip"
              onClick={() => {
                setUserDraft(userId)
                setEditingUser(true)
              }}
              title="Cambiar de usuario"
            >
              <span className="avatar" aria-hidden="true">
                {userId.slice(0, 1).toUpperCase()}
              </span>
              {userId}
            </button>
          )}
          <PlanBadge plan={status?.plan} />
          {canUpgrade && (
            <button className="btn btn-small btn-accent" onClick={() => setModal({ open: true, reason: 'manual' })}>
              Mejorar plan
            </button>
          )}
        </div>
      </header>

      {connError && (
        <div className="banner" role="alert">
          {connError} <span className="muted">({API_URL})</span>
          <button className="link" onClick={refreshStatus}>
            Reintentar
          </button>
        </div>
      )}

      <main className="layout">
        <Chat
          messages={messages}
          onSend={send}
          sending={sending}
          rateLimited={rateLimited}
          blockedSeconds={blockedSeconds}
          quotaExhausted={quotaExhausted}
          status={status}
          onUpgrade={() => setModal({ open: true, reason: 'quota' })}
        />

        <aside className="sidebar">
          <QuotaCard status={status} />
          <RateLimitCard
            status={status}
            secondsToReset={secondsToReset}
            rateLimited={rateLimited}
            blockedSeconds={blockedSeconds}
          />
          <UsageChart history={history} />
        </aside>
      </main>

      <UpgradeModal
        open={modal.open}
        reason={modal.reason}
        currentPlan={status?.plan}
        onClose={() => setModal((m) => ({ ...m, open: false }))}
        onUpgrade={upgrade}
      />
    </div>
  )
}
