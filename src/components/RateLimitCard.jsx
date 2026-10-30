import { formatCountdown } from '../utils.js'

export default function RateLimitCard({ status, secondsToReset, rateLimited, blockedSeconds }) {
  if (!status) return <section className="card skeleton" aria-busy="true" />

  const unlimited = status.requestsPerMinuteLimit < 0
  const used = status.requestsThisMinute
  const limit = status.requestsPerMinuteLimit
  const pct = unlimited ? 0 : Math.min(100, (used / limit) * 100)

  return (
    <section className={`card ${rateLimited ? 'card-alert' : ''}`}>
      <header className="card-head">
        <h2>Requests por minuto</h2>
        {secondsToReset != null && (
          <span className="countdown" title="Tiempo hasta el reinicio del contador">
            ⟳ {formatCountdown(secondsToReset)}
          </span>
        )}
      </header>

      <div className="rpm">
        <span className="rpm-count">{used}</span>
        <span className="rpm-limit">/ {unlimited ? '∞' : limit}</span>
      </div>

      {!unlimited && (
        <div className="progress thin" aria-hidden="true">
          <div className={`progress-fill ${rateLimited ? 'fill-danger' : 'fill-ok'}`} style={{ width: `${pct}%` }} />
        </div>
      )}

      {rateLimited ? (
        <p className="alert-text">
          Límite alcanzado. Podrás enviar de nuevo en <strong>{formatCountdown(blockedSeconds)}</strong>
        </p>
      ) : (
        <p className="muted small">
          {unlimited
            ? 'Sin límite de requests en tu plan.'
            : `Te quedan ${status.requestsRemainingThisMinute} requests en este minuto.`}
        </p>
      )}
    </section>
  )
}
