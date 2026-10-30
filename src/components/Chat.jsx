import { useEffect, useRef, useState } from 'react'
import { AVERAGE_COMPLETION_TOKENS, estimateTokens, fmt, formatCountdown } from '../utils.js'
import { ProxyDiagram, ProxyTrace } from './ProxyChain.jsx'

const SUGERENCIAS = [
  '¿Qué es el patrón Proxy?',
  '¿Qué significa un error 429?',
  '¿Para qué sirve la carga diferida?',
]

export default function Chat({ messages, onSend, sending, rateLimited, blockedSeconds, quotaExhausted, status, onUpgrade }) {
  const [text, setText] = useState('')
  const listRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const el = listRef.current
    if (el && messages.length > 0) el.scrollTop = el.scrollHeight
  }, [messages])

  const promptTokens = estimateTokens(text)
  const totalEstimate = promptTokens ? promptTokens + AVERAGE_COMPLETION_TOKENS : 0
  const limited = status && status.monthlyTokenLimit >= 0
  const exceeds = limited && totalEstimate > status.tokensRemaining

  const disabled = sending || rateLimited || quotaExhausted || !text.trim()

  let buttonLabel = 'Enviar'
  if (sending) buttonLabel = 'Generando'
  else if (rateLimited) buttonLabel = `Espera ${formatCountdown(blockedSeconds)}`
  else if (quotaExhausted) buttonLabel = 'Sin tokens'

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
    <section className="chat" aria-label="Chat con el servicio de IA">
      <div className="messages" ref={listRef} aria-live="polite">
        {messages.length === 0 ? (
          <div className="intro">
            <h2>Cada mensaje pasa por dos controles antes de llegar a la IA</h2>
            <p className="muted">
              Primero se revisa cuántas requests llevas en este minuto y después cuántos tokens te quedan en el mes.
              Si alguno no alcanza, el mensaje se detiene ahí.
            </p>
            <ProxyDiagram status={status} />
            <div className="chips">
              <span className="muted small">Prueba con:</span>
              {SUGERENCIAS.map((s) => (
                <button key={s} type="button" className="chip" onClick={() => { setText(s); inputRef.current?.focus() }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => <Message key={m.id} m={m} onUpgrade={onUpgrade} />)
        )}
      </div>

      <form className={`composer ${rateLimited ? 'is-blocked' : ''}`} onSubmit={submit}>
        <div className="composer-box">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={quotaExhausted ? 'Te quedaste sin tokens este mes. Mejora tu plan para seguir.' : 'Escribe tu prompt'}
            rows={2}
            maxLength={4000}
            aria-label="Prompt"
            aria-describedby="estimator"
          />
          <button type="submit" className={`send ${rateLimited ? 'send-blocked' : ''}`} disabled={disabled}>
            {sending && <span className="spinner" aria-hidden="true" />}
            {buttonLabel}
          </button>
        </div>
        <p id="estimator" className={`estimator ${exceeds ? 'estimator-warn' : ''}`} aria-live="polite">
          {promptTokens > 0 ? (
            exceeds ? (
              <>
                Este mensaje usará unos <strong>{fmt(totalEstimate)} tokens</strong> y solo te quedan{' '}
                {fmt(status.tokensRemaining)}.
              </>
            ) : (
              <>
                Este mensaje usará unos <strong>{fmt(totalEstimate)} tokens</strong>: {fmt(promptTokens)} del prompt y cerca
                de {AVERAGE_COMPLETION_TOKENS} de la respuesta.
              </>
            )
          ) : (
            <>Enter para enviar, Shift + Enter para un salto de línea.</>
          )}
        </p>
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
      <div className={`notice notice-${m.kind}`} role={m.kind === 'success' ? 'status' : 'alert'}>
        {m.trace && <ProxyTrace trace={m.trace} />}
        <p>{m.text}</p>
        {m.kind === 'quota' && (
          <button type="button" className="notice-action" onClick={onUpgrade}>
            Mejorar plan
          </button>
        )}
      </div>
    )
  }

  if (m.role === 'user') {
    return (
      <div className="msg msg-user">
        <div className="bubble">{m.text}</div>
      </div>
    )
  }

  return (
    <div className="msg msg-ai">
      <div className="bubble">{m.text}</div>
      {m.meta && (
        <div className="msg-foot">
          <ProxyTrace trace={{ rate: 'pass', quota: 'pass', ai: 'pass' }} />
          <span className="msg-meta">
            {fmt(m.meta.totalTokens)} tokens en {(m.meta.latencyMs / 1000).toFixed(1).replace('.', ',')} s
          </span>
        </div>
      )}
    </div>
  )
}
