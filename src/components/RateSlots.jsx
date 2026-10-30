import { formatCountdown } from '../utils.js'

const RING = 2 * Math.PI * 15

export default function RateSlots({ status, secondsToReset, rateLimited, blockedSeconds }) {
  if (!status) return <section className="panel skeleton short" aria-busy="true" />

  const unlimited = status.requestsPerMinuteLimit < 0
  const limit = status.requestsPerMinuteLimit
  const used = Math.min(status.requestsThisMinute, unlimited ? Infinity : limit)
  const seconds = rateLimited ? blockedSeconds : secondsToReset ?? 0
  const ringFrac = Math.min(1, Math.max(0, seconds / 60))

  return (
    <section className={`panel slots-panel ${rateLimited ? 'is-blocked' : ''}`} aria-labelledby="slots-title">
      <div className="slots-head">
        <div>
          <h2 id="slots-title" className="panel-title">Requests de este minuto</h2>
          <p className="slots-count">
            <strong>{status.requestsThisMinute}</strong>
            <span>{unlimited ? 'sin límite' : `de ${limit}`}</span>
          </p>
        </div>

        <div className="timer" title={rateLimited ? 'Tiempo hasta que puedas volver a enviar' : 'Tiempo hasta que el contador vuelva a cero'}>
          <svg viewBox="0 0 36 36" aria-hidden="true">
            <circle cx="18" cy="18" r="15" className="timer-track" />
            <circle
              cx="18"
              cy="18"
              r="15"
              className="timer-fill"
              strokeDasharray={`${RING * ringFrac} ${RING}`}
              transform="rotate(-90 18 18)"
            />
          </svg>
          <span>{formatCountdown(seconds)}</span>
        </div>
      </div>

      {!unlimited && (
        <div className={`slots ${limit > 20 ? 'slots-dense' : ''}`} aria-hidden="true">
          {Array.from({ length: limit }, (_, i) => (
            <span key={i} className={`slot ${i < used ? 'slot-used' : ''}`} />
          ))}
        </div>
      )}

      <p className={rateLimited ? 'slots-msg blocked' : 'slots-msg'} role={rateLimited ? 'status' : undefined}>
        {rateLimited
          ? `Llegaste al límite. Podrás enviar de nuevo en ${formatCountdown(blockedSeconds)}.`
          : unlimited
            ? 'Tu plan no limita las requests por minuto.'
            : `Puedes enviar ${status.requestsRemainingThisMinute} más antes del reinicio.`}
      </p>
    </section>
  )
}
