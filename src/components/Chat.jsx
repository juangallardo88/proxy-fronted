import { useEffect, useRef, useState } from 'react'
import { AVERAGE_COMPLETION_TOKENS, estimateTokens, fmt, formatCountdown } from '../utils.js'

const SUGERENCIAS = [
  '¿Qué es el patrón Proxy?',
  'Explícame qué significa un error 429',
  '¿Para qué sirve la carga diferida?',
]

export default function Chat({ messages, onSend, sending, rateLimited, blockedSeconds, quotaExhausted, status, onUpgrade }) {
  const [text, setText] = useState('')
  const listRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  const promptTokens = estimateTokens(text)
  const totalEstimate = promptTokens ? promptTokens + AVERAGE_COMPLETION_TOKENS : 0
  const limited = status && status.monthlyTokenLimit >= 0
  const exceeds = limited && totalEstimate > status.tokensRemaining

  const disabled = sending || rateLimited || quotaExhausted || !text.trim()

  let buttonLabel = 'Enviar'
  if (sending) buttonLabel = 'Generando…'
  else if (rateLimited) buttonLabel = `Espera ${formatCountdown(blockedSeconds)}`
  else if (quotaExhausted) buttonLabel = 'Cuota agotada'

  async function submit(e) {
    e?.preventDefault()
    if (disabled) return
    const ok = await onSend(text.trim())
    if (ok) setText('')
    inputRef.current?.focus()
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <section className="chat">
      <div className="messages" ref={listRef} aria-live="polite">
        {messages.length === 0 ? (
          <div className="empty">
            <div className="empty-icon" aria-hidden="true">✦</div>
            <h2>Pregúntale algo al servicio de IA</h2>
            <p className="muted">
              Cada mensaje pasa por el proxy de <b>rate limiting</b> y luego por el de <b>cuotas</b> antes de llegar
              al servicio de generación.
            </p>
            <div className="chips">
              {SUGERENCIAS.map((s) => (
                <button key={s} type="button" className="chip" onClick={() => setText(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => <Message key={m.id} m={m} onUpgrade={onUpgrade} />)
        )}
      </div>

      <form className="composer" onSubmit={submit}>
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={quotaExhausted ? 'Agotaste tu cuota. Mejora tu plan para seguir.' : 'Escribe tu prompt… (Enter para enviar)'}
          rows={2}
          maxLength={4000}
          aria-label="Prompt"
        />
        <div className="composer-bar">
          <div className={`estimator ${exceeds ? 'estimator-warn' : ''}`} aria-live="polite">
            {promptTokens > 0 ? (
              <>
                <span className="estimator-total">≈ {fmt(totalEstimate)} tokens</span>
                <span className="muted">
                  {' '}
                  ({fmt(promptTokens)} del prompt + ~{AVERAGE_COMPLETION_TOKENS} de respuesta)
                </span>
                {exceeds && <span className="warn-text"> · supera tus tokens disponibles</span>}
              </>
            ) : (
              <span className="muted">Escribe para ver cuántos tokens consumirá</span>
            )}
          </div>
          <button type="submit" className={`btn btn-primary ${rateLimited ? 'btn-blocked' : ''}`} disabled={disabled}>
            {buttonLabel}
          </button>
        </div>
      </form>
    </section>
  )
}

function Message({ m, onUpgrade }) {
  if (m.role === 'pending') {
    return (
      <div className="msg msg-ai">
        <div className="bubble typing" aria-label="Generando respuesta">
          <span />
          <span />
          <span />
        </div>
      </div>
    )
  }
  if (m.role === 'system') {
    return (
      <div className={`notice notice-${m.kind}`}>
        <span>{m.text}</span>
        {m.kind === 'quota' && (
          <button type="button" className="link" onClick={onUpgrade}>
            Mejorar plan
          </button>
        )}
      </div>
    )
  }
  return (
    <div className={`msg msg-${m.role === 'user' ? 'user' : 'ai'}`}>
      <div className="bubble">{m.text}</div>
      {m.meta && (
        <div className="meta">
          {fmt(m.meta.totalTokens)} tokens · {(m.meta.latencyMs / 1000).toFixed(1)} s
        </div>
      )}
    </div>
  )
}
